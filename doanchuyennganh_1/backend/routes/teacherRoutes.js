// import express from "express";
// import db from "../config/db.js";

// const router = express.Router();

// /*
// |--------------------------------------------------------------------------
// | API: Lấy danh sách giáo viên
// |--------------------------------------------------------------------------
// | Method: GET
// | URL: /api/teachers
// |--------------------------------------------------------------------------
// */
// router.get("/", async (req, res) => {
//   try {
//     const search = req.query.search || "";

//     const [teachers] = await db.query(
//       `
//       SELECT
//         t.id_teacher,
//         t.teacher_code,
//         t.full_name,
//         t.gender,
//         t.date_of_birth,
//         t.phone,
//         t.email,
//         t.avatar,
//         t.department_id,

//         d.id_department,
//         d.department_name,

//         a.id_account,
//         a.username,
//         a.role,
//         a.status AS account_status,

//         t.created_at,
//         t.updated_at,

//         CASE
//           WHEN a.status = 'ACTIVE' THEN 'Đang hoạt động'
//           WHEN a.status = 'LOCKED' THEN 'Đã khóa'
//           ELSE 'Chưa có tài khoản'
//         END AS work_status,

//         CASE
//           WHEN a.status = 'ACTIVE' THEN 'active'
//           WHEN a.status = 'LOCKED' THEN 'locked'
//           ELSE 'inactive'
//         END AS status_type

//       FROM Teacher t
//       LEFT JOIN Department d
//         ON t.department_id = d.id_department
//       LEFT JOIN Account a
//         ON a.teacher_id = t.id_teacher

//       WHERE
//         t.full_name LIKE ?
//         OR t.teacher_code LIKE ?
//         OR t.email LIKE ?
//         OR t.phone LIKE ?
//         OR d.department_name LIKE ?

//       ORDER BY t.id_teacher DESC
//       `,
//       [
//         `%${search}%`,
//         `%${search}%`,
//         `%${search}%`,
//         `%${search}%`,
//         `%${search}%`,
//       ]
//     );

//     res.status(200).json(teachers);
//   } catch (error) {
//     console.error("Lỗi lấy danh sách giáo viên:", error);

//     res.status(500).json({
//       message: "Lỗi lấy danh sách giáo viên",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | API: Thêm giáo viên mới
// |--------------------------------------------------------------------------
// | Method: POST
// | URL: /api/teachers
// |--------------------------------------------------------------------------
// */
// router.post("/", async (req, res) => {
//   const {
//     teacher_code,
//     full_name,
//     gender,
//     date_of_birth,
//     phone,
//     email,
//     avatar,
//     password,
//     department_id,
//     account_status,
//   } = req.body;

//   if (!teacher_code || !full_name || !email || !phone || !password) {
//     return res.status(400).json({
//       message:
//         "Vui lòng nhập đầy đủ mã giáo viên, họ tên, email, số điện thoại và mật khẩu",
//     });
//   }

//   if (!department_id) {
//     return res.status(400).json({
//       message: "Vui lòng chọn khoa/bộ môn",
//     });
//   }

//   const validGenders = ["Male", "Female", "Other", "", null, undefined];

//   if (!validGenders.includes(gender)) {
//     return res.status(400).json({
//       message: "Giới tính không hợp lệ. Chỉ nhận Male, Female hoặc Other",
//     });
//   }

//   const validAccountStatus = ["ACTIVE", "LOCKED", "", null, undefined];

//   if (!validAccountStatus.includes(account_status)) {
//     return res.status(400).json({
//       message: "Trạng thái tài khoản không hợp lệ",
//     });
//   }

//   const connection = await db.getConnection();

//   try {
//     await connection.beginTransaction();

//     const [departments] = await connection.query(
//       `
//       SELECT id_department
//       FROM Department
//       WHERE id_department = ?
//       LIMIT 1
//       `,
//       [Number(department_id)]
//     );

