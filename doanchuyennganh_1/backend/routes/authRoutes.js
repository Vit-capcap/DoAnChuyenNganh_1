import express from "express";
import db from "../config/db.js";

const router = express.Router();

/* =========================================================
   FILE: authRoutes.js
   ---------------------------------------------------------
   Chức năng:
   - Kiểm tra route auth có hoạt động không.
   - Đăng nhập theo vai trò:
     + ADMIN
     + TEACHER
     + STUDENT

   LƯU Ý DATABASE:
   Database mới dùng tên bảng chữ thường:
   - account
   - teacher
   - student
   - department

   API chính:
   - GET  /api/auth/test
   - POST /api/auth/login
========================================================= */


/* =========================================================
   1. HẰNG SỐ VÀ HELPER
========================================================= */

/*
|--------------------------------------------------------------------------
| VALID_ROLES
|--------------------------------------------------------------------------
| Chức năng:
| - Danh sách vai trò hợp lệ trong hệ thống.
| - Tránh frontend gửi role sai.
|--------------------------------------------------------------------------
*/
const VALID_ROLES = ["ADMIN", "TEACHER", "STUDENT"];

/*
|--------------------------------------------------------------------------
| normalizeText()
|--------------------------------------------------------------------------
| Chức năng:
| - Chuẩn hóa dữ liệu text từ req.body.
| - Tránh lỗi undefined/null.
| - Tự động trim khoảng trắng.
|--------------------------------------------------------------------------
*/
function normalizeText(value) {
  return String(value || "").trim();
}

/*
|--------------------------------------------------------------------------
| normalizeRole()
|--------------------------------------------------------------------------
| Chức năng:
| - Chuẩn hóa role thành chữ hoa.
| - Ví dụ: teacher -> TEACHER.
|--------------------------------------------------------------------------
*/
function normalizeRole(value) {
  return normalizeText(value).toUpperCase();
}

/*
|--------------------------------------------------------------------------
| sendServerError()
|--------------------------------------------------------------------------
| Chức năng:
| - Chuẩn hóa lỗi server trả về frontend.
|--------------------------------------------------------------------------
*/
function sendServerError(res, message, error) {
  return res.status(500).json({
    message,
    error: error.message,
    code: error.code,
  });
}

/*
|--------------------------------------------------------------------------
| buildUserResponse()
|--------------------------------------------------------------------------
| Chức năng:
| - Tạo object user trả về frontend sau khi đăng nhập thành công.
| - Tự động lấy đúng thông tin theo vai trò ADMIN / TEACHER / STUDENT.
|--------------------------------------------------------------------------
*/
function buildUserResponse(account) {
  return {
    id_account: account.id_account,
    username: account.username,
    role: account.role,
    status: account.status,

    teacher_id: account.teacher_id,
    student_id: account.student_id,

    id_teacher: account.id_teacher,
    id_student: account.id_student,

    teacher_code: account.teacher_code,
    student_code: account.student_code,

    full_name:
      account.role === "TEACHER"
        ? account.teacher_name
        : account.role === "STUDENT"
        ? account.student_name
        : "Quản trị viên",

    email:
      account.role === "TEACHER"
        ? account.teacher_email
        : account.role === "STUDENT"
        ? account.student_email
        : account.username,

    avatar:
      account.role === "TEACHER"
        ? account.teacher_avatar
        : account.role === "STUDENT"
        ? account.student_avatar
        : null,

    department_id: account.department_id,
    department_name: account.department_name,

    class_name: account.class_name,
    faculty: account.faculty,
    student_status: account.student_status,

    last_login: account.last_login,
  };
}


/* =========================================================
   2. API: KIỂM TRA AUTH ROUTE
   ---------------------------------------------------------
   Method: GET
   URL: /api/auth/test

   Chức năng:
   - Dùng để kiểm tra backend đã đăng ký authRoutes chưa.
========================================================= */
router.get("/test", (req, res) => {
  return res.status(200).json({
    message: "Auth route hoạt động",
  });
});


