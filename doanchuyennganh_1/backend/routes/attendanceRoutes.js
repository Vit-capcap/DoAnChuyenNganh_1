import express from "express";
import db from "../config/db.js";

const router = express.Router();

const validAttendanceStatus = ["PRESENT", "ABSENT", "LATE"];

function buildDateFilter(date) {
  if (date) return date;

  const now = new Date();
  return now.toISOString().slice(0, 10);
}

/*
|--------------------------------------------------------------------------
| API: Lấy options bộ lọc điểm danh
|--------------------------------------------------------------------------
| GET /api/attendance/options
|--------------------------------------------------------------------------
*/
router.get("/options", async (req, res) => {
  try {
    const [classes] = await db.query(
      `
      SELECT DISTINCT
        s.class_name
      FROM Student s
      WHERE s.class_name IS NOT NULL AND s.class_name <> ''
      ORDER BY s.class_name ASC
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

    const [courseClasses] = await db.query(
      `
      SELECT
        cc.id_course_class,
        cc.class_code,
        sub.subject_name,
        t.full_name AS teacher_name
      FROM CourseClass cc
      INNER JOIN Subject sub
        ON sub.id_subject = cc.id_subject
      INNER JOIN Teacher t
        ON t.id_teacher = cc.id_teacher
      ORDER BY cc.class_code ASC
      `
    );

    const [sessions] = await db.query(
      `
      SELECT
        se.id_session,
        se.session_date,
        se.session_number,
        se.status AS session_status,

        sch.start_time,
        sch.end_time,

        cc.class_code,

        sub.subject_name,

        r.room_code,
        r.room_name

      FROM Session se
      INNER JOIN Schedule sch
        ON sch.id_schedule = se.id_schedule
      INNER JOIN CourseClass cc
        ON cc.id_course_class = sch.id_course_class
      INNER JOIN Subject sub
        ON sub.id_subject = cc.id_subject
      INNER JOIN ClassRoom r
        ON r.id_room = sch.id_room

      ORDER BY se.session_date DESC, sch.start_time DESC
      LIMIT 100
      `
    );

    res.status(200).json({
      classes,
      subjects,
      courseClasses,
      sessions,
      statuses: validAttendanceStatus,
    });
  } catch (error) {
    console.error("Lỗi lấy options điểm danh:", error);

    res.status(500).json({
      message: "Lỗi lấy options điểm danh",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| API: Lấy danh sách điểm danh + thống kê
|--------------------------------------------------------------------------
| GET /api/attendance
|--------------------------------------------------------------------------
*/
router.get("/", async (req, res) => {
  try {
    const search = req.query.search || "";
    const class_name = req.query.class_name || "";
    const id_subject = req.query.id_subject || "";
    const status = req.query.status || "";
    const date = buildDateFilter(req.query.date || "");
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const offset = (page - 1) * limit;

    let whereSql = `
      WHERE se.session_date = ?
        AND (
          s.student_code LIKE ?
          OR s.full_name LIKE ?
          OR s.email LIKE ?
          OR s.class_name LIKE ?
          OR sub.subject_name LIKE ?
          OR cc.class_code LIKE ?
          OR r.room_code LIKE ?
        )
    `;

    const baseParams = [
      date,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
    ];

    if (class_name) {
      whereSql += ` AND s.class_name = ?`;
      baseParams.push(class_name);
    }

    if (id_subject) {
      whereSql += ` AND sub.id_subject = ?`;
      baseParams.push(Number(id_subject));
    }

    if (status) {
      whereSql += ` AND a.status = ?`;
      baseParams.push(status);
    }

    const [countRows] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM Attendance a
      INNER JOIN Student s
        ON s.id_student = a.id_student
      INNER JOIN Session se
        ON se.id_session = a.id_session
      INNER JOIN Schedule sch
        ON sch.id_schedule = se.id_schedule
      INNER JOIN CourseClass cc
        ON cc.id_course_class = sch.id_course_class
      INNER JOIN Subject sub
        ON sub.id_subject = cc.id_subject
      INNER JOIN ClassRoom r
        ON r.id_room = sch.id_room
      ${whereSql}
      `,
      baseParams
    );

    const total = countRows[0]?.total || 0;

    const [statsRows] = await db.query(
      `
      SELECT
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
      FROM Attendance a
      INNER JOIN Student s
        ON s.id_student = a.id_student
      INNER JOIN Session se
        ON se.id_session = a.id_session
      INNER JOIN Schedule sch
        ON sch.id_schedule = se.id_schedule
      INNER JOIN CourseClass cc
        ON cc.id_course_class = sch.id_course_class
      INNER JOIN Subject sub
        ON sub.id_subject = cc.id_subject
      INNER JOIN ClassRoom r
        ON r.id_room = sch.id_room
      ${whereSql}
      `,
      baseParams
    );

    const [attendances] = await db.query(
      `
      SELECT
        a.id_attendance,
        a.id_session,
        a.id_student,
        a.check_in_time,
        a.status,
        a.confidence_score,
        a.face_image,
        a.note,

        s.student_code,
        s.full_name,
        s.class_name,
        s.faculty,
        s.email,
        s.phone,
        s.avatar,

        se.session_date,
        se.session_number,
        se.status AS session_status,

        sch.start_time,
        sch.end_time,

        cc.id_course_class,
        cc.class_code,

        sub.id_subject,
        sub.subject_code,
        sub.subject_name,

        r.id_room,
        r.room_code,
        r.room_name,
        r.building,
        r.floor

      FROM Attendance a
      INNER JOIN Student s
        ON s.id_student = a.id_student
      INNER JOIN Session se
        ON se.id_session = a.id_session
      INNER JOIN Schedule sch
        ON sch.id_schedule = se.id_schedule
      INNER JOIN CourseClass cc
        ON cc.id_course_class = sch.id_course_class
      INNER JOIN Subject sub
        ON sub.id_subject = cc.id_subject
      INNER JOIN ClassRoom r
        ON r.id_room = sch.id_room

      ${whereSql}

      ORDER BY
        se.session_date DESC,
        sch.start_time ASC,
        s.full_name ASC

      LIMIT ? OFFSET ?
      `,
      [...baseParams, limit, offset]
    );

    res.status(200).json({
      date,
      stats: statsRows[0] || {
        total_attendance: 0,
        present_count: 0,
        late_count: 0,
        absent_count: 0,
        attendance_rate: 0,
      },
      attendances,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách điểm danh:", error);

    res.status(500).json({
      message: "Lỗi lấy danh sách điểm danh",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| API: Điểm danh thủ công
|--------------------------------------------------------------------------
| POST /api/attendance
|--------------------------------------------------------------------------
*/
router.post("/", async (req, res) => {
  const {
    id_session,
    id_student,
    status,
    check_in_time,
    confidence_score,
    face_image,
    note,
  } = req.body;

  if (!id_session || !id_student || !status) {
    return res.status(400).json({
      message: "Vui lòng chọn buổi học, sinh viên và trạng thái điểm danh",
    });
  }

  if (!validAttendanceStatus.includes(status)) {
    return res.status(400).json({
      message: "Trạng thái điểm danh không hợp lệ",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [sessions] = await connection.query(
      `
      SELECT id_session
      FROM Session
      WHERE id_session = ?
      LIMIT 1
      `,
      [Number(id_session)]
    );

    if (sessions.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Buổi học không tồn tại",
      });
    }

    const [students] = await connection.query(
      `
      SELECT id_student
      FROM Student
      WHERE id_student = ?
      LIMIT 1
      `,
      [Number(id_student)]
    );

    if (students.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Sinh viên không tồn tại",
      });
    }

    const [existing] = await connection.query(
      `
      SELECT id_attendance
      FROM Attendance
      WHERE id_session = ? AND id_student = ?
      LIMIT 1
      `,
      [Number(id_session), Number(id_student)]
    );

    if (existing.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Sinh viên này đã có bản ghi điểm danh trong buổi học này",
      });
    }

    const [result] = await connection.query(
      `
      INSERT INTO Attendance (
        id_session,
        id_student,
        check_in_time,
        status,
        confidence_score,
        face_image,
        note
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        Number(id_session),
        Number(id_student),
        check_in_time || new Date(),
        status,
        confidence_score || null,
        face_image || null,
        note || null,
      ]
    );

    await connection.commit();

    res.status(201).json({
      message: "Điểm danh thủ công thành công",
      id_attendance: result.insertId,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi điểm danh thủ công:", error);

    res.status(500).json({
      message: "Lỗi điểm danh thủ công",
      error: error.message,
      code: error.code,
    });
  } finally {
    connection.release();
  }
});

/*
|--------------------------------------------------------------------------
| API: Cập nhật trạng thái điểm danh
|--------------------------------------------------------------------------
| PUT /api/attendance/:id
|--------------------------------------------------------------------------
*/
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { status, check_in_time, confidence_score, note } = req.body;

  if (!status) {
    return res.status(400).json({
      message: "Vui lòng chọn trạng thái điểm danh",
    });
  }

  if (!validAttendanceStatus.includes(status)) {
    return res.status(400).json({
      message: "Trạng thái điểm danh không hợp lệ",
    });
  }

  try {
    const [attendances] = await db.query(
      `
      SELECT id_attendance
      FROM Attendance
      WHERE id_attendance = ?
      LIMIT 1
      `,
      [id]
    );

    if (attendances.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy bản ghi điểm danh",
      });
    }

    await db.query(
      `
      UPDATE Attendance
      SET
        status = ?,
        check_in_time = ?,
        confidence_score = ?,
        note = ?
      WHERE id_attendance = ?
      `,
      [
        status,
        check_in_time || null,
        confidence_score || null,
        note || null,
        id,
      ]
    );

    res.status(200).json({
      message: "Cập nhật điểm danh thành công",
    });
  } catch (error) {
    console.error("Lỗi cập nhật điểm danh:", error);

    res.status(500).json({
      message: "Lỗi cập nhật điểm danh",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| API: Xóa bản ghi điểm danh
|--------------------------------------------------------------------------
| DELETE /api/attendance/:id
|--------------------------------------------------------------------------
*/
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [attendances] = await db.query(
      `
      SELECT id_attendance
      FROM Attendance
      WHERE id_attendance = ?
      LIMIT 1
      `,
      [id]
    );

    if (attendances.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy bản ghi điểm danh",
      });
    }

    await db.query(
      `
      DELETE FROM Attendance
      WHERE id_attendance = ?
      `,
      [id]
    );

    res.status(200).json({
      message: "Xóa điểm danh thành công",
    });
  } catch (error) {
    console.error("Lỗi xóa điểm danh:", error);

    res.status(500).json({
      message: "Lỗi xóa điểm danh",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| API: Tìm sinh viên cho điểm danh thủ công
|--------------------------------------------------------------------------
| GET /api/attendance/search-students?search=
|--------------------------------------------------------------------------
*/
router.get("/search-students/list", async (req, res) => {
  try {
    const search = req.query.search || "";

    const [students] = await db.query(
      `
      SELECT
        id_student,
        student_code,
        full_name,
        class_name,
        faculty,
        avatar
      FROM Student
      WHERE
        student_code LIKE ?
        OR full_name LIKE ?
        OR class_name LIKE ?
      ORDER BY full_name ASC
      LIMIT 30
      `,
      [`%${search}%`, `%${search}%`, `%${search}%`]
    );

    res.status(200).json(students);
  } catch (error) {
    console.error("Lỗi tìm sinh viên:", error);

    res.status(500).json({
      message: "Lỗi tìm sinh viên",
      error: error.message,
      code: error.code,
    });
  }
});

export default router;