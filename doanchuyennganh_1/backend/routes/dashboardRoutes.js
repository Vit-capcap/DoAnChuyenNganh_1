import express from "express";
import db from "../config/db.js";

const router = express.Router();

router.get("/dashboard", async (req, res) => {
  try {
    const [[students]] = await db.query("SELECT COUNT(*) AS total FROM Student");
    const [[teachers]] = await db.query("SELECT COUNT(*) AS total FROM Teacher");
    const [[rooms]] = await db.query("SELECT COUNT(*) AS total FROM ClassRoom");
    const [[subjects]] = await db.query("SELECT COUNT(*) AS total FROM Subject");

    /*
      Ngày mốc để lấy dữ liệu biểu đồ 7 ngày.

      Với baseDate = 2025-11-18
      hệ thống sẽ lấy dữ liệu từ:
      2025-11-12 đến 2025-11-18
    */
    const baseDate = "2025-11-18";

    /*
      Tỷ lệ điểm danh tổng toàn hệ thống.
    */
    const [[attendance]] = await db.query(
      `
      SELECT
        COUNT(*) AS total_attendance,

        COALESCE(
          SUM(
            CASE 
              WHEN TRIM(UPPER(status)) IN ('PRESENT', 'LATE') THEN 1
              ELSE 0
            END
          ),
          0
        ) AS attended_count,

        CASE 
          WHEN COUNT(*) = 0 THEN 0
          ELSE ROUND(
            COALESCE(
              SUM(
                CASE 
                  WHEN TRIM(UPPER(status)) IN ('PRESENT', 'LATE') THEN 1
                  ELSE 0
                END
              ),
              0
            ) / COUNT(*) * 100,
            2
          )
        END AS attendance_percent
      FROM Attendance
      `
    );

    /*
      Xu hướng điểm danh 7 ngày.
      Lấy theo DATE(check_in_time).
    */
    const [trendRows] = await db.query(
      `
      SELECT
        DATE(check_in_time) AS attendance_date,

        COUNT(id_attendance) AS total_attendance,

        COALESCE(
          SUM(
            CASE
              WHEN TRIM(UPPER(status)) IN ('PRESENT', 'LATE') THEN 1
              ELSE 0
            END
          ),
          0
        ) AS attended_count,

        CASE
          WHEN COUNT(id_attendance) = 0 THEN 0
          ELSE ROUND(
            COALESCE(
              SUM(
                CASE
                  WHEN TRIM(UPPER(status)) IN ('PRESENT', 'LATE') THEN 1
                  ELSE 0
                END
              ),
              0
            ) / COUNT(id_attendance) * 100,
            2
          )
        END AS attendance_percent

      FROM Attendance

      WHERE check_in_time IS NOT NULL
        AND DATE(check_in_time) BETWEEN DATE_SUB(?, INTERVAL 6 DAY) AND ?

      GROUP BY DATE(check_in_time)
      ORDER BY DATE(check_in_time)
      `,
      [baseDate, baseDate]
    );

    console.log("trendRows:", trendRows);

    /*
      Tạo đủ 7 ngày để frontend luôn có 7 điểm.
    */
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

    const trendMap = new Map(
      trendRows.map((row) => {
        const dateKey = row.attendance_date instanceof Date
          ? row.attendance_date.toISOString().slice(0, 10)
          : String(row.attendance_date).slice(0, 10);

        return [
          dateKey,
          {
            totalAttendance: Number(row.total_attendance || 0),
            attendedCount: Number(row.attended_count || 0),
            attendancePercent: Number(row.attendance_percent || 0),
          },
        ];
      })
    );

    const attendanceTrend = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(`${baseDate}T00:00:00`);
      date.setDate(date.getDate() - i);

      const dateKey = date.toISOString().slice(0, 10);
      const dayLabel = dayNames[date.getDay()];

      const data = trendMap.get(dateKey) || {
        totalAttendance: 0,
        attendedCount: 0,
        attendancePercent: 0,
      };

      attendanceTrend.push({
        date: dateKey,
        day: dayLabel,
        totalAttendance: data.totalAttendance,
        attendedCount: data.attendedCount,
        attendancePercent: data.attendancePercent,
      });
    }

    res.json({
      totalStudents: Number(students.total || 0),
      totalTeachers: Number(teachers.total || 0),
      totalRooms: Number(rooms.total || 0),
      totalSubjects: Number(subjects.total || 0),

      totalAttendance: Number(attendance.total_attendance || 0),
      attendedCount: Number(attendance.attended_count || 0),
      attendancePercent: Number(attendance.attendance_percent || 0),

      attendanceTrend,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Lỗi lấy dữ liệu dashboard",
      error: error.message,
    });
  }
});

export default router;