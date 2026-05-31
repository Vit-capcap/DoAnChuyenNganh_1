import express from "express";
import db from "../config/db.js";

const router = express.Router();

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
        CASE 
          WHEN fd.id_face IS NOT NULL THEN 'Đã cập nhật'
          ELSE 'Chưa cập nhật'
        END AS face_status,
        CASE 
          WHEN fd.id_face IS NOT NULL THEN true
          ELSE false
        END AS face_updated,
        a.status AS account_status
      FROM Student s
      LEFT JOIN FaceData fd ON s.id_student = fd.id_student
      LEFT JOIN Account a ON s.id_student = a.student_id
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

    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Lỗi lấy danh sách sinh viên",
    });
  }
});

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

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [studentResult] = await connection.query(
      `
      INSERT INTO Student (
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
        student_code,
        full_name,
        gender || null,
        date_of_birth || null,
        phone || null,
        email || null,
        avatar || null,
        faculty || null,
        class_name || null,
        course_year || null,
        status || "ACTIVE",
      ]
    );

    const studentId = studentResult.insertId;

    await connection.query(
      `
      INSERT INTO Account (
        username,
        password,
        role,
        student_id,
        status
      )
      VALUES (?, ?, 'STUDENT', ?, ?)
      `,
      [username, password, studentId, account_status || "ACTIVE"]
    );

    await connection.commit();

    res.status(201).json({
      message: "Thêm sinh viên thành công",
      id_student: studentId,
    });
  } catch (error) {
    await connection.rollback();

    console.error(error);

    res.status(500).json({
      message: "Lỗi thêm sinh viên",
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

//
/*
|--------------------------------------------------------------------------
| API: Lấy chi tiết học sinh + thống kê điểm danh + lịch sử điểm danh
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/students/:id/detail
|--------------------------------------------------------------------------
*/
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

      FROM Student s
      LEFT JOIN FaceData fd
        ON fd.id_student = s.id_student
      LEFT JOIN Account a
        ON a.student_id = s.id_student

      WHERE s.id_student = ?
      ORDER BY fd.id_face DESC
      LIMIT 1
      `,
      [id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy học sinh",
      });
    }

    const student = students[0];

    const [statsRows] = await db.query(
      `
      SELECT
        COUNT(*) AS total_sessions,
        SUM(CASE WHEN at.status = 'PRESENT' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN at.status = 'LATE' THEN 1 ELSE 0 END) AS late_count,
        SUM(CASE WHEN at.status = 'ABSENT' THEN 1 ELSE 0 END) AS absent_count,
        ROUND(
          (
            SUM(CASE WHEN at.status IN ('PRESENT', 'LATE') THEN 1 ELSE 0 END)
            / NULLIF(COUNT(*), 0)
          ) * 100,
          2
        ) AS attendance_rate
      FROM Attendance at
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

      FROM Attendance at
      LEFT JOIN Session se
        ON se.id_session = at.id_session
      LEFT JOIN Schedule sc
        ON sc.id_schedule = se.id_schedule
      LEFT JOIN ClassRoom cr
        ON cr.id_room = sc.id_room
      LEFT JOIN CourseClass cc
        ON cc.id_course_class = sc.id_course_class
      LEFT JOIN Subject sub
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
    console.error("Lỗi lấy chi tiết học sinh:", error);

    res.status(500).json({
      message: "Lỗi lấy chi tiết học sinh",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| API: Lấy chi tiết 1 sinh viên
|--------------------------------------------------------------------------
| GET /api/students/:id
|--------------------------------------------------------------------------
*/
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

      FROM Student s
      LEFT JOIN FaceData fd
        ON fd.id_student = s.id_student
      LEFT JOIN Account a
        ON a.student_id = s.id_student

      WHERE s.id_student = ?

      ORDER BY fd.id_face DESC
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
    console.error("Lỗi lấy chi tiết sinh viên:", error);

    res.status(500).json({
      message: "Lỗi lấy chi tiết sinh viên",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| API: Cập nhật sinh viên
|--------------------------------------------------------------------------
| PUT /api/students/:id
|--------------------------------------------------------------------------
*/
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

  const validGenders = ["Male", "Female", "Other", "", null, undefined];
  const validStudentStatus = ["ACTIVE", "INACTIVE", "", null, undefined];
  const validAccountStatus = ["ACTIVE", "LOCKED", "", null, undefined];

  if (!validGenders.includes(gender)) {
    return res.status(400).json({
      message: "Giới tính không hợp lệ",
    });
  }

  if (!validStudentStatus.includes(status)) {
    return res.status(400).json({
      message: "Trạng thái sinh viên không hợp lệ",
    });
  }

  if (!validAccountStatus.includes(account_status)) {
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
      FROM Student
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
      FROM Student
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
      UPDATE Student
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
        gender || null,
        date_of_birth || null,
        phone || null,
        email || null,
        avatar || null,
        faculty || null,
        class_name || null,
        course_year || null,
        status || "ACTIVE",
        id,
      ]
    );

    await connection.query(
      `
      UPDATE Account
      SET
        username = ?,
        status = ?
      WHERE student_id = ?
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
          "Dữ liệu quá dài. Nếu avatar là Base64, hãy đổi cột avatar sang LONGTEXT hoặc chỉ lưu đường dẫn ảnh.",
        error: error.message,
        code: error.code,
      });
    }

    res.status(500).json({
      message: "Lỗi cập nhật sinh viên",
      error: error.message,
      code: error.code,
    });
  } finally {
    connection.release();
  }
});

/*
|--------------------------------------------------------------------------
| API: Xóa sinh viên
|--------------------------------------------------------------------------
| DELETE /api/students/:id
|--------------------------------------------------------------------------
*/
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [students] = await connection.query(
      `
      SELECT id_student
      FROM Student
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
      DELETE FROM Account
      WHERE student_id = ?
      `,
      [id]
    );

    await connection.query(
      `
      DELETE FROM Student
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