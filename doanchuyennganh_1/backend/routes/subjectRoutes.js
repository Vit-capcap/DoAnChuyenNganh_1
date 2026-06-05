import express from "express";
import db from "../config/db.js";

const router = express.Router();

/* =========================================================
   FILE: subjectRoutes.js
   ---------------------------------------------------------
   Chức năng:
   - Lấy danh sách môn học + thống kê
   - Lấy chi tiết môn học
   - Thêm môn học
   - Cập nhật môn học
   - Xóa môn học

   LƯU Ý DATABASE:
   Database mới dùng tên bảng chữ thường:
   - subject
   - courseclass
   - teacher

   THỨ TỰ ROUTE:
   1. GET    /api/subjects
   2. GET    /api/subjects/:id
   3. POST   /api/subjects
   4. PUT    /api/subjects/:id
   5. DELETE /api/subjects/:id
========================================================= */


/* =========================================================
   1. HẰNG SỐ VÀ HELPER
========================================================= */

/*
|--------------------------------------------------------------------------
| VALID_SORTS
|--------------------------------------------------------------------------
| Chức năng:
| - Danh sách kiểu sắp xếp hợp lệ.
|--------------------------------------------------------------------------
*/
const VALID_SORTS = [
  "newest",
  "credits_desc",
  "credits_asc",
  "name_az",
  "name_za",
];

/*
|--------------------------------------------------------------------------
| VALID_STATUS_FILTERS
|--------------------------------------------------------------------------
| Chức năng:
| - Bộ lọc trạng thái giảng dạy của môn học.
| - ACTIVE: môn đang có lớp học phần OPEN.
| - INACTIVE: môn chưa có lớp học phần OPEN.
|--------------------------------------------------------------------------
*/
const VALID_STATUS_FILTERS = ["", "ACTIVE", "INACTIVE"];

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
| toNull()
|--------------------------------------------------------------------------
| Chức năng:
| - Chuyển chuỗi rỗng thành null trước khi lưu MySQL.
|--------------------------------------------------------------------------
*/
function toNull(value) {
  const text = normalizeText(value);
  return text === "" ? null : text;
}

/*
|--------------------------------------------------------------------------
| toPositiveInt()
|--------------------------------------------------------------------------
| Chức năng:
| - Chuyển dữ liệu thành số nguyên dương.
| - Dùng cho credits, page, limit.
|--------------------------------------------------------------------------
*/
function toPositiveInt(value, defaultValue = 1) {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    return defaultValue;
  }

  return number;
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
| validateSubjectPayload()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra dữ liệu thêm/sửa môn học.
|--------------------------------------------------------------------------
*/
function validateSubjectPayload({ subject_code, subject_name, credits }) {
  if (!subject_code || !subject_name) {
    return {
      valid: false,
      message: "Vui lòng nhập mã môn học và tên môn học",
    };
  }

  if (!Number.isInteger(credits) || credits <= 0) {
    return {
      valid: false,
      message: "Số tín chỉ phải là số nguyên lớn hơn 0",
    };
  }

  return {
    valid: true,
    message: "",
  };
}

/*
|--------------------------------------------------------------------------
| buildOrderSql()
|--------------------------------------------------------------------------
| Chức năng:
| - Tạo câu ORDER BY theo lựa chọn sort từ frontend.
|--------------------------------------------------------------------------
*/
function buildOrderSql(sort) {
  if (sort === "credits_desc") {
    return "ORDER BY s.credits DESC, s.id_subject DESC";
  }

  if (sort === "credits_asc") {
    return "ORDER BY s.credits ASC, s.id_subject DESC";
  }

  if (sort === "name_az") {
    return "ORDER BY s.subject_name ASC";
  }

  if (sort === "name_za") {
    return "ORDER BY s.subject_name DESC";
  }

  return "ORDER BY s.id_subject DESC";
}

/*
|--------------------------------------------------------------------------
| checkSubjectExists()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra môn học có tồn tại theo id_subject.
|--------------------------------------------------------------------------
*/
async function checkSubjectExists(id) {
  const [subjects] = await db.query(
    `
    SELECT id_subject
    FROM subject
    WHERE id_subject = ?
    LIMIT 1
    `,
    [id]
  );

  return subjects.length > 0;
}

