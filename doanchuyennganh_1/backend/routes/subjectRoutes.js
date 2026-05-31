import express from "express";
import db from "../config/db.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| API: Lấy danh sách môn học + thống kê
|--------------------------------------------------------------------------
| GET /api/subjects
|--------------------------------------------------------------------------
*/
router.get("/", async (req, res) => {
  try {
    const search = req.query.search || "";
    const status = req.query.status || "";
    const sort = req.query.sort || "newest";
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const offset = (page - 1) * limit;

    let whereSql = `
      WHERE
        (
          s.subject_code LIKE ?
          OR s.subject_name LIKE ?
          OR s.description LIKE ?
        )
    `;

    const params = [`%${search}%`, `%${search}%`, `%${search}%`];

    if (status === "ACTIVE") {
      whereSql += `
        AND EXISTS (
          SELECT 1
          FROM CourseClass cc_active
          WHERE cc_active.id_subject = s.id_subject
          AND cc_active.status = 'OPEN'
        )
      `;
    }

    if (status === "INACTIVE") {
      whereSql += `
        AND NOT EXISTS (
          SELECT 1
          FROM CourseClass cc_active
          WHERE cc_active.id_subject = s.id_subject
          AND cc_active.status = 'OPEN'
        )
      `;
    }

    let orderSql = `ORDER BY s.id_subject DESC`;

    if (sort === "credits_desc") {
      orderSql = `ORDER BY s.credits DESC, s.id_subject DESC`;
    }

    if (sort === "credits_asc") {
      orderSql = `ORDER BY s.credits ASC, s.id_subject DESC`;
    }

    if (sort === "name_az") {
      orderSql = `ORDER BY s.subject_name ASC`;
    }

    if (sort === "name_za") {
      orderSql = `ORDER BY s.subject_name DESC`;
    }

    const [countRows] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM Subject s
      ${whereSql}
      `,
      params
    );

    const total = countRows[0]?.total || 0;

    const [subjects] = await db.query(
      `
      SELECT
        s.id_subject,
        s.subject_code,
        s.subject_name,
        s.credits,
        s.description,

        COUNT(DISTINCT cc.id_course_class) AS total_course_classes,

        SUM(
          CASE
            WHEN cc.status = 'OPEN' THEN 1
            ELSE 0
          END
        ) AS open_course_classes,

        CASE
          WHEN SUM(CASE WHEN cc.status = 'OPEN' THEN 1 ELSE 0 END) > 0
          THEN 'ACTIVE'
          ELSE 'INACTIVE'
        END AS teaching_status,

        GROUP_CONCAT(
          DISTINCT t.full_name
          ORDER BY t.full_name ASC
          SEPARATOR ', '
        ) AS teacher_names

      FROM Subject s
      LEFT JOIN CourseClass cc
        ON cc.id_subject = s.id_subject
      LEFT JOIN Teacher t
        ON t.id_teacher = cc.id_teacher

      ${whereSql}

      GROUP BY
        s.id_subject,
        s.subject_code,
        s.subject_name,
        s.credits,
        s.description

      ${orderSql}

      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    const [statsRows] = await db.query(
      `
      SELECT
        COUNT(*) AS total_subjects,
        ROUND(AVG(credits), 2) AS average_credits
      FROM Subject
      `
    );

    const [activeRows] = await db.query(
      `
      SELECT COUNT(DISTINCT s.id_subject) AS active_subjects
      FROM Subject s
      INNER JOIN CourseClass cc
        ON cc.id_subject = s.id_subject
      WHERE cc.status = 'OPEN'
      `
    );

    res.status(200).json({
      subjects,
      stats: {
        total_subjects: statsRows[0]?.total_subjects || 0,
        active_subjects: activeRows[0]?.active_subjects || 0,
        average_credits: statsRows[0]?.average_credits || 0,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách môn học:", error);

    res.status(500).json({
      message: "Lỗi lấy danh sách môn học",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| API: Lấy chi tiết 1 môn học
|--------------------------------------------------------------------------
| GET /api/subjects/:id
|--------------------------------------------------------------------------
*/
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [subjects] = await db.query(
      `
      SELECT
        id_subject,
        subject_code,
        subject_name,
        credits,
        description
      FROM Subject
      WHERE id_subject = ?
      LIMIT 1
      `,
      [id]
    );

    if (subjects.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy môn học",
      });
    }

    res.status(200).json(subjects[0]);
  } catch (error) {
    console.error("Lỗi lấy chi tiết môn học:", error);

    res.status(500).json({
      message: "Lỗi lấy chi tiết môn học",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| API: Thêm môn học
|--------------------------------------------------------------------------
| POST /api/subjects
|--------------------------------------------------------------------------
*/
router.post("/", async (req, res) => {
  try {
    const { subject_code, subject_name, credits, description } = req.body;

    if (!subject_code || !subject_name) {
      return res.status(400).json({
        message: "Vui lòng nhập mã môn học và tên môn học",
      });
    }

    const [existing] = await db.query(
      `
      SELECT id_subject
      FROM Subject
      WHERE subject_code = ?
      LIMIT 1
      `,
      [subject_code.trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: "Mã môn học đã tồn tại",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO Subject (
        subject_code,
        subject_name,
        credits,
        description
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        subject_code.trim(),
        subject_name.trim(),
        Number(credits || 3),
        description || null,
      ]
    );

    res.status(201).json({
      message: "Thêm môn học thành công",
      id_subject: result.insertId,
    });
  } catch (error) {
    console.error("Lỗi thêm môn học:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Mã môn học đã tồn tại",
        error: error.message,
        code: error.code,
      });
    }

    res.status(500).json({
      message: "Lỗi thêm môn học",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| API: Cập nhật môn học
|--------------------------------------------------------------------------
| PUT /api/subjects/:id
|--------------------------------------------------------------------------
*/
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_code, subject_name, credits, description } = req.body;

    if (!subject_code || !subject_name) {
      return res.status(400).json({
        message: "Vui lòng nhập mã môn học và tên môn học",
      });
    }

    const [subjects] = await db.query(
      `
      SELECT id_subject
      FROM Subject
      WHERE id_subject = ?
      LIMIT 1
      `,
      [id]
    );

    if (subjects.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy môn học",
      });
    }

    const [duplicates] = await db.query(
      `
      SELECT id_subject
      FROM Subject
      WHERE subject_code = ?
      AND id_subject <> ?
      LIMIT 1
      `,
      [subject_code.trim(), id]
    );

    if (duplicates.length > 0) {
      return res.status(409).json({
        message: "Mã môn học đã tồn tại",
      });
    }

    await db.query(
      `
      UPDATE Subject
      SET
        subject_code = ?,
        subject_name = ?,
        credits = ?,
        description = ?
      WHERE id_subject = ?
      `,
      [
        subject_code.trim(),
        subject_name.trim(),
        Number(credits || 3),
        description || null,
        id,
      ]
    );

    res.status(200).json({
      message: "Cập nhật môn học thành công",
    });
  } catch (error) {
    console.error("Lỗi cập nhật môn học:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Mã môn học đã tồn tại",
        error: error.message,
        code: error.code,
      });
    }

    res.status(500).json({
      message: "Lỗi cập nhật môn học",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| API: Xóa môn học
|--------------------------------------------------------------------------
| DELETE /api/subjects/:id
|--------------------------------------------------------------------------
*/
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [subjects] = await db.query(
      `
      SELECT id_subject
      FROM Subject
      WHERE id_subject = ?
      LIMIT 1
      `,
      [id]
    );

    if (subjects.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy môn học",
      });
    }

    const [courseClasses] = await db.query(
      `
      SELECT id_course_class
      FROM CourseClass
      WHERE id_subject = ?
      LIMIT 1
      `,
      [id]
    );

    if (courseClasses.length > 0) {
      return res.status(409).json({
        message:
          "Không thể xóa môn học vì môn này đang được dùng trong lớp học phần",
      });
    }

    await db.query(
      `
      DELETE FROM Subject
      WHERE id_subject = ?
      `,
      [id]
    );

    res.status(200).json({
      message: "Xóa môn học thành công",
    });
  } catch (error) {
    console.error("Lỗi xóa môn học:", error);

    res.status(500).json({
      message: "Lỗi xóa môn học",
      error: error.message,
      code: error.code,
    });
  }
});

export default router;