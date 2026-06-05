import express from "express";
import db from "../config/db.js";

const router = express.Router();

/* =========================================================
   FILE: accountRoutes.js
   ---------------------------------------------------------
   Chức năng:
   - Lấy danh sách tài khoản
   - Lấy dữ liệu option cho form thêm/sửa tài khoản
   - Thêm tài khoản
   - Cập nhật tài khoản
   - Khóa / mở khóa tài khoản
   - Xóa tài khoản

   LƯU Ý DATABASE:
   Database mới dùng tên bảng chữ thường:
   - account
   - teacher
   - student

   Thứ tự route:
   1. GET    /api/accounts/options
   2. GET    /api/accounts
   3. POST   /api/accounts
   4. PUT    /api/accounts/:id
   5. PATCH  /api/accounts/:id/status
   6. DELETE /api/accounts/:id
========================================================= */


/* =========================================================
   1. HẰNG SỐ VÀ HELPER
========================================================= */

/*
|--------------------------------------------------------------------------
| VALID_ROLES
|--------------------------------------------------------------------------
| Chức năng:
| - Danh sách vai trò hợp lệ của tài khoản.
|--------------------------------------------------------------------------
*/
const VALID_ROLES = ["ADMIN", "TEACHER", "STUDENT"];

/*
|--------------------------------------------------------------------------
| VALID_STATUSES
|--------------------------------------------------------------------------
| Chức năng:
| - Danh sách trạng thái hợp lệ của tài khoản.
| - ACTIVE: được đăng nhập.
| - LOCKED: bị khóa.
|--------------------------------------------------------------------------
*/
const VALID_STATUSES = ["ACTIVE", "LOCKED"];

/*
|--------------------------------------------------------------------------
| normalizeText()
|--------------------------------------------------------------------------
| Chức năng:
| - Chuẩn hóa chuỗi.
| - Tránh lỗi undefined/null.
| - Xóa khoảng trắng đầu/cuối.
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
| - Chuyển role về chữ hoa.
| - Ví dụ: teacher -> TEACHER.
|--------------------------------------------------------------------------
*/
function normalizeRole(value) {
  return normalizeText(value).toUpperCase();
}

/*
|--------------------------------------------------------------------------
| normalizeStatus()
|--------------------------------------------------------------------------
| Chức năng:
| - Chuyển status về chữ hoa.
| - Nếu không truyền thì mặc định ACTIVE.
|--------------------------------------------------------------------------
*/
function normalizeStatus(value) {
  const status = normalizeText(value).toUpperCase();

  return status || "ACTIVE";
}

/*
|--------------------------------------------------------------------------
| toNumberOrNull()
|--------------------------------------------------------------------------
| Chức năng:
| - Chuyển id về Number.
| - Nếu không có id thì trả null.
|--------------------------------------------------------------------------
*/
function toNumberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
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
| validateAccountPayload()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra dữ liệu thêm/sửa tài khoản.
| - Dùng chung cho POST và PUT.
|--------------------------------------------------------------------------
*/
function validateAccountPayload({
  username,
  password,
  role,
  teacher_id,
  student_id,
  status,
  isUpdate = false,
}) {
  if (!username || !role) {
    return {
      valid: false,
      message: "Vui lòng nhập username và vai trò",
    };
  }

  if (!isUpdate && !password) {
    return {
      valid: false,
      message: "Vui lòng nhập mật khẩu",
    };
  }

  if (password && password.length < 8) {
    return {
      valid: false,
      message: "Mật khẩu phải có ít nhất 8 ký tự",
    };
  }

  if (!VALID_ROLES.includes(role)) {
    return {
      valid: false,
      message: "Vai trò không hợp lệ",
    };
  }

  if (!VALID_STATUSES.includes(status)) {
    return {
      valid: false,
      message: "Trạng thái tài khoản không hợp lệ",
    };
  }

  if (role === "TEACHER" && !teacher_id) {
    return {
      valid: false,
      message: "Vui lòng chọn giáo viên cho tài khoản giáo viên",
    };
  }

  if (role === "STUDENT" && !student_id) {
    return {
      valid: false,
      message: "Vui lòng chọn sinh viên cho tài khoản sinh viên",
    };
  }

  return {
    valid: true,
    message: "",
  };
}