//     if (departments.length === 0) {
//       await connection.rollback();

//       return res.status(404).json({
//         message: "Khoa/bộ môn không tồn tại",
//       });
//     }

//     const [existingTeachers] = await connection.query(
//       `
//       SELECT id_teacher
//       FROM Teacher
//       WHERE teacher_code = ? OR email = ?
//       LIMIT 1
//       `,
//       [teacher_code.trim(), email.trim()]
//     );

//     if (existingTeachers.length > 0) {
//       await connection.rollback();

//       return res.status(409).json({
//         message: "Mã giáo viên hoặc email đã tồn tại",
//       });
//     }

//     const [existingAccounts] = await connection.query(
//       `
//       SELECT id_account
//       FROM Account
//       WHERE username = ?
//       LIMIT 1
//       `,
//       [email.trim()]
//     );

//     if (existingAccounts.length > 0) {
//       await connection.rollback();

//       return res.status(409).json({
//         message: "Tài khoản giáo viên đã tồn tại",
//       });
//     }

//     const [teacherResult] = await connection.query(
//       `
//       INSERT INTO Teacher (
//         teacher_code,
//         full_name,
//         gender,
//         date_of_birth,
//         phone,
//         email,
//         avatar,
//         password,
//         department_id
//       )
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//       `,
//       [
//         teacher_code.trim(),
//         full_name.trim(),
//         gender || null,
//         date_of_birth || null,
//         phone.trim(),
//         email.trim(),
//         avatar || null,
//         password,
//         Number(department_id),
//       ]
//     );

//     const teacherId = teacherResult.insertId;

//     await connection.query(
//       `
//       INSERT INTO Account (
//         username,
//         password,
//         role,
//         teacher_id,
//         student_id,
//         status
//       )
//       VALUES (?, ?, 'TEACHER', ?, NULL, ?)
//       `,
//       [
//         email.trim(),
//         password,
//         teacherId,
//         account_status || "ACTIVE",
//       ]
//     );

//     await connection.commit();

//     res.status(201).json({
//       message: "Thêm giáo viên thành công",
//       id_teacher: teacherId,
//     });
//   } catch (error) {
//     await connection.rollback();

//     console.error("Lỗi thêm giáo viên:", error);

//     if (error.code === "ER_DUP_ENTRY") {
//       return res.status(409).json({
//         message: "Mã giáo viên, email hoặc tài khoản đã tồn tại",
//         error: error.message,
//         code: error.code,
//       });
//     }

//     if (error.code === "ER_DATA_TOO_LONG") {
//       return res.status(400).json({
//         message:
//           "Dữ liệu quá dài. Có thể ảnh avatar dạng Base64 vượt quá giới hạn VARCHAR(255). Hãy đổi avatar sang LONGTEXT hoặc chỉ lưu đường dẫn ảnh.",
//         error: error.message,
//         code: error.code,
//       });
//     }

//     if (error.code === "WARN_DATA_TRUNCATED") {
//       return res.status(400).json({
//         message:
//           "Dữ liệu không đúng kiểu. Kiểm tra gender phải là Male, Female hoặc Other.",
//         error: error.message,
//         code: error.code,
//       });
//     }

//     res.status(500).json({
//       message: "Lỗi thêm giáo viên",
//       error: error.message,
//       code: error.code,
//     });
//   } finally {
//     connection.release();
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | API: Lấy chi tiết 1 giáo viên
// |--------------------------------------------------------------------------
// | Method: GET
// | URL: /api/teachers/:id
// |--------------------------------------------------------------------------
// */
// router.get("/:id", async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [teachers] = await db.query(
//       `
//       SELECT
//         t.id_teacher,
//         t.teacher_code,
//         t.full_name,
//         t.gender,
//         t.date_of_birth,
//         t.phone,
//         t.email,
//         t.avatar,
//         t.department_id,

//         d.id_department,
//         d.department_name,

