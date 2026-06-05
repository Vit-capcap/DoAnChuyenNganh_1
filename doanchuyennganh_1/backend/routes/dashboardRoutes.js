import express from "express";
import db from "../config/db.js";

const router = express.Router();

/* =========================================================
   FILE: dashboardRoutes.js
   ---------------------------------------------------------
   Chức năng:
   - Lấy dữ liệu tổng quan cho Admin Dashboard.
   - Tính tổng sinh viên, giáo viên, phòng học, môn học.
   - Tính tỷ lệ điểm danh toàn hệ thống.
   - Tạo biểu đồ xu hướng điểm danh 7 ngày gần nhất.

   LƯU Ý QUAN TRỌNG:
   - Database mới dùng tên bảng chữ thường:
     student, teacher, classroom, subject, attendance, session.
   - Không dùng ngày cố định như 2025-11-18.
   - Dùng CURDATE() để lấy dữ liệu theo ngày hiện tại.
========================================================= */


/* =========================================================
   1. HELPER: CHUẨN HÓA SỐ
   ---------------------------------------------------------
   Chức năng:
   - Chuyển giá trị null / undefined / NaN thành số an toàn.
========================================================= */
function toNumber(value) {
  const number = Number(value || 0);

  return Number.isFinite(number) ? number : 0;
}


/* =========================================================
   2. HELPER: CHUẨN HÓA PHẦN TRĂM
   ---------------------------------------------------------
   Chức năng:
   - Tránh lỗi NaN.
   - Làm tròn 2 chữ số thập phân.
========================================================= */
function normalizePercent(value) {
  const number = Number(value || 0);

  return Number.isFinite(number) ? Number(number.toFixed(2)) : 0;
}


/* =========================================================
   3. HELPER: TẠO CHUỖI NGÀY YYYY-MM-DD
   ---------------------------------------------------------
   Chức năng:
   - Tạo key ngày dùng cho biểu đồ.
   - Tránh lệch ngày khi xử lý bằng JavaScript.
========================================================= */
function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


/* =========================================================
   4. HELPER: CHUẨN HÓA LỖI SERVER
   ---------------------------------------------------------
   Chức năng:
   - Trả lỗi về frontend theo cùng cấu trúc.
========================================================= */
function sendServerError(res, message, error) {
  return res.status(500).json({
    message,
    error: error.message,
    code: error.code,
  });
}


/* =========================================================
   5. API: ADMIN DASHBOARD
   ---------------------------------------------------------
   Method: GET
   URL: /api/admin/dashboard

   Trả về:
   - totalStudents
   - totalTeachers
   - totalRooms
   - totalSubjects
   - totalAttendance
   - attendedCount
   - attendancePercent
   - attendanceTrend
========================================================= */
router.get("/dashboard", async (req, res) => {
  try {
    /* -----------------------------------------------------
       1. Lấy tổng số sinh viên
    ----------------------------------------------------- */
    const [[students]] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM student
      `
    );

    /* -----------------------------------------------------
       2. Lấy tổng số giáo viên
    ----------------------------------------------------- */
    const [[teachers]] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM teacher
      `
    );

    /* -----------------------------------------------------
       3. Lấy tổng số phòng học
    ----------------------------------------------------- */
    const [[rooms]] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM classroom
      `
    );

    /* -----------------------------------------------------
       4. Lấy tổng số môn học
    ----------------------------------------------------- */
    const [[subjects]] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM subject
      `
    );

    /* -----------------------------------------------------
       5. Tính tỷ lệ điểm danh toàn hệ thống

       Công thức:
       attendancePercent =
       (PRESENT + LATE) / tổng bản ghi điểm danh * 100

       PRESENT: có mặt
       LATE: đi muộn nhưng vẫn tính là đã tham gia
       ABSENT: vắng
    ----------------------------------------------------- */
    const [[attendance]] = await db.query(
      `
      SELECT
        COUNT(*) AS total_attendance,

        COALESCE(
          SUM(
            CASE
              WHEN status IN ('PRESENT', 'LATE') THEN 1
              ELSE 0
            END
          ),
          0
        ) AS attended_count,

        ROUND(
          CASE
            WHEN COUNT(*) = 0 THEN 0
            ELSE
              COALESCE(
                SUM(
                  CASE
                    WHEN status IN ('PRESENT', 'LATE') THEN 1
                    ELSE 0
                  END
                ),
                0
              ) / COUNT(*) * 100
          END,
          2
        ) AS attendance_percent

      FROM attendance
      `
    );

    /* -----------------------------------------------------
       6. Lấy xu hướng điểm danh 7 ngày gần nhất

       Lưu ý:
       - Join attendance với session để lấy session_date.
       - Dùng session_date chính xác hơn check_in_time vì:
         + ABSENT thường không có check_in_time.
         + Nếu chỉ dùng check_in_time thì sinh viên vắng sẽ không được tính.
    ----------------------------------------------------- */
    const [trendRows] = await db.query(
      `
      SELECT
        DATE(se.session_date) AS attendance_date,

        COUNT(a.id_attendance) AS total_attendance,

        COALESCE(
          SUM(
            CASE
              WHEN a.status IN ('PRESENT', 'LATE') THEN 1
              ELSE 0
            END
          ),
          0
        ) AS attended_count,

        ROUND(
          CASE
            WHEN COUNT(a.id_attendance) = 0 THEN 0
            ELSE
              COALESCE(
                SUM(
                  CASE
                    WHEN a.status IN ('PRESENT', 'LATE') THEN 1
                    ELSE 0
                  END
                ),
                0
              ) / COUNT(a.id_attendance) * 100
          END,
          2
        ) AS attendance_percent

      FROM attendance a

      INNER JOIN session se
        ON se.id_session = a.id_session

      WHERE se.session_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        AND se.session_date <= CURDATE()

      GROUP BY DATE(se.session_date)

      ORDER BY DATE(se.session_date) ASC
      `
    );

    /* -----------------------------------------------------
       7. Đưa dữ liệu trendRows vào Map để dễ tìm theo ngày
    ----------------------------------------------------- */
    const trendMap = new Map(
      trendRows.map((row) => {
        const dateKey =
          row.attendance_date instanceof Date
            ? formatDateKey(row.attendance_date)
            : String(row.attendance_date).slice(0, 10);

        return [
          dateKey,
          {
            totalAttendance: toNumber(row.total_attendance),
            attendedCount: toNumber(row.attended_count),
            attendancePercent: normalizePercent(row.attendance_percent),
          },
        ];
      })
    );

    /* -----------------------------------------------------
       8. Tạo đủ 7 ngày cho biểu đồ

       Lý do:
       - Nếu ngày nào không có dữ liệu điểm danh,
         frontend vẫn cần có điểm dữ liệu = 0.
    ----------------------------------------------------- */
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const attendanceTrend = [];

    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(today.getDate() - i);

      const dateKey = formatDateKey(date);
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

    /* -----------------------------------------------------
       9. Trả dữ liệu cho frontend AdminDashboard
    ----------------------------------------------------- */
    return res.status(200).json({
      totalStudents: toNumber(students.total),
      totalTeachers: toNumber(teachers.total),
      totalRooms: toNumber(rooms.total),
      totalSubjects: toNumber(subjects.total),

      totalAttendance: toNumber(attendance.total_attendance),
      attendedCount: toNumber(attendance.attended_count),
      attendancePercent: normalizePercent(attendance.attendance_percent),

      attendanceTrend,
    });
  } catch (error) {
    console.error("Lỗi lấy dữ liệu dashboard:", error);

    return sendServerError(res, "Lỗi lấy dữ liệu dashboard", error);
  }
});

export default router;