/*
|--------------------------------------------------------------------------
| checkAccountExists()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra tài khoản có tồn tại theo id_account hay không.
|--------------------------------------------------------------------------
*/
async function checkAccountExists(id) {
  const [accounts] = await db.query(
    `
    SELECT id_account
    FROM account
    WHERE id_account = ?
    LIMIT 1
    `,
    [id]
  );

  return accounts.length > 0;
}

/*
|--------------------------------------------------------------------------
| checkUsernameDuplicate()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra username đã tồn tại chưa.
| - Khi update thì bỏ qua chính account hiện tại.
|--------------------------------------------------------------------------
*/
async function checkUsernameDuplicate(username, ignoreAccountId = null) {
  const params = [username];

  let sql = `
    SELECT id_account
    FROM account
    WHERE username = ?
  `;

  if (ignoreAccountId) {
    sql += ` AND id_account <> ?`;
    params.push(ignoreAccountId);
  }

  sql += ` LIMIT 1`;

  const [rows] = await db.query(sql, params);

  return rows.length > 0;
}

/*
|--------------------------------------------------------------------------
| checkTeacherValid()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra teacher_id tồn tại.
| - Kiểm tra giáo viên đã có tài khoản khác chưa.
|--------------------------------------------------------------------------
*/
async function checkTeacherValid(teacherId, ignoreAccountId = null) {
  const [teachers] = await db.query(
    `
    SELECT id_teacher
    FROM teacher
    WHERE id_teacher = ?
    LIMIT 1
    `,
    [teacherId]
  );

  if (teachers.length === 0) {
    return {
      valid: false,
      status: 404,
      message: "Giáo viên không tồn tại",
    };
  }

  const params = [teacherId];

  let sql = `
    SELECT id_account
    FROM account
    WHERE teacher_id = ?
      AND role = 'TEACHER'
  `;

  if (ignoreAccountId) {
    sql += ` AND id_account <> ?`;
    params.push(ignoreAccountId);
  }

  sql += ` LIMIT 1`;

  const [accounts] = await db.query(sql, params);

  if (accounts.length > 0) {
    return {
      valid: false,
      status: 409,
      message: "Giáo viên này đã có tài khoản",
    };
  }

  return {
    valid: true,
  };
}

/*
|--------------------------------------------------------------------------
| checkStudentValid()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra student_id tồn tại.
| - Kiểm tra sinh viên đã có tài khoản khác chưa.
|--------------------------------------------------------------------------
*/
async function checkStudentValid(studentId, ignoreAccountId = null) {
  const [students] = await db.query(
    `
    SELECT id_student
    FROM student
    WHERE id_student = ?
    LIMIT 1
    `,
    [studentId]
  );

  if (students.length === 0) {
    return {
      valid: false,
      status: 404,
      message: "Sinh viên không tồn tại",
    };
  }

  const params = [studentId];

  let sql = `
    SELECT id_account
    FROM account
    WHERE student_id = ?
      AND role = 'STUDENT'
  `;

  if (ignoreAccountId) {
    sql += ` AND id_account <> ?`;
    params.push(ignoreAccountId);
  }

  sql += ` LIMIT 1`;

  const [accounts] = await db.query(sql, params);

  if (accounts.length > 0) {
    return {
      valid: false,
      status: 409,
      message: "Sinh viên này đã có tài khoản",
    };
  }

  return {
    valid: true,
  };
}


