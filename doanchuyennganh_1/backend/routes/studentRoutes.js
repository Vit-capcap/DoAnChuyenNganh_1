import express from "express";
import db from "../config/db.js";

const router = express.Router();

/* =========================================================
   FILE: studentRoutes.js
   ---------------------------------------------------------
   Chức năng:
   - Quản lý sinh viên cho Admin
   - Dashboard sinh viên
   - Hồ sơ cá nhân sinh viên
   - Lịch học sinh viên
   - Lịch sử điểm danh sinh viên
   - Đổi mật khẩu sinh viên

   Lưu ý quan trọng:
   - Các route cụ thể như:
     /:id/dashboard
     /:id/detail
     /:id/profile
     /:id/change-password
     /:id/schedule
     /:id/attendance-history

     phải đặt TRƯỚC route động:
     /:id

   - Nếu đặt /:id trước, Express có thể hiểu nhầm:
     /1/schedule hoặc /1/profile
========================================================= */

/* =========================================================
   1. CÁC HÀM HỖ TRỢ CHUNG
========================================================= */

/*
  Chuyển chuỗi rỗng thành null.
  Dùng khi insert/update MySQL để tránh lưu "" không cần thiết.
*/
function toNull(value) {
  if (value === undefined || value === null) return null;

  const text = String(value).trim();

  return text === "" ? null : text;
}

/*
  Kiểm tra giá trị ENUM có hợp lệ hay không.
*/
function isValidEnum(value, validValues) {
  return validValues.includes(value);
}

/*
  Chuẩn hóa lỗi trả về cho frontend.
*/
function sendServerError(res, message, error) {
  return res.status(500).json({
    message,
    error: error.message,
    code: error.code,
  });
}

/*
  Kiểm tra sinh viên có tồn tại hay không.
*/
async function findStudentById(id) {
  const [rows] = await db.query(
    `
    SELECT id_student
    FROM student
    WHERE id_student = ?
    LIMIT 1
    `,
    [id]
  );

  return rows[0] || null;
}

/*
  Validate giới tính sinh viên.
*/
function validateGender(gender) {
  const validGenders = ["Male", "Female", "Other", "", null, undefined];

  return isValidEnum(gender, validGenders);
}

/*
  Validate trạng thái sinh viên.
*/
function validateStudentStatus(status) {
  const validStudentStatus = ["ACTIVE", "INACTIVE", "", null, undefined];

  return isValidEnum(status, validStudentStatus);
}

/*
  Validate trạng thái tài khoản.
*/
function validateAccountStatus(status) {
  const validAccountStatus = ["ACTIVE", "LOCKED", "", null, undefined];

  return isValidEnum(status, validAccountStatus);
}

/* =========================================================
   2. API ADMIN - LẤY DANH SÁCH SINH VIÊN
   ---------------------------------------------------------
   Method: GET
   URL: /api/students
   Query:
   - search: tìm theo tên, mã sinh viên, khoa, lớp, email
========================================================= */
router.get("/", async (req, res) => {
  try {
    const search = req.query.search || "";

    const [students] = await db.query(
      `
      SELECT 
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
        s.status,
        s.created_at,
        s.updated_at,

        CASE 
          WHEN fd.id_face IS NOT NULL THEN 'Đã cập nhật'
          ELSE 'Chưa cập nhật'
        END AS face_status,

        CASE 
          WHEN fd.id_face IS NOT NULL THEN true
          ELSE false
        END AS face_updated,

        a.id_account,
        a.username,
        a.status AS account_status

      FROM student s

      LEFT JOIN (
        SELECT 
          id_student,
          MAX(id_face) AS latest_face_id
        FROM facedata
        GROUP BY id_student
      ) latest_fd
        ON latest_fd.id_student = s.id_student

      LEFT JOIN facedata fd 
        ON fd.id_face = latest_fd.latest_face_id

      LEFT JOIN account a 
        ON a.student_id = s.id_student
        AND a.role = 'STUDENT'

      WHERE 
        s.full_name LIKE ?
        OR s.student_code LIKE ?
        OR s.faculty LIKE ?
        OR s.class_name LIKE ?
        OR s.email LIKE ?

      ORDER BY s.id_student DESC
      `,
      [
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
      ]
    );

    res.status(200).json(students);
  } catch (error) {
    console.error("Lỗi lấy danh sách sinh viên:", error);
    sendServerError(res, "Lỗi lấy danh sách sinh viên", error);
  }
});