/* =========================================================
   3. API: ĐĂNG NHẬP
   ---------------------------------------------------------
   Method: POST
   URL: /api/auth/login

   Body gửi từ frontend:
   {
     "username": "admin",
     "password": "admin123",
     "role": "ADMIN"
   }

   Chức năng:
   - Kiểm tra username, password, role.
   - Tìm tài khoản theo:
     + account.username
     + teacher.email
     + teacher.teacher_code
     + student.email
     + student.student_code
   - Kiểm tra tài khoản bị khóa chưa.
   - Kiểm tra mật khẩu.
   - Kiểm tra liên kết teacher_id / student_id.
   - Cập nhật last_login.
   - Trả user về frontend để phân quyền điều hướng.
========================================================= */
router.post("/login", async (req, res) => {
  const username = normalizeText(req.body.username);
  const password = normalizeText(req.body.password);
  const role = normalizeRole(req.body.role);

  /* ---------------------------------------------------------
     1. Kiểm tra dữ liệu bắt buộc
  --------------------------------------------------------- */
  if (!username || !password || !role) {
    return res.status(400).json({
      message: "Vui lòng nhập đầy đủ tài khoản, mật khẩu và vai trò",
    });
  }

  /* ---------------------------------------------------------
     2. Kiểm tra role hợp lệ
  --------------------------------------------------------- */
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({
      message: "Vai trò đăng nhập không hợp lệ",
    });
  }

  try {
    /* -------------------------------------------------------
       3. Tìm tài khoản theo username/email/mã người dùng

       Lưu ý:
       - ADMIN thường đăng nhập bằng account.username.
       - TEACHER có thể đăng nhập bằng:
         + account.username
         + teacher.email
         + teacher.teacher_code
       - STUDENT có thể đăng nhập bằng:
         + account.username
         + student.email
         + student.student_code
    ------------------------------------------------------- */
    const [accounts] = await db.query(
      `
      SELECT
        a.id_account,
        a.username,
        a.password,
        a.role,
        a.teacher_id,
        a.student_id,
        a.status,
        a.last_login,

        t.id_teacher,
        t.teacher_code,
        t.full_name AS teacher_name,
        t.email AS teacher_email,
        t.avatar AS teacher_avatar,
        t.department_id,

        d.department_name,

        s.id_student,
        s.student_code,
        s.full_name AS student_name,
        s.email AS student_email,
        s.avatar AS student_avatar,
        s.class_name,
        s.faculty,
        s.status AS student_status

      FROM account a

      LEFT JOIN teacher t
        ON a.teacher_id = t.id_teacher

      LEFT JOIN department d
        ON t.department_id = d.id_department

      LEFT JOIN student s
        ON a.student_id = s.id_student

      WHERE a.role = ?
        AND (
          LOWER(a.username) = LOWER(?)
          OR LOWER(t.email) = LOWER(?)
          OR LOWER(t.teacher_code) = LOWER(?)
          OR LOWER(s.email) = LOWER(?)
          OR LOWER(s.student_code) = LOWER(?)
        )

      LIMIT 1
      `,
      [role, username, username, username, username, username]
    );

    /* -------------------------------------------------------
       4. Không tìm thấy tài khoản
    ------------------------------------------------------- */
    if (accounts.length === 0) {
      return res.status(401).json({
        message: "Tài khoản không tồn tại hoặc bạn chọn sai vai trò",
      });
    }

    const account = accounts[0];

    /* -------------------------------------------------------
       5. Kiểm tra tài khoản bị khóa
    ------------------------------------------------------- */
    if (account.status === "LOCKED") {
      return res.status(403).json({
        message: "Tài khoản đã bị khóa",
      });
    }

    /* -------------------------------------------------------
       6. Kiểm tra mật khẩu

       LƯU Ý:
       - Hiện tại đang so sánh mật khẩu dạng text.
       - Nếu sau này dùng bcrypt thì thay đoạn này bằng bcrypt.compare().
    ------------------------------------------------------- */
    if (String(account.password) !== String(password)) {
      return res.status(401).json({
        message: "Mật khẩu không đúng",
      });
    }

    /* -------------------------------------------------------
       7. Kiểm tra tài khoản TEACHER có liên kết giáo viên không
    ------------------------------------------------------- */
    if (account.role === "TEACHER") {
      if (!account.teacher_id) {
        return res.status(400).json({
          message:
            "Tài khoản giáo viên chưa liên kết teacher_id trong bảng account",
        });
      }

      if (!account.id_teacher) {
        return res.status(400).json({
          message:
            "teacher_id trong bảng account không tồn tại trong bảng teacher",
        });
      }
    }

    /* -------------------------------------------------------
       8. Kiểm tra tài khoản STUDENT có liên kết sinh viên không
    ------------------------------------------------------- */
    if (account.role === "STUDENT") {
      if (!account.student_id) {
        return res.status(400).json({
          message:
            "Tài khoản sinh viên chưa liên kết student_id trong bảng account",
        });
      }

      if (!account.id_student) {
        return res.status(400).json({
          message:
            "student_id trong bảng account không tồn tại trong bảng student",
        });
      }

      if (account.student_status === "INACTIVE") {
        return res.status(403).json({
          message: "Sinh viên đang ở trạng thái không hoạt động",
        });
      }
    }

    /* -------------------------------------------------------
       9. Cập nhật thời gian đăng nhập cuối cùng
    ------------------------------------------------------- */
    await db.query(
      `
      UPDATE account
      SET last_login = NOW()
      WHERE id_account = ?
      `,
      [account.id_account]
    );

    /* -------------------------------------------------------
       10. Tạo user trả về frontend
    ------------------------------------------------------- */
    const user = buildUserResponse(account);

    return res.status(200).json({
      message: "Đăng nhập thành công",
      user,
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    return sendServerError(res, "Lỗi đăng nhập", error);
  }
});

export default router;