/* =========================================================
   2. API: LẤY OPTIONS CHO FORM TÀI KHOẢN
   ---------------------------------------------------------
   Method: GET
   URL: /api/accounts/options

   Chức năng:
   - Lấy danh sách giáo viên chưa có tài khoản.
   - Lấy danh sách sinh viên chưa có tài khoản.
   - Trả roles và statuses cho frontend.
========================================================= */
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
      FROM teacher t
      LEFT JOIN account a
        ON a.teacher_id = t.id_teacher
       AND a.role = 'TEACHER'
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
      FROM student s
      LEFT JOIN account a
        ON a.student_id = s.id_student
       AND a.role = 'STUDENT'
      WHERE a.id_account IS NULL
      ORDER BY s.full_name ASC
      `
    );

    return res.status(200).json({
      teachers,
      students,
      roles: VALID_ROLES,
      statuses: VALID_STATUSES,
    });
  } catch (error) {
    console.error("Lỗi lấy options tài khoản:", error);
    return sendServerError(res, "Lỗi lấy options tài khoản", error);
  }
});


/* =========================================================
   3. API: LẤY DANH SÁCH TÀI KHOẢN + THỐNG KÊ
   ---------------------------------------------------------
   Method: GET
   URL: /api/accounts

   Query:
   - search
   - role
   - status
   - page
   - limit
========================================================= */
router.get("/", async (req, res) => {
  try {
    const search = normalizeText(req.query.search);
    const role = normalizeRole(req.query.role);
    const status = normalizeStatus(req.query.status || "");
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.max(Number(req.query.limit || 10), 1);
    const offset = (page - 1) * limit;

    const conditions = [
      `
      (
        a.username LIKE ?
        OR t.full_name LIKE ?
        OR t.email LIKE ?
        OR t.teacher_code LIKE ?
        OR s.full_name LIKE ?
        OR s.email LIKE ?
        OR s.student_code LIKE ?
      )
      `,
    ];

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
      if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({
          message: "Vai trò không hợp lệ",
        });
      }

      conditions.push("a.role = ?");
      params.push(role);
    }

    if (req.query.status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          message: "Trạng thái tài khoản không hợp lệ",
        });
      }

      conditions.push("a.status = ?");
      params.push(status);
    }

    const whereSql = `WHERE ${conditions.join(" AND ")}`;

    const [countRows] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM account a
      LEFT JOIN teacher t
        ON t.id_teacher = a.teacher_id
      LEFT JOIN student s
        ON s.id_student = a.student_id
      ${whereSql}
      `,
      params
    );

    const total = Number(countRows[0]?.total || 0);

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

      FROM account a

      LEFT JOIN teacher t
        ON t.id_teacher = a.teacher_id

      LEFT JOIN student s
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
      FROM account
      `
    );

    return res.status(200).json({
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
    return sendServerError(res, "Lỗi lấy danh sách tài khoản", error);
  }
});


/* =========================================================
   4. API: THÊM TÀI KHOẢN
   ---------------------------------------------------------
   Method: POST
   URL: /api/accounts

   Body:
   - username
   - password
   - role
   - teacher_id
   - student_id
   - status
========================================================= */
router.post("/", async (req, res) => {
  const username = normalizeText(req.body.username);
  const password = normalizeText(req.body.password);
  const role = normalizeRole(req.body.role);
  const status = normalizeStatus(req.body.status);
  const teacherId = toNumberOrNull(req.body.teacher_id);
  const studentId = toNumberOrNull(req.body.student_id);

  const validation = validateAccountPayload({
    username,
    password,
    role,
    teacher_id: teacherId,
    student_id: studentId,
    status,
    isUpdate: false,
  });

  if (!validation.valid) {
    return res.status(400).json({
      message: validation.message,
    });
  }

  try {
    const usernameDuplicate = await checkUsernameDuplicate(username);

    if (usernameDuplicate) {
      return res.status(409).json({
        message: "Username đã tồn tại",
      });
    }

    if (role === "TEACHER") {
      const teacherCheck = await checkTeacherValid(teacherId);

      if (!teacherCheck.valid) {
        return res.status(teacherCheck.status).json({
          message: teacherCheck.message,
        });
      }
    }

    if (role === "STUDENT") {
      const studentCheck = await checkStudentValid(studentId);

      if (!studentCheck.valid) {
        return res.status(studentCheck.status).json({
          message: studentCheck.message,
        });
      }
    }

    const [result] = await db.query(
      `
      INSERT INTO account (
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
        username,
        password,
        role,
        role === "TEACHER" ? teacherId : null,
        role === "STUDENT" ? studentId : null,
        status,
      ]
    );

    return res.status(201).json({
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

    return sendServerError(res, "Lỗi thêm tài khoản", error);
  }
});