//         a.id_account,
//         a.username,
//         a.role,
//         a.status AS account_status,

//         t.created_at,
//         t.updated_at,

//         CASE
//           WHEN a.status = 'ACTIVE' THEN 'Đang hoạt động'
//           WHEN a.status = 'LOCKED' THEN 'Đã khóa'
//           ELSE 'Chưa có tài khoản'
//         END AS work_status,

//         CASE
//           WHEN a.status = 'ACTIVE' THEN 'active'
//           WHEN a.status = 'LOCKED' THEN 'locked'
//           ELSE 'inactive'
//         END AS status_type

//       FROM Teacher t
//       LEFT JOIN Department d
//         ON t.department_id = d.id_department
//       LEFT JOIN Account a
//         ON a.teacher_id = t.id_teacher

//       WHERE t.id_teacher = ?
//       `,
//       [id]
//     );

//     if (teachers.length === 0) {
//       return res.status(404).json({
//         message: "Không tìm thấy giáo viên",
//       });
//     }

//     res.status(200).json(teachers[0]);
//   } catch (error) {
//     console.error("Lỗi lấy chi tiết giáo viên:", error);

//     res.status(500).json({
//       message: "Lỗi lấy chi tiết giáo viên",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | API: Cập nhật giáo viên
// |--------------------------------------------------------------------------
// | Method: PUT
// | URL: /api/teachers/:id
// |--------------------------------------------------------------------------
// */
// router.put("/:id", async (req, res) => {
//   const { id } = req.params;

//   const {
//     teacher_code,
//     full_name,
//     gender,
//     date_of_birth,
//     phone,
//     email,
//     avatar,
//     password,
//     department_id,
//     account_status,
//   } = req.body;

//   if (!teacher_code || !full_name || !email || !phone) {
//     return res.status(400).json({
//       message: "Vui lòng nhập đầy đủ mã giáo viên, họ tên, email và số điện thoại",
//     });
//   }

//   const validGenders = ["Male", "Female", "Other", "", null, undefined];

//   if (!validGenders.includes(gender)) {
//     return res.status(400).json({
//       message: "Giới tính không hợp lệ. Chỉ nhận Male, Female hoặc Other",
//     });
//   }

//   const connection = await db.getConnection();

//   try {
//     await connection.beginTransaction();

//     const [teachers] = await connection.query(
//       `
//       SELECT id_teacher
//       FROM Teacher
//       WHERE id_teacher = ?
//       LIMIT 1
//       `,
//       [id]
//     );

//     if (teachers.length === 0) {
//       await connection.rollback();

//       return res.status(404).json({
//         message: "Không tìm thấy giáo viên",
//       });
//     }

//     const [duplicateTeachers] = await connection.query(
//       `
//       SELECT id_teacher
//       FROM Teacher
//       WHERE (teacher_code = ? OR email = ?)
//         AND id_teacher <> ?
//       LIMIT 1
//       `,
//       [teacher_code.trim(), email.trim(), id]
//     );

//     if (duplicateTeachers.length > 0) {
//       await connection.rollback();

//       return res.status(409).json({
//         message: "Mã giáo viên hoặc email đã tồn tại",
//       });
//     }

//     if (department_id) {
//       const [departments] = await connection.query(
//         `
//         SELECT id_department
//         FROM Department
//         WHERE id_department = ?
//         LIMIT 1
//         `,
//         [Number(department_id)]
//       );

//       if (departments.length === 0) {
//         await connection.rollback();

//         return res.status(404).json({
//           message: "Khoa/bộ môn không tồn tại",
//         });
//       }
//     }