/*
|--------------------------------------------------------------------------
| checkSubjectCodeDuplicate()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra mã môn học đã tồn tại chưa.
| - Khi cập nhật thì bỏ qua chính môn học hiện tại.
|--------------------------------------------------------------------------
*/
async function checkSubjectCodeDuplicate(subjectCode, ignoreSubjectId = null) {
  const params = [subjectCode];

  let sql = `
    SELECT id_subject
    FROM subject
    WHERE subject_code = ?
  `;

  if (ignoreSubjectId) {
    sql += `
      AND id_subject <> ?
    `;
    params.push(ignoreSubjectId);
  }

  sql += `
    LIMIT 1
  `;

  const [rows] = await db.query(sql, params);

  return rows.length > 0;
}


/* =========================================================
   2. API: LẤY DANH SÁCH MÔN HỌC + THỐNG KÊ
   ---------------------------------------------------------
   Method: GET
   URL: /api/subjects

   Query:
   - search: tìm theo mã môn, tên môn, mô tả
   - status: ACTIVE / INACTIVE
   - sort: newest / credits_desc / credits_asc / name_az / name_za
   - page
   - limit
========================================================= */
router.get("/", async (req, res) => {
  try {
    const search = normalizeText(req.query.search);
    const status = normalizeText(req.query.status).toUpperCase();
    const sort = normalizeText(req.query.sort) || "newest";

    const page = toPositiveInt(req.query.page, 1);
    const limit = toPositiveInt(req.query.limit, 10);
    const offset = (page - 1) * limit;

    if (!VALID_STATUS_FILTERS.includes(status)) {
      return res.status(400).json({
        message: "Trạng thái lọc môn học không hợp lệ",
      });
    }

    if (!VALID_SORTS.includes(sort)) {
      return res.status(400).json({
        message: "Kiểu sắp xếp môn học không hợp lệ",
      });
    }

    let whereSql = `
      WHERE
        (
          s.subject_code LIKE ?
          OR s.subject_name LIKE ?
          OR s.description LIKE ?
        )
    `;

    const params = [`%${search}%`, `%${search}%`, `%${search}%`];

    /*
      ACTIVE:
      - Môn học đang có ít nhất 1 lớp học phần trạng thái OPEN.
    */
    if (status === "ACTIVE") {
      whereSql += `
        AND EXISTS (
          SELECT 1
          FROM courseclass cc_active
          WHERE cc_active.id_subject = s.id_subject
            AND cc_active.status = 'OPEN'
        )
      `;
    }

    /*
      INACTIVE:
      - Môn học chưa có lớp học phần OPEN.
    */
    if (status === "INACTIVE") {
      whereSql += `
        AND NOT EXISTS (
          SELECT 1
          FROM courseclass cc_active
          WHERE cc_active.id_subject = s.id_subject
            AND cc_active.status = 'OPEN'
        )
      `;
    }

    const orderSql = buildOrderSql(sort);

    /*
      1. Đếm tổng số môn học theo bộ lọc
    */
    const [countRows] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM subject s
      ${whereSql}
      `,
      params
    );

    const total = Number(countRows[0]?.total || 0);

    /*
      2. Lấy danh sách môn học
      - total_course_classes: tổng số lớp học phần của môn đó
      - open_course_classes: số lớp đang mở
      - teaching_status: ACTIVE nếu có lớp OPEN
      - teacher_names: danh sách giáo viên đang dạy môn đó
    */
    const [subjects] = await db.query(
      `
      SELECT
        s.id_subject,
        s.subject_code,
        s.subject_name,
        s.credits,
        s.description,

        COUNT(DISTINCT cc.id_course_class) AS total_course_classes,

        COALESCE(
          SUM(
            CASE
              WHEN cc.status = 'OPEN' THEN 1
              ELSE 0
            END
          ),
          0
        ) AS open_course_classes,

        CASE
          WHEN COALESCE(
            SUM(
              CASE
                WHEN cc.status = 'OPEN' THEN 1
                ELSE 0
              END
            ),
            0
          ) > 0
          THEN 'ACTIVE'
          ELSE 'INACTIVE'
        END AS teaching_status,

        GROUP_CONCAT(
          DISTINCT t.full_name
          ORDER BY t.full_name ASC
          SEPARATOR ', '
        ) AS teacher_names

      FROM subject s

      LEFT JOIN courseclass cc
        ON cc.id_subject = s.id_subject

      LEFT JOIN teacher t
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

    /*
      3. Thống kê tổng quan môn học
    */
    const [statsRows] = await db.query(
      `
      SELECT
        COUNT(*) AS total_subjects,
        ROUND(AVG(credits), 2) AS average_credits
      FROM subject
      `
    );

    const [activeRows] = await db.query(
      `
      SELECT COUNT(DISTINCT s.id_subject) AS active_subjects
      FROM subject s
      INNER JOIN courseclass cc
        ON cc.id_subject = s.id_subject
      WHERE cc.status = 'OPEN'
      `
    );

    return res.status(200).json({
      subjects,
      stats: {
        total_subjects: Number(statsRows[0]?.total_subjects || 0),
        active_subjects: Number(activeRows[0]?.active_subjects || 0),
        average_credits: Number(statsRows[0]?.average_credits || 0),
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
    return sendServerError(res, "Lỗi lấy danh sách môn học", error);
  }
});


/* =========================================================
   3. API: LẤY CHI TIẾT 1 MÔN HỌC
   ---------------------------------------------------------
   Method: GET
   URL: /api/subjects/:id
========================================================= */
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
      FROM subject
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

    return res.status(200).json(subjects[0]);
  } catch (error) {
    console.error("Lỗi lấy chi tiết môn học:", error);
    return sendServerError(res, "Lỗi lấy chi tiết môn học", error);
  }
});