/* =========================================================
   5. API: CẬP NHẬT TÀI KHOẢN
   ---------------------------------------------------------
   Method: PUT
   URL: /api/accounts/:id

   Lưu ý:
   - Nếu không truyền password thì giữ mật khẩu cũ.
========================================================= */
router.put("/:id", async (req, res) => {
  const { id } = req.params;

  const username = normalizeText(req.body.username);
  const password = normalizeText(req.body.password);
  const role = normalizeRole(req.body.role);
  const status = normalizeStatus(req.body.status);
  const teacherId = toNumberOrNull(req.body.teacher_id);
  const studentId = toNumberOrNull(req.body.student_id);

  const validation = validateAccountPayload({
    username,
    password,
    role,
    teacher_id: teacherId,
    student_id: studentId,
    status,
    isUpdate: true,
  });

  if (!validation.valid) {
    return res.status(400).json({
      message: validation.message,
    });
  }

  try {
    const accountExists = await checkAccountExists(id);

    if (!accountExists) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản",
      });
    }

    const usernameDuplicate = await checkUsernameDuplicate(username, id);

    if (usernameDuplicate) {
      return res.status(409).json({
        message: "Username đã tồn tại",
      });
    }

    if (role === "TEACHER") {
      const teacherCheck = await checkTeacherValid(teacherId, id);

      if (!teacherCheck.valid) {
        return res.status(teacherCheck.status).json({
          message: teacherCheck.message,
        });
      }
    }

    if (role === "STUDENT") {
      const studentCheck = await checkStudentValid(studentId, id);

      if (!studentCheck.valid) {
        return res.status(studentCheck.status).json({
          message: studentCheck.message,
        });
      }
    }

    if (password) {
      await db.query(
        `
        UPDATE account
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
          username,
          password,
          role,
          role === "TEACHER" ? teacherId : null,
          role === "STUDENT" ? studentId : null,
          status,
          id,
        ]
      );
    } else {
      await db.query(
        `
        UPDATE account
        SET
          username = ?,
          role = ?,
          teacher_id = ?,
          student_id = ?,
          status = ?
        WHERE id_account = ?
        `,
        [
          username,
          role,
          role === "TEACHER" ? teacherId : null,
          role === "STUDENT" ? studentId : null,
          status,
          id,
        ]
      );
    }

    return res.status(200).json({
      message: "Cập nhật tài khoản thành công",
    });
  } catch (error) {
    console.error("Lỗi cập nhật tài khoản:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Username đã tồn tại hoặc người dùng đã có tài khoản",
        error: error.message,
        code: error.code,
      });
    }

    return sendServerError(res, "Lỗi cập nhật tài khoản", error);
  }
});


/* =========================================================
   6. API: KHÓA / MỞ KHÓA TÀI KHOẢN
   ---------------------------------------------------------
   Method: PATCH
   URL: /api/accounts/:id/status

   Body:
   - status: ACTIVE hoặc LOCKED
========================================================= */
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const status = normalizeStatus(req.body.status);

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Trạng thái tài khoản không hợp lệ",
      });
    }

    const accountExists = await checkAccountExists(id);

    if (!accountExists) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản",
      });
    }

    await db.query(
      `
      UPDATE account
      SET status = ?
      WHERE id_account = ?
      `,
      [status, id]
    );

    return res.status(200).json({
      message:
        status === "LOCKED"
          ? "Khóa tài khoản thành công"
          : "Mở khóa tài khoản thành công",
    });
  } catch (error) {
    console.error("Lỗi đổi trạng thái tài khoản:", error);
    return sendServerError(res, "Lỗi đổi trạng thái tài khoản", error);
  }
});


/* =========================================================
   7. API: XÓA TÀI KHOẢN
   ---------------------------------------------------------
   Method: DELETE
   URL: /api/accounts/:id
========================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const accountExists = await checkAccountExists(id);

    if (!accountExists) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản",
      });
    }

    await db.query(
      `
      DELETE FROM account
      WHERE id_account = ?
      `,
      [id]
    );

    return res.status(200).json({
      message: "Xóa tài khoản thành công",
    });
  } catch (error) {
    console.error("Lỗi xóa tài khoản:", error);
    return sendServerError(res, "Lỗi xóa tài khoản", error);
  }
});

export default router;