/* =========================================================
   3. API ADMIN - THÊM SINH VIÊN + TẠO TÀI KHOẢN
   ---------------------------------------------------------
   Method: POST
   URL: /api/students

   Body chính:
   - student_code
   - full_name
   - username
   - password
   - gender
   - email
   - phone
   - avatar
   - faculty
   - class_name
   - course_year
   - status
   - account_status
========================================================= */
router.post("/", async (req, res) => {
  const {
    student_code,
    full_name,
    gender,
    date_of_birth,
    phone,
    email,
    avatar,
    faculty,
    class_name,
    course_year,
    status,
    username,
    password,
    account_status,
  } = req.body;

  if (!student_code || !full_name || !username || !password) {
    return res.status(400).json({
      message:
        "Vui lòng nhập đầy đủ mã sinh viên, họ tên, tài khoản và mật khẩu",
    });
  }

  if (!validateGender(gender)) {
    return res.status(400).json({
      message: "Giới tính không hợp lệ",
    });
  }

  if (!validateStudentStatus(status)) {
    return res.status(400).json({
      message: "Trạng thái sinh viên không hợp lệ",
    });
  }

  if (!validateAccountStatus(account_status)) {
    return res.status(400).json({
      message: "Trạng thái tài khoản không hợp lệ",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [duplicates] = await connection.query(
      `
      SELECT id_student
      FROM student
      WHERE student_code = ? OR email = ?
      LIMIT 1
      `,
      [student_code.trim(), email || ""]
    );

    if (duplicates.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Mã sinh viên hoặc email đã tồn tại",
      });
    }

    const [accountDuplicates] = await connection.query(
      `
      SELECT id_account
      FROM account
      WHERE username = ?
      LIMIT 1
      `,
      [username.trim()]
    );

    if (accountDuplicates.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Tên tài khoản đã tồn tại",
      });
    }

    const [studentResult] = await connection.query(
      `
      INSERT INTO student (
        student_code,
        full_name,
        gender,
        date_of_birth,
        phone,
        email,
        avatar,
        faculty,
        class_name,
        course_year,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        student_code.trim(),
        full_name.trim(),
        toNull(gender),
        toNull(date_of_birth),
        toNull(phone),
        toNull(email),
        toNull(avatar),
        toNull(faculty),
        toNull(class_name),
        toNull(course_year),
        status || "ACTIVE",
      ]
    );

    const studentId = studentResult.insertId;

    await connection.query(
      `
      INSERT INTO account (
        username,
        password,
        role,
        student_id,
        status
      )
      VALUES (?, ?, 'STUDENT', ?, ?)
      `,
      [username.trim(), password, studentId, account_status || "ACTIVE"]
    );

    await connection.commit();

    res.status(201).json({
      message: "Thêm sinh viên thành công",
      id_student: studentId,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi thêm sinh viên:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Mã sinh viên, email hoặc tài khoản đã tồn tại",
        error: error.message,
        code: error.code,
      });
    }

    if (error.code === "ER_DATA_TOO_LONG") {
      return res.status(400).json({
        message:
          "Dữ liệu quá dài. Nếu avatar là Base64, hãy kiểm tra cột avatar đã là LONGTEXT chưa.",
        error: error.message,
        code: error.code,
      });
    }

    sendServerError(res, "Lỗi thêm sinh viên", error);
  } finally {
    connection.release();
  }
});

/* =========================================================
   4. API STUDENT - DASHBOARD SINH VIÊN
   ---------------------------------------------------------
   Method: GET
   URL: /api/students/:id/dashboard

   Trả về:
   - student
   - stats
   - weeklyTrend
   - upcomingClasses
   - recentAttendance
   - notifications
   - unreadNotifications
========================================================= */
router.get("/:id/dashboard", async (req, res) => {
  try {
    const { id } = req.params;

    const [students] = await db.query(
      `
      SELECT
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
        s.status,
        s.created_at,
        s.updated_at,

        fd.id_face,
        fd.face_image,
        fd.model_version,
        fd.created_at AS face_created_at,

        a.id_account,
        a.username,
        a.role,
        a.status AS account_status

      FROM student s

      LEFT JOIN (
        SELECT 
          id_student,
          MAX(id_face) AS latest_face_id
        FROM facedata
        GROUP BY id_student
      ) latest_fd
        ON latest_fd.id_student = s.id_student

      LEFT JOIN facedata fd
        ON fd.id_face = latest_fd.latest_face_id

      LEFT JOIN account a
        ON a.student_id = s.id_student
        AND a.role = 'STUDENT'

      WHERE s.id_student = ?

      LIMIT 1
      `,
      [id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy sinh viên",
      });
    }

    const student = students[0];

    const [statsRows] = await db.query(
      `
      SELECT
        COUNT(at.id_attendance) AS totalSessions,

        SUM(CASE WHEN at.status = 'PRESENT' THEN 1 ELSE 0 END) AS presentCount,

        SUM(CASE WHEN at.status = 'ABSENT' THEN 1 ELSE 0 END) AS absentCount,

        SUM(CASE WHEN at.status = 'LATE' THEN 1 ELSE 0 END) AS lateCount,

        ROUND(
          (
            SUM(CASE WHEN at.status IN ('PRESENT', 'LATE') THEN 1 ELSE 0 END)
            / NULLIF(COUNT(at.id_attendance), 0)
          ) * 100,
          2
        ) AS attendancePercent

      FROM attendance at
      WHERE at.id_student = ?
      `,
      [id]
    );

    const rawStats = statsRows[0] || {};

    const stats = {
      totalSessions: Number(rawStats.totalSessions || 0),
      presentCount: Number(rawStats.presentCount || 0),
      absentCount: Number(rawStats.absentCount || 0),
      lateCount: Number(rawStats.lateCount || 0),
      attendancePercent: Number(rawStats.attendancePercent || 0),
    };

    const [weeklyRows] = await db.query(
      `
      SELECT
        DATE(se.session_date) AS sessionDate,

        CASE DAYOFWEEK(se.session_date)
          WHEN 2 THEN 'T2'
          WHEN 3 THEN 'T3'
          WHEN 4 THEN 'T4'
          WHEN 5 THEN 'T5'
          WHEN 6 THEN 'T6'
          WHEN 7 THEN 'T7'
          WHEN 1 THEN 'CN'
        END AS label,

        COUNT(at.id_attendance) AS totalAttendance,

        SUM(CASE WHEN at.status IN ('PRESENT', 'LATE') THEN 1 ELSE 0 END) AS attendedCount,

        ROUND(
          (
            SUM(CASE WHEN at.status IN ('PRESENT', 'LATE') THEN 1 ELSE 0 END)
            / NULLIF(COUNT(at.id_attendance), 0)
          ) * 100,
          2
        ) AS attendancePercent

      FROM attendance at
      INNER JOIN session se
        ON se.id_session = at.id_session

      WHERE at.id_student = ?
        AND se.session_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        AND se.session_date <= CURDATE()

      GROUP BY DATE(se.session_date), label
      ORDER BY DATE(se.session_date) ASC
      `,
      [id]
    );

    const defaultWeek = [
      { label: "T2", attendancePercent: 0 },
      { label: "T3", attendancePercent: 0 },
      { label: "T4", attendancePercent: 0 },
      { label: "T5", attendancePercent: 0 },
      { label: "T6", attendancePercent: 0 },
      { label: "T7", attendancePercent: 0 },
      { label: "CN", attendancePercent: 0 },
    ];

    const weeklyTrend = defaultWeek.map((day) => {
      const found = weeklyRows.find((item) => item.label === day.label);

      return {
        label: day.label,
        attendancePercent: Number(found?.attendancePercent || 0),
        totalAttendance: Number(found?.totalAttendance || 0),
        attendedCount: Number(found?.attendedCount || 0),
      };
    });

    const [upcomingClasses] = await db.query(
      `
      SELECT
        sc.id_schedule,
        sc.day_of_week,
        sc.start_time,
        sc.end_time,
        sc.start_date,
        sc.end_date,

        cc.id_course_class,
        cc.class_code,
        cc.semester,
        cc.school_year,

        sub.id_subject,
        sub.subject_code,
        sub.subject_name,

        cr.id_room,
        cr.room_code,
        cr.room_name,
        cr.building,
        cr.floor,

        t.id_teacher,
        t.full_name AS teacher_name,

        se.id_session,
        se.session_date,
        se.status AS session_status

      FROM enrollment e
      INNER JOIN courseclass cc
        ON cc.id_course_class = e.id_course_class
      INNER JOIN subject sub
        ON sub.id_subject = cc.id_subject
      INNER JOIN teacher t
        ON t.id_teacher = cc.id_teacher
      INNER JOIN schedule sc
        ON sc.id_course_class = cc.id_course_class
      INNER JOIN classroom cr
        ON cr.id_room = sc.id_room
      LEFT JOIN session se
        ON se.id_schedule = sc.id_schedule
        AND se.session_date >= CURDATE()

      WHERE e.id_student = ?
        AND e.status = 'STUDYING'
        AND cc.status = 'OPEN'
        AND (
          se.session_date IS NULL
          OR se.session_date >= CURDATE()
        )

      ORDER BY 
        CASE 
          WHEN se.session_date IS NULL THEN sc.start_date
          ELSE se.session_date
        END ASC,
        sc.start_time ASC

      LIMIT 5
      `,
      [id]
    );

    const [recentAttendance] = await db.query(
      `
      SELECT
        at.id_attendance,
        at.id_session,
        at.id_student,
        at.check_in_time,
        at.status,
        at.confidence_score,
        at.face_image,
        at.note,

        se.session_date,
        se.session_number,
        se.status AS session_status,

        sc.id_schedule,
        sc.start_time,
        sc.end_time,

        cr.id_room,
        cr.room_code,
        cr.room_name,
        cr.building,
        cr.floor,

        cc.id_course_class,
        cc.class_code,
        cc.semester,
        cc.school_year,

        sub.id_subject,
        sub.subject_code,
        sub.subject_name

      FROM attendance at
      LEFT JOIN session se
        ON se.id_session = at.id_session
      LEFT JOIN schedule sc
        ON sc.id_schedule = se.id_schedule
      LEFT JOIN classroom cr
        ON cr.id_room = sc.id_room
      LEFT JOIN courseclass cc
        ON cc.id_course_class = sc.id_course_class
      LEFT JOIN subject sub
        ON sub.id_subject = cc.id_subject

      WHERE at.id_student = ?

      ORDER BY se.session_date DESC, at.check_in_time DESC
      LIMIT 8
      `,
      [id]
    );

    const [notifications] = await db.query(
      `
      SELECT
        id_notification,
        title,
        content,
        receiver_id,
        receiver_role,
        created_at,
        is_read

      FROM notification

      WHERE receiver_role = 'STUDENT'
        AND receiver_id = ?

      ORDER BY created_at DESC
      LIMIT 5
      `,
      [id]
    );

    const [unreadRows] = await db.query(
      `
      SELECT COUNT(*) AS unreadNotifications
      FROM notification
      WHERE receiver_role = 'STUDENT'
        AND receiver_id = ?
        AND is_read = 0
      `,
      [id]
    );

    res.status(200).json({
      student,
      stats,
      weeklyTrend,
      upcomingClasses,
      recentAttendance,
      notifications,
      unreadNotifications: Number(unreadRows[0]?.unreadNotifications || 0),
    });
  } catch (error) {
    console.error("Lỗi lấy dashboard sinh viên:", error);
    sendServerError(res, "Lỗi lấy dashboard sinh viên", error);
  }
});

/* =========================================================
   5. API ADMIN - CHI TIẾT SINH VIÊN
   ---------------------------------------------------------
   Method: GET
   URL: /api/students/:id/detail

   Trả về:
   - student
   - stats
   - attendanceHistory
========================================================= */
router.get("/:id/detail", async (req, res) => {
  try {
    const { id } = req.params;

    const [students] = await db.query(
      `
      SELECT
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
        s.status,
        s.created_at,
        s.updated_at,

        fd.id_face,
        fd.face_image,
        fd.model_version,
        fd.created_at AS face_created_at,

        a.id_account,
        a.username,
        a.role,
        a.status AS account_status

      FROM student s

      LEFT JOIN (
        SELECT 
          id_student,
          MAX(id_face) AS latest_face_id
        FROM facedata
        GROUP BY id_student
      ) latest_fd
        ON latest_fd.id_student = s.id_student

      LEFT JOIN facedata fd
        ON fd.id_face = latest_fd.latest_face_id

      LEFT JOIN account a
        ON a.student_id = s.id_student
        AND a.role = 'STUDENT'

      WHERE s.id_student = ?

      LIMIT 1
      `,
      [id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy sinh viên",
      });
    }

    const student = students[0];

    const [statsRows] = await db.query(
      `
      SELECT
        COUNT(at.id_attendance) AS total_sessions,
        SUM(CASE WHEN at.status = 'PRESENT' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN at.status = 'LATE' THEN 1 ELSE 0 END) AS late_count,
        SUM(CASE WHEN at.status = 'ABSENT' THEN 1 ELSE 0 END) AS absent_count,
        ROUND(
          (
            SUM(CASE WHEN at.status IN ('PRESENT', 'LATE') THEN 1 ELSE 0 END)
            / NULLIF(COUNT(at.id_attendance), 0)
          ) * 100,
          2
        ) AS attendance_rate
      FROM attendance at
      WHERE at.id_student = ?
      `,
      [id]
    );

    const stats = statsRows[0] || {
      total_sessions: 0,
      present_count: 0,
      late_count: 0,
      absent_count: 0,
      attendance_rate: 0,
    };

    const [attendanceHistory] = await db.query(
      `
      SELECT
        at.id_attendance,
        at.check_in_time,
        at.status,
        at.confidence_score,
        at.face_image,
        at.note,

        se.id_session,
        se.session_date,
        se.session_number,

        sc.id_schedule,
        sc.start_time,
        sc.end_time,

        cr.id_room,
        cr.room_code,
        cr.room_name,
        cr.building,
        cr.floor,

        cc.id_course_class,
        cc.class_code,
        cc.semester,
        cc.school_year,

        sub.id_subject,
        sub.subject_code,
        sub.subject_name

      FROM attendance at
      LEFT JOIN session se
        ON se.id_session = at.id_session
      LEFT JOIN schedule sc
        ON sc.id_schedule = se.id_schedule
      LEFT JOIN classroom cr
        ON cr.id_room = sc.id_room
      LEFT JOIN courseclass cc
        ON cc.id_course_class = sc.id_course_class
      LEFT JOIN subject sub
        ON sub.id_subject = cc.id_subject

      WHERE at.id_student = ?

      ORDER BY se.session_date DESC, at.check_in_time DESC
      `,
      [id]
    );

    res.status(200).json({
      student,
      stats,
      attendanceHistory,
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết sinh viên:", error);
    sendServerError(res, "Lỗi lấy chi tiết sinh viên", error);
  }
});

/* =========================================================
   6. API STUDENT - CẬP NHẬT HỒ SƠ CÁ NHÂN
   ---------------------------------------------------------
   Method: PUT
   URL: /api/students/:id/profile

   Cho phép sửa:
   - full_name
   - phone
   - date_of_birth
   - gender
========================================================= */
router.put("/:id/profile", async (req, res) => {
  const { id } = req.params;
  const { full_name, phone, date_of_birth, gender } = req.body;

  if (!full_name || !full_name.trim()) {
    return res.status(400).json({
      message: "Vui lòng nhập họ tên",
    });
  }

  if (!validateGender(gender)) {
    return res.status(400).json({
      message: "Giới tính không hợp lệ",
    });
  }

  try {
    const student = await findStudentById(id);

    if (!student) {
      return res.status(404).json({
        message: "Không tìm thấy sinh viên",
      });
    }

    await db.query(
      `
      UPDATE student
      SET
        full_name = ?,
        phone = ?,
        date_of_birth = ?,
        gender = ?,
        updated_at = NOW()
      WHERE id_student = ?
      `,
      [
        full_name.trim(),
        toNull(phone),
        toNull(date_of_birth),
        toNull(gender),
        id,
      ]
    );

    res.status(200).json({
      message: "Cập nhật hồ sơ sinh viên thành công",
    });
  } catch (error) {
    console.error("Lỗi cập nhật hồ sơ sinh viên:", error);
    sendServerError(res, "Lỗi cập nhật hồ sơ sinh viên", error);
  }
});

/* =========================================================
   7. API STUDENT - ĐỔI MẬT KHẨU
   ---------------------------------------------------------
   Method: PUT
   URL: /api/students/:id/change-password

   Body:
   - oldPassword
   - newPassword

   Lưu ý:
   - Hiện tại đang so sánh mật khẩu dạng text.
   - Nếu dự án dùng bcrypt thì cần thay bằng bcrypt.compare().
========================================================= */
router.put("/:id/change-password", async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      message: "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới",
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      message: "Mật khẩu mới phải có ít nhất 8 ký tự",
    });
  }

  try {
    const [accounts] = await db.query(
      `
      SELECT id_account, password
      FROM account
      WHERE student_id = ?
        AND role = 'STUDENT'
      LIMIT 1
      `,
      [id]
    );

    if (accounts.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản sinh viên",
      });
    }

    const account = accounts[0];

    if (String(account.password) !== String(oldPassword)) {
      return res.status(400).json({
        message: "Mật khẩu hiện tại không đúng",
      });
    }

    await db.query(
      `
      UPDATE account
      SET password = ?
      WHERE id_account = ?
      `,
      [newPassword, account.id_account]
    );

    res.status(200).json({
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    console.error("Lỗi đổi mật khẩu sinh viên:", error);
    sendServerError(res, "Lỗi đổi mật khẩu sinh viên", error);
  }
});

/* =========================================================
   8. API STUDENT - LỊCH HỌC CÁ NHÂN
   ---------------------------------------------------------
   Method: GET
   URL: /api/students/:id/schedule

   Query:
   - semester
   - schoolYear
========================================================= */
router.get("/:id/schedule", async (req, res) => {
  const { id } = req.params;
  const { semester, schoolYear } = req.query;

  try {
    const params = [id];

    let whereFilter = `
      WHERE e.id_student = ?
        AND e.status = 'STUDYING'
    `;

    if (semester) {
      whereFilter += ` AND cc.semester = ?`;
      params.push(semester);
    }

    if (schoolYear) {
      whereFilter += ` AND cc.school_year = ?`;
      params.push(schoolYear);
    }

    const [rows] = await db.query(
      `
      SELECT
        sc.id_schedule,
        sc.day_of_week,
        sc.start_time,
        sc.end_time,
        sc.start_date,
        sc.end_date,

        cc.id_course_class,
        cc.class_code,
        cc.semester,
        cc.school_year,
        cc.group_number,

        sub.id_subject,
        sub.subject_code,
        sub.subject_name,
        sub.credits,

        t.id_teacher,
        t.full_name AS teacher_name,
        t.email AS teacher_email,

        cr.id_room,
        cr.room_code,
        cr.room_name,
        cr.building,
        cr.floor

      FROM enrollment e
      INNER JOIN courseclass cc
        ON cc.id_course_class = e.id_course_class
      INNER JOIN subject sub
        ON sub.id_subject = cc.id_subject
      INNER JOIN teacher t
        ON t.id_teacher = cc.id_teacher
      INNER JOIN schedule sc
        ON sc.id_course_class = cc.id_course_class
      INNER JOIN classroom cr
        ON cr.id_room = sc.id_room

      ${whereFilter}

      ORDER BY
        FIELD(
          sc.day_of_week,
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday'
        ),
        sc.start_time ASC
      `,
      params
    );

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Lỗi lấy lịch học sinh viên:", error);

    res.status(500).json({
      success: false,
      message: "Lỗi lấy lịch học sinh viên",
      error: error.message,
      code: error.code,
    });
  }
});

/* =========================================================
   9. API STUDENT - LỊCH SỬ ĐIỂM DANH
   ---------------------------------------------------------
   Method: GET
   URL: /api/students/:id/attendance-history

   Query:
   - status: PRESENT, LATE, ABSENT
   - startDate
   - endDate
========================================================= */
router.get("/:id/attendance-history", async (req, res) => {
  const { id } = req.params;
  const { status, startDate, endDate } = req.query;

  try {
    const params = [id];

    let whereFilter = `
      WHERE at.id_student = ?
    `;

    if (status) {
      whereFilter += ` AND at.status = ?`;
      params.push(status);
    }

    if (startDate) {
      whereFilter += ` AND se.session_date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      whereFilter += ` AND se.session_date <= ?`;
      params.push(endDate);
    }

    const [rows] = await db.query(
      `
      SELECT
        at.id_attendance,
        at.id_session,
        at.id_student,
        at.check_in_time,
        at.status,
        at.confidence_score,
        at.face_image,
        at.note,

        se.session_date,
        se.session_number,
        se.status AS session_status,

        sc.id_schedule,
        sc.start_time,
        sc.end_time,

        cr.id_room,
        cr.room_code,
        cr.room_name,
        cr.building,
        cr.floor,

        cc.id_course_class,
        cc.class_code,
        cc.semester,
        cc.school_year,

        sub.id_subject,
        sub.subject_code,
        sub.subject_name,

        t.id_teacher,
        t.full_name AS teacher_name

      FROM attendance at
      LEFT JOIN session se
        ON se.id_session = at.id_session
      LEFT JOIN schedule sc
        ON sc.id_schedule = se.id_schedule
      LEFT JOIN classroom cr
        ON cr.id_room = sc.id_room
      LEFT JOIN courseclass cc
        ON cc.id_course_class = sc.id_course_class
      LEFT JOIN subject sub
        ON sub.id_subject = cc.id_subject
      LEFT JOIN teacher t
        ON t.id_teacher = cc.id_teacher

      ${whereFilter}

      ORDER BY se.session_date DESC, at.check_in_time DESC
      `,
      params
    );

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Lỗi lấy lịch sử điểm danh sinh viên:", error);

    res.status(500).json({
      success: false,
      message: "Lỗi lấy lịch sử điểm danh sinh viên",
      error: error.message,
      code: error.code,
    });
  }
});