/* =========================================================
   4. API: THÊM MÔN HỌC
   ---------------------------------------------------------
   Method: POST
   URL: /api/subjects

   Body:
   - subject_code
   - subject_name
   - credits
   - description
========================================================= */
router.post("/", async (req, res) => {
  try {
    const subjectCode = normalizeText(req.body.subject_code);
    const subjectName = normalizeText(req.body.subject_name);
    const credits = toPositiveInt(req.body.credits, 3);
    const description = toNull(req.body.description);

    const validation = validateSubjectPayload({
      subject_code: subjectCode,
      subject_name: subjectName,
      credits,
    });

    if (!validation.valid) {
      return res.status(400).json({
        message: validation.message,
      });
    }

    const isDuplicate = await checkSubjectCodeDuplicate(subjectCode);

    if (isDuplicate) {
      return res.status(409).json({
        message: "Mã môn học đã tồn tại",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO subject (
        subject_code,
        subject_name,
        credits,
        description
      )
      VALUES (?, ?, ?, ?)
      `,
      [subjectCode, subjectName, credits, description]
    );

    return res.status(201).json({
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

    return sendServerError(res, "Lỗi thêm môn học", error);
  }
});


/* =========================================================
   5. API: CẬP NHẬT MÔN HỌC
   ---------------------------------------------------------
   Method: PUT
   URL: /api/subjects/:id
========================================================= */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const subjectCode = normalizeText(req.body.subject_code);
    const subjectName = normalizeText(req.body.subject_name);
    const credits = toPositiveInt(req.body.credits, 3);
    const description = toNull(req.body.description);

    const validation = validateSubjectPayload({
      subject_code: subjectCode,
      subject_name: subjectName,
      credits,
    });

    if (!validation.valid) {
      return res.status(400).json({
        message: validation.message,
      });
    }

    const exists = await checkSubjectExists(id);

    if (!exists) {
      return res.status(404).json({
        message: "Không tìm thấy môn học",
      });
    }

    const isDuplicate = await checkSubjectCodeDuplicate(subjectCode, id);

    if (isDuplicate) {
      return res.status(409).json({
        message: "Mã môn học đã tồn tại",
      });
    }

    await db.query(
      `
      UPDATE subject
      SET
        subject_code = ?,
        subject_name = ?,
        credits = ?,
        description = ?
      WHERE id_subject = ?
      `,
      [subjectCode, subjectName, credits, description, id]
    );

    return res.status(200).json({
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

    return sendServerError(res, "Lỗi cập nhật môn học", error);
  }
});


/* =========================================================
   6. API: XÓA MÔN HỌC
   ---------------------------------------------------------
   Method: DELETE
   URL: /api/subjects/:id

   Logic:
   - Nếu môn học đang được dùng trong courseclass thì không cho xóa.
========================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const exists = await checkSubjectExists(id);

    if (!exists) {
      return res.status(404).json({
        message: "Không tìm thấy môn học",
      });
    }

    /*
      Không cho xóa môn học nếu đã có lớp học phần dùng môn này.
      Lý do:
      - Nếu xóa sẽ ảnh hưởng courseclass, schedule, session, attendance.
    */
    const [courseClasses] = await db.query(
      `
      SELECT id_course_class
      FROM courseclass
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
      DELETE FROM subject
      WHERE id_subject = ?
      `,
      [id]
    );

    return res.status(200).json({
      message: "Xóa môn học thành công",
    });
  } catch (error) {
    console.error("Lỗi xóa môn học:", error);
    return sendServerError(res, "Lỗi xóa môn học", error);
  }
});

export default router;