//     if (password) {
//       await connection.query(
//         `
//         UPDATE Teacher
//         SET
//           teacher_code = ?,
//           full_name = ?,
//           gender = ?,
//           date_of_birth = ?,
//           phone = ?,
//           email = ?,
//           avatar = ?,
//           password = ?,
//           department_id = ?
//         WHERE id_teacher = ?
//         `,
//         [
//           teacher_code.trim(),
//           full_name.trim(),
//           gender || null,
//           date_of_birth || null,
//           phone.trim(),
//           email.trim(),
//           avatar || null,
//           password,
//           department_id ? Number(department_id) : null,
//           id,
//         ]
//       );

//       await connection.query(
//         `
//         UPDATE Account
//         SET
//           username = ?,
//           password = ?,
//           status = ?
//         WHERE teacher_id = ?
//         `,
//         [email.trim(), password, account_status || "ACTIVE", id]
//       );
//     } else {
//       await connection.query(
//         `
//         UPDATE Teacher
//         SET
//           teacher_code = ?,
//           full_name = ?,
//           gender = ?,
//           date_of_birth = ?,
//           phone = ?,
//           email = ?,
//           avatar = ?,
//           department_id = ?
//         WHERE id_teacher = ?
//         `,
//         [
//           teacher_code.trim(),
//           full_name.trim(),
//           gender || null,
//           date_of_birth || null,
//           phone.trim(),
//           email.trim(),
//           avatar || null,
//           department_id ? Number(department_id) : null,
//           id,
//         ]
//       );

//       await connection.query(
//         `
//         UPDATE Account
//         SET
//           username = ?,
//           status = ?
//         WHERE teacher_id = ?
//         `,
//         [email.trim(), account_status || "ACTIVE", id]
//       );
//     }

//     await connection.commit();

//     res.status(200).json({
//       message: "Cập nhật giáo viên thành công",
//     });
//   } catch (error) {
//     await connection.rollback();

//     console.error("Lỗi cập nhật giáo viên:", error);

//     res.status(500).json({
//       message: "Lỗi cập nhật giáo viên",
//       error: error.message,
//       code: error.code,
//     });
//   } finally {
//     connection.release();
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | API: Xóa giáo viên
// |--------------------------------------------------------------------------
// | Method: DELETE
// | URL: /api/teachers/:id
// |--------------------------------------------------------------------------
// */
// router.delete("/:id", async (req, res) => {
//   const { id } = req.params;

//   const connection = await db.getConnection();

//   try {
//     await connection.beginTransaction();

//     const [teachers] = await connection.query(
//       `
//       SELECT id_teacher
//       FROM Teacher
//       WHERE id_teacher = ?
//       LIMIT 1
//       `,
//       [id]
//     );

//     if (teachers.length === 0) {
//       await connection.rollback();

//       return res.status(404).json({
//         message: "Không tìm thấy giáo viên",
//       });
//     }

//     await connection.query(
//       `
//       DELETE FROM Account
//       WHERE teacher_id = ?
//       `,
//       [id]
//     );

//     await connection.query(
//       `
//       DELETE FROM Teacher
//       WHERE id_teacher = ?
//       `,
//       [id]
//     );

//     await connection.commit();

//     res.status(200).json({
//       message: "Xóa giáo viên thành công",
//     });
//   } catch (error) {
//     await connection.rollback();

//     console.error("Lỗi xóa giáo viên:", error);

//     res.status(500).json({
//       message:
//         "Không thể xóa giáo viên. Có thể giáo viên đang được dùng trong lớp học phần hoặc dữ liệu liên quan khác.",
//       error: error.message,
//       code: error.code,
//     });
//   } finally {
//     connection.release();
//   }
// });


// /*
// |--------------------------------------------------------------------------
// | API: Cập nhật giáo viên
// |--------------------------------------------------------------------------
// | Method: PUT
// | URL: /api/teachers/:id
// |--------------------------------------------------------------------------
// */
// router.put("/:id", async (req, res) => {
//   const { id } = req.params;

//   const {
//     teacher_code,
//     full_name,
//     gender,
//     date_of_birth,
//     phone,
//     email,
//     avatar,
//     department_id,
//     account_status,
//     password,
//   } = req.body;

