import express from "express";
import db from "../config/db.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| API: Lấy danh sách khoa/bộ môn
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/departments
|--------------------------------------------------------------------------
*/
router.get("/", async (req, res) => {
  try {
    const [departments] = await db.query(
      `
      SELECT 
        id_department,
        department_name,
        description
      FROM Department
      ORDER BY id_department ASC
      `
    );

    res.status(200).json(departments);
  } catch (error) {
    console.error("Lỗi lấy danh sách khoa:", error);

    res.status(500).json({
      message: "Lỗi lấy danh sách khoa",
      error: error.message,
    });
  }
});

export default router;