import express from "express";
import db from "../config/db.js";

const router = express.Router();

const validRoles = ["ADMIN", "TEACHER", "STUDENT"];
const validStatuses = ["ACTIVE", "LOCKED"];

/*
|--------------------------------------------------------------------------
| API: Lấy dữ liệu option cho form tài khoản
|--------------------------------------------------------------------------
| GET /api/accounts/options
|--------------------------------------------------------------------------
*/
router.get("/options", async (req, res) => {
  try {
    const [teachers] = await db.query(
      `
      SELECT
        t.id_teacher,
        t.teacher_code,
        t.full_name,
        t.email,
        t.avatar
      FROM Teacher t
      LEFT JOIN Account a
        ON a.teacher_id = t.id_teacher
      WHERE a.id_account IS NULL
      ORDER BY t.full_name ASC
      `
    );

    const [students] = await db.query(
      `
      SELECT
        s.id_student,
        s.student_code,
        s.full_name,
        s.email,
        s.avatar,
        s.class_name
      FROM Student s
      LEFT JOIN Account a
        ON a.student_id = s.id_student
      WHERE a.id_account IS NULL
      ORDER BY s.full_name ASC
      `
    );

    res.status(200).json({
      teachers,
      students,
      roles: validRoles,
      statuses: validStatuses,
    });
  } catch (error) {
    console.error("Lỗi lấy options tài khoản:", error);

    res.status(500).json({
      message: "Lỗi lấy options tài khoản",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| API: Lấy danh sách tài khoản + thống kê
|--------------------------------------------------------------------------
| GET /api/accounts
|--------------------------------------------------------------------------
*/
router.get("/", async (req, res) => {
  try {
    const search = req.query.search || "";
    const role = req.query.role || "";
    const status = req.query.status || "";
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const offset = (page - 1) * limit;

    let whereSql = `
      WHERE
        (
          a.username LIKE ?
          OR t.full_name LIKE ?
          OR t.email LIKE ?
          OR t.teacher_code LIKE ?
          OR s.full_name LIKE ?
          OR s.email LIKE ?
          OR s.student_code LIKE ?
        )
    `;

    const params = [
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
    ];

    if (role) {
      whereSql += ` AND a.role = ?`;
      params.push(role);
    }

    if (status) {
      whereSql += ` AND a.status = ?`;
      params.push(status);
    }

    const [countRows] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM Account a
      LEFT JOIN Teacher t
        ON t.id_teacher = a.teacher_id
      LEFT JOIN Student s
        ON s.id_student = a.student_id
      ${whereSql}
      `,
      params
    );

    const total = countRows[0]?.total || 0;

    const [accounts] = await db.query(
      `
      SELECT
        a.id_account,
        a.username,
        a.role,
        a.teacher_id,
        a.student_id,
        a.last_login,
        a.status,

        t.teacher_code,
        t.full_name AS teacher_name,
        t.email AS teacher_email,
        t.avatar AS teacher_avatar,

        s.student_code,
        s.full_name AS student_name,
        s.email AS student_email,
        s.avatar AS student_avatar,
        s.class_name,

        CASE
          WHEN a.role = 'TEACHER' THEN t.full_name
          WHEN a.role = 'STUDENT' THEN s.full_name
          ELSE a.username
        END AS display_name,

        CASE
          WHEN a.role = 'TEACHER' THEN t.email
          WHEN a.role = 'STUDENT' THEN s.email
          ELSE NULL
        END AS display_email,

        CASE
          WHEN a.role = 'TEACHER' THEN t.avatar
          WHEN a.role = 'STUDENT' THEN s.avatar
          ELSE NULL
        END AS display_avatar,

        CASE
          WHEN a.role = 'TEACHER' THEN t.teacher_code
          WHEN a.role = 'STUDENT' THEN s.student_code
          ELSE 'ADMIN'
        END AS user_code

      FROM Account a
      LEFT JOIN Teacher t
        ON t.id_teacher = a.teacher_id
      LEFT JOIN Student s
        ON s.id_student = a.student_id

      ${whereSql}

      ORDER BY a.id_account DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    const [statsRows] = await db.query(
      `
      SELECT
        COUNT(*) AS total_accounts,
        SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END) AS admin_count,
        SUM(CASE WHEN role = 'TEACHER' THEN 1 ELSE 0 END) AS teacher_count,
        SUM(CASE WHEN role = 'STUDENT' THEN 1 ELSE 0 END) AS student_count,
        SUM(CASE WHEN status = 'LOCKED' THEN 1 ELSE 0 END) AS locked_count
      FROM Account
      `
    );

    res.status(200).json({
      accounts,
      stats: statsRows[0] || {
        total_accounts: 0,
        admin_count: 0,
        teacher_count: 0,
        student_count: 0,
        locked_count: 0,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách tài khoản:", error);

    res.status(500).json({
      message: "Lỗi lấy danh sách tài khoản",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| API: Thêm tài khoản
|--------------------------------------------------------------------------
| POST /api/accounts
|--------------------------------------------------------------------------
*/
router.post("/", async (req, res) => {
  const { username, password, role, teacher_id, student_id, status } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({
      message: "Vui lòng nhập username, mật khẩu và vai trò",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: "Mật khẩu phải có ít nhất 8 ký tự",
    });
  }

  if (!validRoles.includes(role)) {
    return res.status(400).json({
      message: "Vai trò không hợp lệ",
    });
  }

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      message: "Trạng thái tài khoản không hợp lệ",
    });
  }

  if (role === "TEACHER" && !teacher_id) {
    return res.status(400).json({
      message: "Vui lòng chọn giáo viên cho tài khoản giáo viên",
    });
  }

  if (role === "STUDENT" && !student_id) {
    return res.status(400).json({
      message: "Vui lòng chọn sinh viên cho tài khoản sinh viên",
    });
  }

  try {
    const [existingUsername] = await db.query(
      `
      SELECT id_account
      FROM Account
      WHERE username = ?
      LIMIT 1
      `,
      [username.trim()]
    );

    if (existingUsername.length > 0) {
      return res.status(409).json({
        message: "Username đã tồn tại",
      });
    }

    if (role === "TEACHER") {
      const [teachers] = await db.query(
        `
        SELECT id_teacher
        FROM Teacher
        WHERE id_teacher = ?
        LIMIT 1
        `,
        [Number(teacher_id)]
      );

      if (teachers.length === 0) {
        return res.status(404).json({
          message: "Giáo viên không tồn tại",
        });
      }

      const [existingTeacherAccount] = await db.query(
        `
        SELECT id_account
        FROM Account
        WHERE teacher_id = ?
        LIMIT 1
        `,
        [Number(teacher_id)]
      );

      if (existingTeacherAccount.length > 0) {
        return res.status(409).json({
          message: "Giáo viên này đã có tài khoản",
        });
      }
    }

    if (role === "STUDENT") {
      const [students] = await db.query(
        `
        SELECT id_student
        FROM Student
        WHERE id_student = ?
        LIMIT 1
        `,
        [Number(student_id)]
      );

      if (students.length === 0) {
        return res.status(404).json({
          message: "Sinh viên không tồn tại",
        });
      }

      const [existingStudentAccount] = await db.query(
        `
        SELECT id_account
        FROM Account
        WHERE student_id = ?
        LIMIT 1
        `,
        [Number(student_id)]
      );

      if (existingStudentAccount.length > 0) {
        return res.status(409).json({
          message: "Sinh viên này đã có tài khoản",
        });
      }
    }

    const [result] = await db.query(
      `
      INSERT INTO Account (
        username,
        password,
        role,
        teacher_id,
        student_id,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        username.trim(),
        password,
        role,
        role === "TEACHER" ? Number(teacher_id) : null,
        role === "STUDENT" ? Number(student_id) : null,
        status || "ACTIVE",
      ]
    );

    res.status(201).json({
      message: "Thêm tài khoản thành công",
      id_account: result.insertId,
    });
  } catch (error) {
    console.error("Lỗi thêm tài khoản:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Username đã tồn tại hoặc người dùng đã có tài khoản",
        error: error.message,
        code: error.code,
      });
    }

    res.status(500).json({
      message: "Lỗi thêm tài khoản",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| API: Cập nhật tài khoản
|--------------------------------------------------------------------------
| PUT /api/accounts/:id
|--------------------------------------------------------------------------
*/
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { username, password, role, teacher_id, student_id, status } = req.body;

  if (!username || !role) {
    return res.status(400).json({
      message: "Vui lòng nhập username và vai trò",
    });
  }

  if (password && password.length < 8) {
    return res.status(400).json({
      message: "Mật khẩu phải có ít nhất 8 ký tự",
    });
  }

  if (!validRoles.includes(role)) {
    return res.status(400).json({
      message: "Vai trò không hợp lệ",
    });
  }

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      message: "Trạng thái tài khoản không hợp lệ",
    });
  }

  if (role === "TEACHER" && !teacher_id) {
    return res.status(400).json({
      message: "Vui lòng chọn giáo viên cho tài khoản giáo viên",
    });
  }

  if (role === "STUDENT" && !student_id) {
    return res.status(400).json({
      message: "Vui lòng chọn sinh viên cho tài khoản sinh viên",
    });
  }

  try {
    const [accounts] = await db.query(
      `
      SELECT id_account
      FROM Account
      WHERE id_account = ?
      LIMIT 1
      `,
      [id]
    );

    if (accounts.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản",
      });
    }

    const [duplicates] = await db.query(
      `
      SELECT id_account
      FROM Account
      WHERE username = ?
      AND id_account <> ?
      LIMIT 1
      `,
      [username.trim(), id]
    );

    if (duplicates.length > 0) {
      return res.status(409).json({
        message: "Username đã tồn tại",
      });
    }

    if (role === "TEACHER") {
      const [teacherAccounts] = await db.query(
        `
        SELECT id_account
        FROM Account
        WHERE teacher_id = ?
        AND id_account <> ?
        LIMIT 1
        `,
        [Number(teacher_id), id]
      );

      if (teacherAccounts.length > 0) {
        return res.status(409).json({
          message: "Giáo viên này đã có tài khoản khác",
        });
      }
    }

    if (role === "STUDENT") {
      const [studentAccounts] = await db.query(
        `
        SELECT id_account
        FROM Account
        WHERE student_id = ?
        AND id_account <> ?
        LIMIT 1
        `,
        [Number(student_id), id]
      );

      if (studentAccounts.length > 0) {
        return res.status(409).json({
          message: "Sinh viên này đã có tài khoản khác",
        });
      }
    }

    if (password) {
      await db.query(
        `
        UPDATE Account
        SET
          username = ?,
          password = ?,
          role = ?,
          teacher_id = ?,
          student_id = ?,
          status = ?
        WHERE id_account = ?
        `,
        [
          username.trim(),
          password,
          role,
          role === "TEACHER" ? Number(teacher_id) : null,
          role === "STUDENT" ? Number(student_id) : null,
          status || "ACTIVE",
          id,
        ]
      );
    } else {
      await db.query(
        `
        UPDATE Account
        SET
          username = ?,
          role = ?,
          teacher_id = ?,
          student_id = ?,
          status = ?
        WHERE id_account = ?
        `,
        [
          username.trim(),
          role,
          role === "TEACHER" ? Number(teacher_id) : null,
          role === "STUDENT" ? Number(student_id) : null,
          status || "ACTIVE",
          id,
        ]
      );
    }

    res.status(200).json({
      message: "Cập nhật tài khoản thành công",
    });
  } catch (error) {
    console.error("Lỗi cập nhật tài khoản:", error);

    res.status(500).json({
      message: "Lỗi cập nhật tài khoản",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| API: Khóa / mở khóa tài khoản
|--------------------------------------------------------------------------
| PATCH /api/accounts/:id/status
|--------------------------------------------------------------------------
*/
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Trạng thái tài khoản không hợp lệ",
      });
    }

    const [accounts] = await db.query(
      `
      SELECT id_account
      FROM Account
      WHERE id_account = ?
      LIMIT 1
      `,
      [id]
    );

    if (accounts.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản",
      });
    }

    await db.query(
      `
      UPDATE Account
      SET status = ?
      WHERE id_account = ?
      `,
      [status, id]
    );

    res.status(200).json({
      message:
        status === "LOCKED"
          ? "Khóa tài khoản thành công"
          : "Mở khóa tài khoản thành công",
    });
  } catch (error) {
    console.error("Lỗi đổi trạng thái tài khoản:", error);

    res.status(500).json({
      message: "Lỗi đổi trạng thái tài khoản",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| API: Xóa tài khoản
|--------------------------------------------------------------------------
| DELETE /api/accounts/:id
|--------------------------------------------------------------------------
*/
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [accounts] = await db.query(
      `
      SELECT id_account
      FROM Account
      WHERE id_account = ?
      LIMIT 1
      `,
      [id]
    );

    if (accounts.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản",
      });
    }

    await db.query(
      `
      DELETE FROM Account
      WHERE id_account = ?
      `,
      [id]
    );

    res.status(200).json({
      message: "Xóa tài khoản thành công",
    });
  } catch (error) {
    console.error("Lỗi xóa tài khoản:", error);

    res.status(500).json({
      message: "Lỗi xóa tài khoản",
      error: error.message,
      code: error.code,
    });
  }
});

export default router;