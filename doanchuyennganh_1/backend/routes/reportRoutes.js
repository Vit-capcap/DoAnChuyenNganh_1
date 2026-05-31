import express from "express";
import db from "../config/db.js";

const router = express.Router();

function getDefaultDateRange(period) {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);

  const startDate = new Date(now);

  if (period === "week") {
    startDate.setDate(now.getDate() - 6);
  } else if (period === "semester") {
    startDate.setMonth(now.getMonth() - 5);
  } else {
    startDate.setDate(1);
  }

  return {
    from_date: startDate.toISOString().slice(0, 10),
    to_date: end,
  };
}

function buildWhere(query) {
  const period = query.period || "month";

  const defaultRange = getDefaultDateRange(period);

  const from_date = query.from_date || defaultRange.from_date;
  const to_date = query.to_date || defaultRange.to_date;

  const class_name = query.class_name || "";
  const id_subject = query.id_subject || "";

  let whereSql = `
    WHERE se.session_date BETWEEN ? AND ?
  `;

  const params = [from_date, to_date];

  if (class_name) {
    whereSql += ` AND st.class_name = ?`;
    params.push(class_name);
  }

  if (id_subject) {
    whereSql += ` AND sub.id_subject = ?`;
    params.push(Number(id_subject));
  }

  return {
    whereSql,
    params,
    from_date,
    to_date,
  };
}

/*
|--------------------------------------------------------------------------
| API: Options cho báo cáo
|--------------------------------------------------------------------------
| GET /api/reports/options
|--------------------------------------------------------------------------
*/
router.get("/options", async (req, res) => {
  try {
    const [classes] = await db.query(
      `
      SELECT DISTINCT class_name
      FROM Student
      WHERE class_name IS NOT NULL AND class_name <> ''
      ORDER BY class_name ASC
      `
    );

    const [subjects] = await db.query(
      `
      SELECT
        id_subject,
        subject_code,
        subject_name
      FROM Subject
      ORDER BY subject_name ASC
      `
    );

    res.status(200).json({
      classes,
      subjects,
    });
  } catch (error) {
    console.error("Lỗi lấy options báo cáo:", error);

    res.status(500).json({
      message: "Lỗi lấy options báo cáo",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| API: Dữ liệu báo cáo tổng hợp
|--------------------------------------------------------------------------
| GET /api/reports
|--------------------------------------------------------------------------
*/
router.get("/", async (req, res) => {
  try {
    const { whereSql, params, from_date, to_date } = buildWhere(req.query);

    const baseJoin = `
      FROM Attendance a
      INNER JOIN Student st
        ON st.id_student = a.id_student
      INNER JOIN Session se
        ON se.id_session = a.id_session
      INNER JOIN Schedule sch
        ON sch.id_schedule = se.id_schedule
      INNER JOIN CourseClass cc
        ON cc.id_course_class = sch.id_course_class
      INNER JOIN Subject sub
        ON sub.id_subject = cc.id_subject
      INNER JOIN ClassRoom room
        ON room.id_room = sch.id_room
    `;

    const [kpiRows] = await db.query(
      `
      SELECT
        COUNT(DISTINCT se.id_session) AS total_sessions,

        COUNT(*) AS total_attendance,

        SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) AS present_count,

        SUM(CASE WHEN a.status = 'LATE' THEN 1 ELSE 0 END) AS late_count,

        SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) AS absent_count,

        ROUND(
          (
            SUM(CASE WHEN a.status IN ('PRESENT', 'LATE') THEN 1 ELSE 0 END)
            / NULLIF(COUNT(*), 0)
          ) * 100,
          2
        ) AS attendance_rate

      ${baseJoin}
      ${whereSql}
      `,
      params
    );

    const [topClassRows] = await db.query(
      `
      SELECT
        st.class_name,

        COUNT(*) AS total_attendance,

        ROUND(
          (
            SUM(CASE WHEN a.status IN ('PRESENT', 'LATE') THEN 1 ELSE 0 END)
            / NULLIF(COUNT(*), 0)
          ) * 100,
          2
        ) AS attendance_rate

      ${baseJoin}
      ${whereSql}
        AND st.class_name IS NOT NULL
        AND st.class_name <> ''

      GROUP BY st.class_name

      HAVING total_attendance > 0

      ORDER BY attendance_rate DESC, total_attendance DESC

      LIMIT 1
      `,
      params
    );

    const [trendRows] = await db.query(
      `
      SELECT
        se.session_date AS report_date,

        COUNT(*) AS total_attendance,

        SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) AS present_count,

        SUM(CASE WHEN a.status = 'LATE' THEN 1 ELSE 0 END) AS late_count,

        SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) AS absent_count,

        ROUND(
          (
            SUM(CASE WHEN a.status IN ('PRESENT', 'LATE') THEN 1 ELSE 0 END)
            / NULLIF(COUNT(*), 0)
          ) * 100,
          2
        ) AS attendance_rate

      ${baseJoin}
      ${whereSql}

      GROUP BY se.session_date

      ORDER BY se.session_date ASC
      `,
      params
    );

    const [absentStudents] = await db.query(
      `
      SELECT
        st.id_student,
        st.student_code,
        st.full_name,
        st.class_name,

        COUNT(*) AS absent_count

      ${baseJoin}
      ${whereSql}
        AND a.status = 'ABSENT'

      GROUP BY
        st.id_student,
        st.student_code,
        st.full_name,
        st.class_name

      ORDER BY absent_count DESC

      LIMIT 10
      `,
      params
    );

    const [subjectStats] = await db.query(
      `
      SELECT
        sub.id_subject,
        sub.subject_code,
        sub.subject_name,

        COUNT(*) AS total_attendance,

        SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) AS present_count,

        SUM(CASE WHEN a.status = 'LATE' THEN 1 ELSE 0 END) AS late_count,

        SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) AS absent_count,

        ROUND(
          (
            SUM(CASE WHEN a.status IN ('PRESENT', 'LATE') THEN 1 ELSE 0 END)
            / NULLIF(COUNT(*), 0)
          ) * 100,
          2
        ) AS attendance_rate

      ${baseJoin}
      ${whereSql}

      GROUP BY
        sub.id_subject,
        sub.subject_code,
        sub.subject_name

      ORDER BY attendance_rate DESC, total_attendance DESC

      LIMIT 10
      `,
      params
    );

    const kpis = kpiRows[0] || {
      total_sessions: 0,
      total_attendance: 0,
      present_count: 0,
      late_count: 0,
      absent_count: 0,
      attendance_rate: 0,
    };

    res.status(200).json({
      filters: {
        from_date,
        to_date,
      },
      kpis: {
        total_sessions: Number(kpis.total_sessions || 0),
        total_attendance: Number(kpis.total_attendance || 0),
        present_count: Number(kpis.present_count || 0),
        late_count: Number(kpis.late_count || 0),
        absent_count: Number(kpis.absent_count || 0),
        attendance_rate: Number(kpis.attendance_rate || 0),
        top_class: topClassRows[0]?.class_name || "Chưa có dữ liệu",
      },
      trend: trendRows,
      absentStudents,
      subjectStats,
    });
  } catch (error) {
    console.error("Lỗi lấy dữ liệu báo cáo:", error);

    res.status(500).json({
      message: "Lỗi lấy dữ liệu báo cáo",
      error: error.message,
      code: error.code,
    });
  }
});

export default router;