//   if (!teacher_code || !full_name || !email || !phone) {
//     return res.status(400).json({
//       message: "Vui lòng nhập đầy đủ mã giáo viên, họ tên, email và số điện thoại",
//     });
//   }

//   if (!department_id) {
//     return res.status(400).json({
//       message: "Vui lòng chọn khoa/bộ môn",
//     });
//   }

//   const connection = await db.getConnection();

//   try {
//     await connection.beginTransaction();

//     const [existingTeachers] = await connection.query(
//       `
//       SELECT id_teacher
//       FROM Teacher
//       WHERE (teacher_code = ? OR email = ?)
//       AND id_teacher <> ?
//       LIMIT 1
//       `,
//       [teacher_code, email, id]
//     );

//     if (existingTeachers.length > 0) {
//       await connection.rollback();

//       return res.status(409).json({
//         message: "Mã giáo viên hoặc email đã tồn tại",
//       });
//     }

//     await connection.query(
//       `
//       UPDATE Teacher
//       SET
//         teacher_code = ?,
//         full_name = ?,
//         gender = ?,
//         date_of_birth = ?,
//         phone = ?,
//         email = ?,
//         avatar = ?,
//         department_id = ?,
//         updated_at = NOW()
//       WHERE id_teacher = ?
//       `,
//       [
//         teacher_code,
//         full_name,
//         gender || null,
//         date_of_birth || null,
//         phone,
//         email,
//         avatar || null,
//         Number(department_id),
//         id,
//       ]
//     );

//     if (password && password.trim() !== "") {
//       await connection.query(
//         `
//         UPDATE Account
//         SET
//           username = ?,
//           password = ?,
//           status = ?
//         WHERE teacher_id = ?
//         `,
//         [email, password, account_status || "ACTIVE", id]
//       );
//     } else {
//       await connection.query(
//         `
//         UPDATE Account
//         SET
//           username = ?,
//           status = ?
//         WHERE teacher_id = ?
//         `,
//         [email, account_status || "ACTIVE", id]
//       );
//     }

//     await connection.commit();

//     res.status(200).json({
//       message: "Cập nhật giáo viên thành công",
//     });
//   } catch (error) {
//     await connection.rollback();

//     console.error("Lỗi cập nhật giáo viên:", error);

//     res.status(500).json({
//       message: "Lỗi cập nhật giáo viên",
//       error: error.message,
//     });
//   } finally {
//     connection.release();
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | API: Xóa giáo viên
// |--------------------------------------------------------------------------
// | Method: DELETE
// | URL: /api/teachers/:id
// |--------------------------------------------------------------------------
// */
// router.delete("/:id", async (req, res) => {
//   const { id } = req.params;

//   const connection = await db.getConnection();

//   try {
//     await connection.beginTransaction();

//     await connection.query(
//       `
//       DELETE FROM Account
//       WHERE teacher_id = ?
//       `,
//       [id]
//     );

//     await connection.query(
//       `
//       DELETE FROM Teacher
//       WHERE id_teacher = ?
//       `,
//       [id]
//     );

//     await connection.commit();

//     res.status(200).json({
//       message: "Xóa giáo viên thành công",
//     });
//   } catch (error) {
//     await connection.rollback();

//     console.error("Lỗi xóa giáo viên:", error);

//     res.status(500).json({
//       message: "Lỗi xóa giáo viên",
//       error: error.message,
//     });
//   } finally {
//     connection.release();
//   }
// });

// export default router;

