import express from "express";
import db from "../config/db.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| API: Kiểm tra auth route
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/auth/test
|--------------------------------------------------------------------------
*/
router.get("/test", (req, res) => {
  res.json({
    message: "Auth route hoạt động",
  });
});

/*
|--------------------------------------------------------------------------
| API: Đăng nhập
|--------------------------------------------------------------------------
| Method: POST
| URL: /api/auth/login
|--------------------------------------------------------------------------
| Body:
| {
|   "username": "admin",
|   "password": "admin123",
|   "role": "ADMIN"
| }
|--------------------------------------------------------------------------
*/
router.post("/login", async (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "").trim();
  const role = String(req.body.role || "").trim().toUpperCase();

  if (!username || !password || !role) {
    return res.status(400).json({
      message: "Vui lòng nhập đầy đủ tài khoản, mật khẩu và vai trò",
    });
  }

  if (!["ADMIN", "TEACHER", "STUDENT"].includes(role)) {
    return res.status(400).json({
      message: "Vai trò đăng nhập không hợp lệ",
    });
  }

  try {
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

      FROM Account a

      LEFT JOIN Teacher t
        ON a.teacher_id = t.id_teacher

      LEFT JOIN Department d
        ON t.department_id = d.id_department

      LEFT JOIN Student s
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

    if (accounts.length === 0) {
      return res.status(401).json({
        message: "Tài khoản không tồn tại hoặc bạn chọn sai vai trò",
      });
    }

    const account = accounts[0];

    if (account.status === "LOCKED") {
      return res.status(403).json({
        message: "Tài khoản đã bị khóa",
      });
    }

    if (String(account.password) !== password) {
      return res.status(401).json({
        message: "Mật khẩu không đúng",
      });
    }

    if (account.role === "TEACHER") {
      if (!account.teacher_id) {
        return res.status(400).json({
          message:
            "Tài khoản giáo viên chưa liên kết teacher_id trong bảng Account",
        });
      }

      if (!account.id_teacher) {
        return res.status(400).json({
          message:
            "teacher_id trong bảng Account không tồn tại trong bảng Teacher",
        });
      }
    }

    if (account.role === "STUDENT") {
      if (!account.student_id) {
        return res.status(400).json({
          message:
            "Tài khoản sinh viên chưa liên kết student_id trong bảng Account",
        });
      }

      if (!account.id_student) {
        return res.status(400).json({
          message:
            "student_id trong bảng Account không tồn tại trong bảng Student",
        });
      }
    }

    await db.query(
      `
      UPDATE Account
      SET last_login = NOW()
      WHERE id_account = ?
      `,
      [account.id_account]
    );

    const user = {
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
    };

    return res.status(200).json({
      message: "Đăng nhập thành công",
      user,
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);

    return res.status(500).json({
      message: "Lỗi đăng nhập",
      error: error.message,
      code: error.code,
    });
  }
});

export default router;