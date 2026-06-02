import express from "express";
import db from "../config/db.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| API: Xem thông tin cá nhân của học sinh đang đăng nhập
|--------------------------------------------------------------------------
| GET /api/student/profile?student_id=...
|
| NOTE: student_id được truyền qua query string vì project chưa có JWT.
|       Đây là giải pháp TẠM THỜI trong giai đoạn hoàn thiện.
|       Trong môi trường production cần dùng JWT middleware để xác thực.
|--------------------------------------------------------------------------
*/
router.get("/profile", async (req, res) => {
  try {
    const { student_id } = req.query;

    if (!student_id) {
      return res.status(400).json({
        success: false,
        message: "Thiếu student_id. Vui lòng đăng nhập lại.",
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        a.id_account,
        a.username,
        a.role,
        a.status AS account_status,

        s.id_student,
        s.student_code,
        s.full_name,
        s.gender,
        s.date_of_birth,
        s.phone,
        s.email,
        s.avatar,
        s.faculty,
        s.class_name,
        s.course_year,
        s.status AS student_status,
        s.created_at,
        s.updated_at,

        fd.id_face,
        fd.face_image,
        fd.model_version,
        fd.created_at AS face_created_at

      FROM Account a
      JOIN Student s ON a.student_id = s.id_student
      LEFT JOIN FaceData fd ON s.id_student = fd.id_student

      WHERE a.role = 'STUDENT'
        AND a.student_id = ?

      ORDER BY fd.id_face DESC
      LIMIT 1
      `,
      [Number(student_id)]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin sinh viên",
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Lỗi lấy thông tin cá nhân sinh viên:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin cá nhân",
      error: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| API: Xem lịch học cá nhân của học sinh đang đăng nhập
|--------------------------------------------------------------------------
| GET /api/student/schedule?student_id=...
|
| Logic:
|   1. Thử lấy từ Enrollment (chuẩn)
|   2. Nếu rỗng → fallback lấy từ Attendance records (distinct schedules)
|      (vì database có thể chưa có dữ liệu Enrollment đầy đủ)
|
| Query params tùy chọn:
|   - semester: e.g. "HK1"
|   - school_year: e.g. "2025-2026"
|
| NOTE: student_id truyền qua query (giải pháp tạm - chưa có JWT)
|--------------------------------------------------------------------------
*/
router.get("/schedule", async (req, res) => {
  try {
    const { student_id, semester, school_year } = req.query;

    if (!student_id) {
      return res.status(400).json({
        success: false,
        message: "Thiếu student_id. Vui lòng đăng nhập lại.",
      });
    }

    // === CÁCH 1: lấy từ Enrollment ===
    let extraWhere = "";
    const enrollParams = [Number(student_id)];

    if (semester) {
      extraWhere += " AND cc.semester = ?";
      enrollParams.push(semester);
    }
    if (school_year) {
      extraWhere += " AND cc.school_year = ?";
      enrollParams.push(school_year);
    }

    let [rows] = await db.query(
      `
      SELECT
        sc.id_schedule,
        sc.day_of_week,
        sc.start_time,
        sc.end_time,
        sc.start_date,
        sc.end_date,

        e.id_enrollment,
        e.status AS enrollment_status,

        cc.id_course_class,
        cc.class_code,
        cc.semester,
        cc.school_year,
        cc.group_number,
        cc.status AS course_status,

        sub.id_subject,
        sub.subject_code,
        sub.subject_name,
        sub.credits,

        t.id_teacher,
        t.full_name AS teacher_name,
        t.email AS teacher_email,

        r.id_room,
        r.room_code,
        r.room_name,
        r.building,
        r.floor

      FROM Enrollment e
      JOIN CourseClass cc ON e.id_course_class = cc.id_course_class
      JOIN Subject sub ON cc.id_subject = sub.id_subject
      JOIN Teacher t ON cc.id_teacher = t.id_teacher
      JOIN Schedule sc ON cc.id_course_class = sc.id_course_class
      LEFT JOIN ClassRoom r ON sc.id_room = r.id_room

      WHERE e.id_student = ?
        ${extraWhere}

      ORDER BY
        FIELD(sc.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
        sc.start_time
      `,
      enrollParams
    );

    // === CÁCH 2 (fallback): lấy từ Attendance nếu Enrollment rỗng ===
    if (rows.length === 0) {
      let attendanceWhere = "";
      const attendanceParams = [Number(student_id)];

      if (semester) {
        attendanceWhere += " AND cc.semester = ?";
        attendanceParams.push(semester);
      }
      if (school_year) {
        attendanceWhere += " AND cc.school_year = ?";
        attendanceParams.push(school_year);
      }

      [rows] = await db.query(
        `
        SELECT DISTINCT
          sc.id_schedule,
          sc.day_of_week,
          sc.start_time,
          sc.end_time,
          sc.start_date,
          sc.end_date,

          NULL AS id_enrollment,
          'FROM_ATTENDANCE' AS enrollment_status,

          cc.id_course_class,
          cc.class_code,
          cc.semester,
          cc.school_year,
          cc.group_number,
          cc.status AS course_status,

          sub.id_subject,
          sub.subject_code,
          sub.subject_name,
          sub.credits,

          t.id_teacher,
          t.full_name AS teacher_name,
          t.email AS teacher_email,

          r.id_room,
          r.room_code,
          r.room_name,
          r.building,
          r.floor

        FROM Attendance a
        JOIN Session se ON a.id_session = se.id_session
        JOIN Schedule sc ON se.id_schedule = sc.id_schedule
        JOIN CourseClass cc ON sc.id_course_class = cc.id_course_class
        JOIN Subject sub ON cc.id_subject = sub.id_subject
        JOIN Teacher t ON cc.id_teacher = t.id_teacher
        LEFT JOIN ClassRoom r ON sc.id_room = r.id_room

        WHERE a.id_student = ?
          ${attendanceWhere}

        ORDER BY
          FIELD(sc.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
          sc.start_time
        `,
        attendanceParams
      );
    }

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Lỗi lấy lịch học sinh viên:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy lịch học",
      error: error.message,
    });
  }
});

export default router;