/* =========================================================
   10. API ADMIN / STUDENT - LẤY THÔNG TIN 1 SINH VIÊN
   ---------------------------------------------------------
   Method: GET
   URL: /api/students/:id

   Lưu ý:
   - Route này phải đặt SAU các route:
     /:id/dashboard
     /:id/detail
     /:id/profile
     /:id/change-password
     /:id/schedule
     /:id/attendance-history
========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [students] = await db.query(
      `
      SELECT
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
        s.status,
        s.created_at,
        s.updated_at,

        fd.id_face,
        fd.face_image,
        fd.model_version,
        fd.created_at AS face_created_at,

        a.id_account,
        a.username,
        a.role,
        a.status AS account_status

      FROM student s

      LEFT JOIN (
        SELECT 
          id_student,
          MAX(id_face) AS latest_face_id
        FROM facedata
        GROUP BY id_student
      ) latest_fd
        ON latest_fd.id_student = s.id_student

      LEFT JOIN facedata fd
        ON fd.id_face = latest_fd.latest_face_id

      LEFT JOIN account a
        ON a.student_id = s.id_student
        AND a.role = 'STUDENT'

      WHERE s.id_student = ?

      LIMIT 1
      `,
      [id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy sinh viên",
      });
    }

    res.status(200).json(students[0]);
  } catch (error) {
    console.error("Lỗi lấy thông tin sinh viên:", error);
    sendServerError(res, "Lỗi lấy thông tin sinh viên", error);
  }
});

/* =========================================================
   11. API ADMIN - CẬP NHẬT TOÀN BỘ SINH VIÊN
   ---------------------------------------------------------
   Method: PUT
   URL: /api/students/:id

   Dùng cho Admin chỉnh sửa đầy đủ:
   - student_code
   - full_name
   - gender
   - date_of_birth
   - phone
   - email
   - avatar
   - faculty
   - class_name
   - course_year
   - status
   - account_status
========================================================= */
router.put("/:id", async (req, res) => {
  const { id } = req.params;

  const {
    student_code,
    full_name,
    gender,
    date_of_birth,
    phone,
    email,
    avatar,
    faculty,
    class_name,
    course_year,
    status,
    account_status,
  } = req.body;

  if (!student_code || !full_name) {
    return res.status(400).json({
      message: "Vui lòng nhập mã sinh viên và họ tên",
    });
  }

  if (!validateGender(gender)) {
    return res.status(400).json({
      message: "Giới tính không hợp lệ",
    });
  }

  if (!validateStudentStatus(status)) {
    return res.status(400).json({
      message: "Trạng thái sinh viên không hợp lệ",
    });
  }

  if (!validateAccountStatus(account_status)) {
    return res.status(400).json({
      message: "Trạng thái tài khoản không hợp lệ",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [students] = await connection.query(
      `
      SELECT id_student
      FROM student
      WHERE id_student = ?
      LIMIT 1
      `,
      [id]
    );

    if (students.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Không tìm thấy sinh viên",
      });
    }

    const [duplicates] = await connection.query(
      `
      SELECT id_student
      FROM student
      WHERE (student_code = ? OR email = ?)
        AND id_student <> ?
      LIMIT 1
      `,
      [student_code.trim(), email || "", id]
    );

    if (duplicates.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Mã sinh viên hoặc email đã tồn tại",
      });
    }

    await connection.query(
      `
      UPDATE student
      SET
        student_code = ?,
        full_name = ?,
        gender = ?,
        date_of_birth = ?,
        phone = ?,
        email = ?,
        avatar = ?,
        faculty = ?,
        class_name = ?,
        course_year = ?,
        status = ?,
        updated_at = NOW()
      WHERE id_student = ?
      `,
      [
        student_code.trim(),
        full_name.trim(),
        toNull(gender),
        toNull(date_of_birth),
        toNull(phone),
        toNull(email),
        toNull(avatar),
        toNull(faculty),
        toNull(class_name),
        toNull(course_year),
        status || "ACTIVE",
        id,
      ]
    );

    await connection.query(
      `
      UPDATE account
      SET
        username = ?,
        status = ?
      WHERE student_id = ?
        AND role = 'STUDENT'
      `,
      [email || student_code.trim(), account_status || "ACTIVE", id]
    );

    await connection.commit();

    res.status(200).json({
      message: "Cập nhật sinh viên thành công",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi cập nhật sinh viên:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Mã sinh viên hoặc email đã tồn tại",
        error: error.message,
        code: error.code,
      });
    }

    if (error.code === "ER_DATA_TOO_LONG") {
      return res.status(400).json({
        message:
          "Dữ liệu quá dài. Nếu avatar là Base64, hãy kiểm tra cột avatar đã là LONGTEXT chưa.",
        error: error.message,
        code: error.code,
      });
    }

    sendServerError(res, "Lỗi cập nhật sinh viên", error);
  } finally {
    connection.release();
  }
});