import express from "express";
import db from "../config/db.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| API: Lấy danh sách giáo viên
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers
|--------------------------------------------------------------------------
*/
router.get("/", async (req, res) => {
  try {
    const search = req.query.search || "";

    const [teachers] = await db.query(
      `
      SELECT
        t.id_teacher,
        t.teacher_code,
        t.full_name,
        t.gender,
        t.date_of_birth,
        t.phone,
        t.email,
        t.avatar,
        t.department_id,

        d.id_department,
        d.department_name,

        a.id_account,
        a.username,
        a.role,
        a.status AS account_status,

        t.created_at,
        t.updated_at,

        CASE
          WHEN a.status = 'ACTIVE' THEN 'Đang hoạt động'
          WHEN a.status = 'LOCKED' THEN 'Đã khóa'
          ELSE 'Chưa có tài khoản'
        END AS work_status,

        CASE
          WHEN a.status = 'ACTIVE' THEN 'active'
          WHEN a.status = 'LOCKED' THEN 'locked'
          ELSE 'inactive'
        END AS status_type

      FROM Teacher t
      LEFT JOIN Department d
        ON t.department_id = d.id_department
      LEFT JOIN Account a
        ON a.teacher_id = t.id_teacher

      WHERE
        t.full_name LIKE ?
        OR t.teacher_code LIKE ?
        OR t.email LIKE ?
        OR t.phone LIKE ?
        OR d.department_name LIKE ?

      ORDER BY t.id_teacher DESC
      `,
      [
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
      ]
    );

    res.status(200).json(teachers);
  } catch (error) {
    console.error("Lỗi lấy danh sách giáo viên:", error);

    res.status(500).json({
      message: "Lỗi lấy danh sách giáo viên",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| API: Thêm giáo viên mới
|--------------------------------------------------------------------------
| Method: POST
| URL: /api/teachers
|--------------------------------------------------------------------------
*/
router.post("/", async (req, res) => {
  const {
    teacher_code,
    full_name,
    gender,
    date_of_birth,
    phone,
    email,
    avatar,
    password,
    department_id,
    account_status,
  } = req.body;

  if (!teacher_code || !full_name || !email || !phone || !password) {
    return res.status(400).json({
      message:
        "Vui lòng nhập đầy đủ mã giáo viên, họ tên, email, số điện thoại và mật khẩu",
    });
  }

  if (!department_id) {
    return res.status(400).json({
      message: "Vui lòng chọn khoa/bộ môn",
    });
  }

  const validGenders = ["Nam", "Nữ", "Khác", "Male", "Female", "Other", "", null, undefined];

  if (!validGenders.includes(gender)) {
    return res.status(400).json({
      message: "Giới tính không hợp lệ",
    });
  }

  const validAccountStatus = ["ACTIVE", "LOCKED", "", null, undefined];

  if (!validAccountStatus.includes(account_status)) {
    return res.status(400).json({
      message: "Trạng thái tài khoản không hợp lệ",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [departments] = await connection.query(
      `
      SELECT id_department
      FROM Department
      WHERE id_department = ?
      LIMIT 1
      `,
      [Number(department_id)]
    );

    if (departments.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Khoa/bộ môn không tồn tại",
      });
    }

    const [existingTeachers] = await connection.query(
      `
      SELECT id_teacher
      FROM Teacher
      WHERE teacher_code = ? OR email = ?
      LIMIT 1
      `,
      [teacher_code.trim(), email.trim()]
    );

    if (existingTeachers.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Mã giáo viên hoặc email đã tồn tại",
      });
    }

    const [existingAccounts] = await connection.query(
      `
      SELECT id_account
      FROM Account
      WHERE username = ?
      LIMIT 1
      `,
      [email.trim()]
    );

    if (existingAccounts.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Tài khoản giáo viên đã tồn tại",
      });
    }

    const [teacherResult] = await connection.query(
      `
      INSERT INTO Teacher (
        teacher_code,
        full_name,
        gender,
        date_of_birth,
        phone,
        email,
        avatar,
        password,
        department_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        teacher_code.trim(),
        full_name.trim(),
        gender || null,
        date_of_birth || null,
        phone.trim(),
        email.trim(),
        avatar || null,
        password,
        Number(department_id),
      ]
    );

    const teacherId = teacherResult.insertId;

    await connection.query(
      `
      INSERT INTO Account (
        username,
        password,
        role,
        teacher_id,
        student_id,
        status
      )
      VALUES (?, ?, 'TEACHER', ?, NULL, ?)
      `,
      [
        email.trim(),
        password,
        teacherId,
        account_status || "ACTIVE",
      ]
    );

    await connection.commit();

    res.status(201).json({
      message: "Thêm giáo viên thành công",
      id_teacher: teacherId,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi thêm giáo viên:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Mã giáo viên, email hoặc tài khoản đã tồn tại",
        error: error.message,
        code: error.code,
      });
    }

    if (error.code === "ER_DATA_TOO_LONG") {
      return res.status(400).json({
        message:
          "Dữ liệu quá dài. Có thể avatar dạng Base64 vượt quá giới hạn cột trong MySQL.",
        error: error.message,
        code: error.code,
      });
    }

    res.status(500).json({
      message: "Lỗi thêm giáo viên",
      error: error.message,
      code: error.code,
    });
  } finally {
    connection.release();
  }
});

/*
|--------------------------------------------------------------------------
| API: Lấy chi tiết 1 giáo viên
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/:id
|--------------------------------------------------------------------------
*/
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [teachers] = await db.query(
      `
      SELECT
        t.id_teacher,
        t.teacher_code,
        t.full_name,
        t.gender,
        t.date_of_birth,
        t.phone,
        t.email,
        t.avatar,
        t.department_id,

        d.id_department,
        d.department_name,

        a.id_account,
        a.username,
        a.role,
        a.status AS account_status,

        t.created_at,
        t.updated_at,

        CASE
          WHEN a.status = 'ACTIVE' THEN 'Đang hoạt động'
          WHEN a.status = 'LOCKED' THEN 'Đã khóa'
          ELSE 'Chưa có tài khoản'
        END AS work_status,

        CASE
          WHEN a.status = 'ACTIVE' THEN 'active'
          WHEN a.status = 'LOCKED' THEN 'locked'
          ELSE 'inactive'
        END AS status_type

      FROM Teacher t
      LEFT JOIN Department d
        ON t.department_id = d.id_department
      LEFT JOIN Account a
        ON a.teacher_id = t.id_teacher

      WHERE t.id_teacher = ?
      `,
      [id]
    );

    if (teachers.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy giáo viên",
      });
    }

    res.status(200).json(teachers[0]);
  } catch (error) {
    console.error("Lỗi lấy chi tiết giáo viên:", error);

    res.status(500).json({
      message: "Lỗi lấy chi tiết giáo viên",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| API: Cập nhật giáo viên
|--------------------------------------------------------------------------
| Method: PUT
| URL: /api/teachers/:id
|--------------------------------------------------------------------------
*/
router.put("/:id", async (req, res) => {
  const { id } = req.params;

  const {
    teacher_code,
    full_name,
    gender,
    date_of_birth,
    phone,
    email,
    avatar,
    password,
    department_id,
    account_status,
  } = req.body;

  if (!teacher_code || !full_name || !email || !phone) {
    return res.status(400).json({
      message:
        "Vui lòng nhập đầy đủ mã giáo viên, họ tên, email và số điện thoại",
    });
  }

  if (!department_id) {
    return res.status(400).json({
      message: "Vui lòng chọn khoa/bộ môn",
    });
  }

  const validGenders = ["Nam", "Nữ", "Khác", "Male", "Female", "Other", "", null, undefined];

  if (!validGenders.includes(gender)) {
    return res.status(400).json({
      message: "Giới tính không hợp lệ",
    });
  }

  const validAccountStatus = ["ACTIVE", "LOCKED", "", null, undefined];

  if (!validAccountStatus.includes(account_status)) {
    return res.status(400).json({
      message: "Trạng thái tài khoản không hợp lệ",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [teachers] = await connection.query(
      `
      SELECT id_teacher
      FROM Teacher
      WHERE id_teacher = ?
      LIMIT 1
      `,
      [id]
    );

    if (teachers.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Không tìm thấy giáo viên",
      });
    }

    const [departments] = await connection.query(
      `
      SELECT id_department
      FROM Department
      WHERE id_department = ?
      LIMIT 1
      `,
      [Number(department_id)]
    );

    if (departments.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Khoa/bộ môn không tồn tại",
      });
    }

    const [duplicateTeachers] = await connection.query(
      `
      SELECT id_teacher
      FROM Teacher
      WHERE (teacher_code = ? OR email = ?)
      AND id_teacher <> ?
      LIMIT 1
      `,
      [teacher_code.trim(), email.trim(), id]
    );

    if (duplicateTeachers.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Mã giáo viên hoặc email đã tồn tại",
      });
    }

    await connection.query(
      `
      UPDATE Teacher
      SET
        teacher_code = ?,
        full_name = ?,
        gender = ?,
        date_of_birth = ?,
        phone = ?,
        email = ?,
        avatar = ?,
        department_id = ?,
        updated_at = NOW()
      WHERE id_teacher = ?
      `,
      [
        teacher_code.trim(),
        full_name.trim(),
        gender || null,
        date_of_birth || null,
        phone.trim(),
        email.trim(),
        avatar || null,
        Number(department_id),
        id,
      ]
    );

    if (password && password.trim() !== "") {
      await connection.query(
        `
        UPDATE Account
        SET
          username = ?,
          password = ?,
          status = ?
        WHERE teacher_id = ?
        `,
        [
          email.trim(),
          password,
          account_status || "ACTIVE",
          id,
        ]
      );

      await connection.query(
        `
        UPDATE Teacher
        SET password = ?
        WHERE id_teacher = ?
        `,
        [password, id]
      );
    } else {
      await connection.query(
        `
        UPDATE Account
        SET
          username = ?,
          status = ?
        WHERE teacher_id = ?
        `,
        [
          email.trim(),
          account_status || "ACTIVE",
          id,
        ]
      );
    }

    await connection.commit();

    res.status(200).json({
      message: "Cập nhật giáo viên thành công",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi cập nhật giáo viên:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Mã giáo viên, email hoặc tài khoản đã tồn tại",
        error: error.message,
        code: error.code,
      });
    }

    if (error.code === "ER_DATA_TOO_LONG") {
      return res.status(400).json({
        message:
          "Dữ liệu quá dài. Có thể avatar dạng Base64 vượt quá giới hạn cột trong MySQL.",
        error: error.message,
        code: error.code,
      });
    }

    res.status(500).json({
      message: "Lỗi cập nhật giáo viên",
      error: error.message,
      code: error.code,
    });
  } finally {
    connection.release();
  }
});

/*
|--------------------------------------------------------------------------
| API: Xóa giáo viên
|--------------------------------------------------------------------------
| Method: DELETE
| URL: /api/teachers/:id
|--------------------------------------------------------------------------
*/
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [teachers] = await connection.query(
      `
      SELECT id_teacher
      FROM Teacher
      WHERE id_teacher = ?
      LIMIT 1
      `,
      [id]
    );

    if (teachers.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Không tìm thấy giáo viên",
      });
    }

    await connection.query(
      `
      DELETE FROM Account
      WHERE teacher_id = ?
      `,
      [id]
    );

    await connection.query(
      `
      DELETE FROM Teacher
      WHERE id_teacher = ?
      `,
      [id]
    );

    await connection.commit();

    res.status(200).json({
      message: "Xóa giáo viên thành công",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi xóa giáo viên:", error);

    res.status(500).json({
      message:
        "Không thể xóa giáo viên. Có thể giáo viên đang được dùng trong lớp học phần hoặc dữ liệu liên quan khác.",
      error: error.message,
      code: error.code,
    });
  } finally {
    connection.release();
  }
});

export default router;