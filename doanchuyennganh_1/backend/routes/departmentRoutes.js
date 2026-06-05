import express from "express";
import db from "../config/db.js";

const router = express.Router();

/* =========================================================
   FILE: departmentRoutes.js
   ---------------------------------------------------------
   Chức năng:
   - Lấy danh sách khoa / bộ môn
   - Hỗ trợ tìm kiếm theo tên khoa hoặc mô tả

   LƯU Ý DATABASE:
   Database mới dùng tên bảng chữ thường:
   - department

   Bảng department gồm:
   - id_department
   - department_name
   - description

   THỨ TỰ ROUTE:
   1. GET /api/departments
========================================================= */


/* =========================================================
   1. HELPER DÙNG CHUNG
========================================================= */

/*
|--------------------------------------------------------------------------
| normalizeText()
|--------------------------------------------------------------------------
| Chức năng:
| - Chuẩn hóa dữ liệu text.
| - Tránh lỗi undefined/null.
| - Xóa khoảng trắng đầu/cuối.
|--------------------------------------------------------------------------
*/
function normalizeText(value) {
  return String(value || "").trim();
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


/* =========================================================
   2. API: LẤY DANH SÁCH KHOA / BỘ MÔN
   ---------------------------------------------------------
   Method: GET
   URL: /api/departments

   Query:
   - search: tìm theo tên khoa hoặc mô tả

   Ví dụ:
   GET /api/departments
   GET /api/departments?search=công nghệ

   Chức năng:
   - Lấy toàn bộ danh sách khoa/bộ môn.
   - Nếu có search thì lọc theo department_name hoặc description.
========================================================= */
router.get("/", async (req, res) => {
  try {
    const search = normalizeText(req.query.search);
    const keyword = `%${search}%`;

    const [departments] = await db.query(
      `
      SELECT
        id_department,
        department_name,
        description
      FROM department
      WHERE
        department_name LIKE ?
        OR description LIKE ?
      ORDER BY department_name ASC
      `,
      [keyword, keyword]
    );

    return res.status(200).json(departments);
  } catch (error) {
    console.error("Lỗi lấy danh sách khoa/bộ môn:", error);

    return sendServerError(res, "Lỗi lấy danh sách khoa/bộ môn", error);
  }
});

export default router;