/* =========================================================
   12. API ADMIN - XÓA SINH VIÊN
   ---------------------------------------------------------
   Method: DELETE
   URL: /api/students/:id

   Chức năng:
   - Xóa tài khoản STUDENT trước
   - Sau đó xóa sinh viên

   Lưu ý:
   - Nếu sinh viên có dữ liệu điểm danh hoặc dữ liệu liên quan,
     MySQL có thể chặn xóa do ràng buộc khóa ngoại.
========================================================= */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [students] = await connection.query(
      `
      SELECT id_student
      FROM student
      WHERE id_student = ?
      LIMIT 1
      `,
      [id]
    );

    if (students.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Không tìm thấy sinh viên",
      });
    }

    await connection.query(
      `
      DELETE FROM account
      WHERE student_id = ?
        AND role = 'STUDENT'
      `,
      [id]
    );

    await connection.query(
      `
      DELETE FROM student
      WHERE id_student = ?
      `,
      [id]
    );

    await connection.commit();

    res.status(200).json({
      message: "Xóa sinh viên thành công",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi xóa sinh viên:", error);

    res.status(500).json({
      message:
        "Không thể xóa sinh viên. Có thể sinh viên đang có dữ liệu điểm danh hoặc dữ liệu liên quan.",
      error: error.message,
      code: error.code,
    });
  } finally {
    connection.release();
  }
});

export default router;