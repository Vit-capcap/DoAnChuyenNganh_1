// import express from "express";
// import db from "../config/db.js";

// const router = express.Router();

// const validStatus = ["ONLINE", "OFFLINE"];

// /*
// |--------------------------------------------------------------------------
// | API: Lấy danh sách camera + thống kê + lịch sử nhận diện
// |--------------------------------------------------------------------------
// | GET /api/cameras
// |--------------------------------------------------------------------------
// */
// router.get("/", async (req, res) => {
//   try {
//     const search = req.query.search || "";
//     const status = req.query.status || "";
//     const id_room = req.query.id_room || "";

//     let whereSql = `
//       WHERE (
//         c.camera_name LIKE ?
//         OR c.camera_ip LIKE ?
//         OR c.location LIKE ?
//         OR r.room_code LIKE ?
//         OR r.room_name LIKE ?
//         OR r.building LIKE ?
//       )
//     `;

//     const params = [
//       `%${search}%`,
//       `%${search}%`,
//       `%${search}%`,
//       `%${search}%`,
//       `%${search}%`,
//       `%${search}%`,
//     ];

//     if (status) {
//       whereSql += ` AND c.status = ?`;
//       params.push(status);
//     }

//     if (id_room) {
//       whereSql += ` AND c.id_room = ?`;
//       params.push(Number(id_room));
//     }

//     const [cameras] = await db.query(
//       `
//       SELECT
//         c.id_camera,
//         c.camera_name,
//         c.camera_ip,
//         c.location,
//         c.id_room,
//         c.status,

//         r.room_code,
//         r.room_name,
//         r.building,
//         r.floor,
//         r.capacity,

//         COUNT(rh.id_history) AS today_recognition_count,

//         ROUND(AVG(rh.confidence), 2) AS avg_confidence

//       FROM CameraDevice c
//       LEFT JOIN ClassRoom r
//         ON r.id_room = c.id_room
//       LEFT JOIN RecognitionHistory rh
//         ON rh.camera_id = c.id_camera
//         AND DATE(rh.capture_time) = CURDATE()

//       ${whereSql}

//       GROUP BY
//         c.id_camera,
//         c.camera_name,
//         c.camera_ip,
//         c.location,
//         c.id_room,
//         c.status,
//         r.room_code,
//         r.room_name,
//         r.building,
//         r.floor,
//         r.capacity

//       ORDER BY c.id_camera DESC
//       `,
//       params
//     );

//     const [statsRows] = await db.query(
//       `
//       SELECT
//         COUNT(*) AS total_camera,
//         SUM(CASE WHEN status = 'ONLINE' THEN 1 ELSE 0 END) AS online_camera,
//         SUM(CASE WHEN status = 'OFFLINE' THEN 1 ELSE 0 END) AS offline_camera
//       FROM CameraDevice
//       `
//     );

//     const [todayRows] = await db.query(
//       `
//       SELECT
//         COUNT(*) AS today_faces,
//         ROUND(AVG(confidence), 2) AS today_accuracy
//       FROM RecognitionHistory
//       WHERE DATE(capture_time) = CURDATE()
//       `
//     );

//     const [activities] = await db.query(
//       `
//       SELECT
//         rh.id_history,
//         rh.id_student,
//         rh.capture_time,
//         rh.confidence,
//         rh.camera_id,
//         rh.result,
//         rh.image_path,

//         s.student_code,
//         s.full_name,
//         s.class_name,
//         s.avatar,

//         c.camera_name,
//         c.camera_ip,
//         c.location,

//         r.room_code,
//         r.room_name,
//         r.building

//       FROM RecognitionHistory rh
//       LEFT JOIN Student s
//         ON s.id_student = rh.id_student
//       LEFT JOIN CameraDevice c
//         ON c.id_camera = rh.camera_id
//       LEFT JOIN ClassRoom r
//         ON r.id_room = c.id_room

//       ORDER BY rh.capture_time DESC
//       LIMIT 30
//       `
//     );

//     res.status(200).json({
//       cameras,
//       stats: {
//         total_camera: statsRows[0]?.total_camera || 0,
//         online_camera: statsRows[0]?.online_camera || 0,
//         offline_camera: statsRows[0]?.offline_camera || 0,
//         today_faces: todayRows[0]?.today_faces || 0,
//         today_accuracy: todayRows[0]?.today_accuracy || 0,
//       },
//       activities,
//     });
//   } catch (error) {
//     console.error("Lỗi lấy danh sách camera:", error);

//     res.status(500).json({
//       message: "Lỗi lấy danh sách camera",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | API: Options phòng học cho camera
// |--------------------------------------------------------------------------
// | GET /api/cameras/options
// |--------------------------------------------------------------------------
// */
// router.get("/options", async (req, res) => {
//   try {
//     const [rooms] = await db.query(
//       `
//       SELECT
//         id_room,
//         room_code,
//         room_name,
//         building,
//         floor,
//         status
//       FROM ClassRoom
//       ORDER BY room_code ASC
//       `
//     );

//     res.status(200).json({
//       rooms,
//       statuses: validStatus,
//     });
//   } catch (error) {
//     console.error("Lỗi lấy options camera:", error);

//     res.status(500).json({
//       message: "Lỗi lấy options camera",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | API: Thêm camera
// |--------------------------------------------------------------------------
// | POST /api/cameras
// |--------------------------------------------------------------------------
// */
// router.post("/", async (req, res) => {
//   try {
//     const {
//       camera_name,
//       camera_ip,
//       location,
//       id_room,
//       status = "ONLINE",
//     } = req.body;

//     if (!camera_name || !camera_ip) {
//       return res.status(400).json({
//         message: "Vui lòng nhập tên camera và IP camera",
//       });
//     }

//     if (!validStatus.includes(status)) {
//       return res.status(400).json({
//         message: "Trạng thái camera không hợp lệ",
//       });
//     }

//     const [existing] = await db.query(
//       `
//       SELECT id_camera
//       FROM CameraDevice
//       WHERE camera_ip = ?
//       LIMIT 1
//       `,
//       [camera_ip.trim()]
//     );

//     if (existing.length > 0) {
//       return res.status(409).json({
//         message: "IP camera đã tồn tại",
//       });
//     }

//     if (id_room) {
//       const [rooms] = await db.query(
//         `
//         SELECT id_room
//         FROM ClassRoom
//         WHERE id_room = ?
//         LIMIT 1
//         `,
//         [Number(id_room)]
//       );

//       if (rooms.length === 0) {
//         return res.status(404).json({
//           message: "Phòng học không tồn tại",
//         });
//       }
//     }

//     const [result] = await db.query(
//       `
//       INSERT INTO CameraDevice (
//         camera_name,
//         camera_ip,
//         location,
//         id_room,
//         status
//       )
//       VALUES (?, ?, ?, ?, ?)
//       `,
//       [
//         camera_name.trim(),
//         camera_ip.trim(),
//         location || null,
//         id_room ? Number(id_room) : null,
//         status,
//       ]
//     );

//     res.status(201).json({
//       message: "Thêm camera thành công",
//       id_camera: result.insertId,
//     });
//   } catch (error) {
//     console.error("Lỗi thêm camera:", error);

//     if (error.code === "ER_DUP_ENTRY") {
//       return res.status(409).json({
//         message: "Camera đã tồn tại",
//         error: error.message,
//         code: error.code,
//       });
//     }

//     res.status(500).json({
//       message: "Lỗi thêm camera",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | API: Cập nhật camera
// |--------------------------------------------------------------------------
// | PUT /api/cameras/:id
// |--------------------------------------------------------------------------
// */
// router.put("/:id", async (req, res) => {
//   try {
//     const { id } = req.params;

//     const {
//       camera_name,
//       camera_ip,
//       location,
//       id_room,
//       status = "ONLINE",
//     } = req.body;

//     if (!camera_name || !camera_ip) {
//       return res.status(400).json({
//         message: "Vui lòng nhập tên camera và IP camera",
//       });
//     }

//     if (!validStatus.includes(status)) {
//       return res.status(400).json({
//         message: "Trạng thái camera không hợp lệ",
//       });
//     }

//     const [cameras] = await db.query(
//       `
//       SELECT id_camera
//       FROM CameraDevice
//       WHERE id_camera = ?
//       LIMIT 1
//       `,
//       [id]
//     );

//     if (cameras.length === 0) {
//       return res.status(404).json({
//         message: "Không tìm thấy camera",
//       });
//     }

//     const [duplicates] = await db.query(
//       `
//       SELECT id_camera
//       FROM CameraDevice
//       WHERE camera_ip = ?
//       AND id_camera <> ?
//       LIMIT 1
//       `,
//       [camera_ip.trim(), id]
//     );

//     if (duplicates.length > 0) {
//       return res.status(409).json({
//         message: "IP camera đã tồn tại",
//       });
//     }

//     await db.query(
//       `
//       UPDATE CameraDevice
//       SET
//         camera_name = ?,
//         camera_ip = ?,
//         location = ?,
//         id_room = ?,
//         status = ?
//       WHERE id_camera = ?
//       `,
//       [
//         camera_name.trim(),
//         camera_ip.trim(),
//         location || null,
//         id_room ? Number(id_room) : null,
//         status,
//         id,
//       ]
//     );

//     res.status(200).json({
//       message: "Cập nhật camera thành công",
//     });
//   } catch (error) {
//     console.error("Lỗi cập nhật camera:", error);

//     res.status(500).json({
//       message: "Lỗi cập nhật camera",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | API: Đổi trạng thái camera
// |--------------------------------------------------------------------------
// | PATCH /api/cameras/:id/status
// |--------------------------------------------------------------------------
// */
// router.patch("/:id/status", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     if (!validStatus.includes(status)) {
//       return res.status(400).json({
//         message: "Trạng thái camera không hợp lệ",
//       });
//     }

//     const [cameras] = await db.query(
//       `
//       SELECT id_camera
//       FROM CameraDevice
//       WHERE id_camera = ?
//       LIMIT 1
//       `,
//       [id]
//     );

//     if (cameras.length === 0) {
//       return res.status(404).json({
//         message: "Không tìm thấy camera",
//       });
//     }

//     await db.query(
//       `
//       UPDATE CameraDevice
//       SET status = ?
//       WHERE id_camera = ?
//       `,
//       [status, id]
//     );

//     res.status(200).json({
//       message:
//         status === "ONLINE"
//           ? "Đã bật camera"
//           : "Đã tắt camera",
//     });
//   } catch (error) {
//     console.error("Lỗi đổi trạng thái camera:", error);

//     res.status(500).json({
//       message: "Lỗi đổi trạng thái camera",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | API: Xóa camera
// |--------------------------------------------------------------------------
// | DELETE /api/cameras/:id
// |--------------------------------------------------------------------------
// */
// router.delete("/:id", async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [cameras] = await db.query(
//       `
//       SELECT id_camera
//       FROM CameraDevice
//       WHERE id_camera = ?
//       LIMIT 1
//       `,
//       [id]
//     );

//     if (cameras.length === 0) {
//       return res.status(404).json({
//         message: "Không tìm thấy camera",
//       });
//     }

//     const [histories] = await db.query(
//       `
//       SELECT id_history
//       FROM RecognitionHistory
//       WHERE camera_id = ?
//       LIMIT 1
//       `,
//       [id]
//     );

//     if (histories.length > 0) {
//       return res.status(409).json({
//         message:
//           "Không thể xóa camera vì camera đã có lịch sử nhận diện. Hãy chuyển camera sang OFFLINE thay vì xóa.",
//       });
//     }

//     await db.query(
//       `
//       DELETE FROM CameraDevice
//       WHERE id_camera = ?
//       `,
//       [id]
//     );

//     res.status(200).json({
//       message: "Xóa camera thành công",
//     });
//   } catch (error) {
//     console.error("Lỗi xóa camera:", error);

//     res.status(500).json({
//       message: "Lỗi xóa camera",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// export default router;
import express from "express";
import db from "../config/db.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| GET /api/cameras/options
| Lấy danh sách phòng học để chọn khi thêm/sửa camera
|--------------------------------------------------------------------------
*/
router.get("/options", async (req, res) => {
  try {
    const [rooms] = await db.query(`
      SELECT 
        id_room,
        room_code,
        room_name,
        building,
        floor,
        status
      FROM ClassRoom
      ORDER BY room_code ASC
    `);

    res.status(200).json({
      rooms,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách phòng:", error);
    res.status(500).json({
      message: "Lỗi lấy danh sách phòng học",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET /api/cameras
| Lấy danh sách camera + thống kê + lịch sử nhận diện gần nhất
|--------------------------------------------------------------------------
*/
router.get("/", async (req, res) => {
  try {
    const { search = "", status = "", id_room = "" } = req.query;

    const conditions = [];
    const params = [];

    if (search.trim()) {
      conditions.push(`
        (
          cd.camera_name LIKE ?
          OR cd.camera_ip LIKE ?
          OR cd.location LIKE ?
          OR cr.room_code LIKE ?
          OR cr.room_name LIKE ?
        )
      `);

      const keyword = `%${search.trim()}%`;
      params.push(keyword, keyword, keyword, keyword, keyword);
    }

    if (status) {
      conditions.push("cd.status = ?");
      params.push(status);
    }

    if (id_room) {
      conditions.push("cd.id_room = ?");
      params.push(id_room);
    }

    const whereSql =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [cameras] = await db.query(
      `
      SELECT 
        cd.id_camera,
        cd.camera_name,
        cd.camera_ip,
        cd.location,
        cd.id_room,
        cd.status,

        cr.room_code,
        cr.room_name,
        cr.building,
        cr.floor,

        COUNT(rh.id_history) AS today_recognition_count,
        COALESCE(AVG(rh.confidence), 0) AS avg_confidence

      FROM CameraDevice cd
      LEFT JOIN ClassRoom cr 
        ON cd.id_room = cr.id_room

      LEFT JOIN RecognitionHistory rh
        ON cd.id_camera = rh.camera_id
        AND DATE(rh.capture_time) = CURDATE()

      ${whereSql}

      GROUP BY 
        cd.id_camera,
        cd.camera_name,
        cd.camera_ip,
        cd.location,
        cd.id_room,
        cd.status,
        cr.room_code,
        cr.room_name,
        cr.building,
        cr.floor

      ORDER BY cd.id_camera DESC
      `,
      params
    );

    const [statsRows] = await db.query(`
      SELECT
        COUNT(*) AS total_camera,
        SUM(CASE WHEN status = 'ONLINE' THEN 1 ELSE 0 END) AS online_camera,
        SUM(CASE WHEN status = 'OFFLINE' THEN 1 ELSE 0 END) AS offline_camera
      FROM CameraDevice
    `);

    const [todayRows] = await db.query(`
      SELECT
        COUNT(*) AS today_faces,
        COALESCE(AVG(confidence), 0) AS today_accuracy
      FROM RecognitionHistory
      WHERE DATE(capture_time) = CURDATE()
    `);

    const [activities] = await db.query(`
      SELECT
        rh.id_history,
        rh.id_student,
        rh.capture_time,
        rh.confidence,
        rh.camera_id,
        rh.result,
        rh.image_path,

        s.full_name,
        s.student_code,

        cd.camera_name,
        cd.location,

        cr.room_code,
        cr.room_name

      FROM RecognitionHistory rh

      LEFT JOIN Student s 
        ON rh.id_student = s.id_student

      LEFT JOIN CameraDevice cd
        ON rh.camera_id = cd.id_camera

      LEFT JOIN ClassRoom cr
        ON cd.id_room = cr.id_room

      ORDER BY rh.capture_time DESC
      LIMIT 30
    `);

    res.status(200).json({
      cameras,
      activities,
      stats: {
        total_camera: Number(statsRows[0]?.total_camera || 0),
        online_camera: Number(statsRows[0]?.online_camera || 0),
        offline_camera: Number(statsRows[0]?.offline_camera || 0),
        today_faces: Number(todayRows[0]?.today_faces || 0),
        today_accuracy: Number(todayRows[0]?.today_accuracy || 0),
      },
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách camera:", error);
    res.status(500).json({
      message: "Lỗi lấy danh sách camera",
    });
  }
});

/*
|--------------------------------------------------------------------------
| POST /api/cameras
| Thêm camera
|--------------------------------------------------------------------------
*/
router.post("/", async (req, res) => {
  try {
    const {
      camera_name,
      camera_ip,
      location,
      id_room,
      status = "ONLINE",
    } = req.body;

    if (!camera_name || !camera_ip) {
      return res.status(400).json({
        message: "Vui lòng nhập tên camera và IP camera",
      });
    }

    await db.query(
      `
      INSERT INTO CameraDevice
      (
        camera_name,
        camera_ip,
        location,
        id_room,
        status
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        camera_name,
        camera_ip,
        location || null,
        id_room || null,
        status,
      ]
    );

    res.status(201).json({
      message: "Thêm camera thành công",
    });
  } catch (error) {
    console.error("Lỗi thêm camera:", error);
    res.status(500).json({
      message: "Lỗi thêm camera",
    });
  }
});

/*
|--------------------------------------------------------------------------
| PUT /api/cameras/:id
| Cập nhật camera
|--------------------------------------------------------------------------
*/
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      camera_name,
      camera_ip,
      location,
      id_room,
      status = "ONLINE",
    } = req.body;

    if (!camera_name || !camera_ip) {
      return res.status(400).json({
        message: "Vui lòng nhập tên camera và IP camera",
      });
    }

    const [result] = await db.query(
      `
      UPDATE CameraDevice
      SET
        camera_name = ?,
        camera_ip = ?,
        location = ?,
        id_room = ?,
        status = ?
      WHERE id_camera = ?
      `,
      [
        camera_name,
        camera_ip,
        location || null,
        id_room || null,
        status,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Không tìm thấy camera",
      });
    }

    res.status(200).json({
      message: "Cập nhật camera thành công",
    });
  } catch (error) {
    console.error("Lỗi cập nhật camera:", error);
    res.status(500).json({
      message: "Lỗi cập nhật camera",
    });
  }
});

/*
|--------------------------------------------------------------------------
| PATCH /api/cameras/:id/status
| Bật / tắt camera
|--------------------------------------------------------------------------
*/
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["ONLINE", "OFFLINE"].includes(status)) {
      return res.status(400).json({
        message: "Trạng thái camera không hợp lệ",
      });
    }

    const [result] = await db.query(
      `
      UPDATE CameraDevice
      SET status = ?
      WHERE id_camera = ?
      `,
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Không tìm thấy camera",
      });
    }

    res.status(200).json({
      message:
        status === "ONLINE"
          ? "Đã bật camera"
          : "Đã tắt camera",
    });
  } catch (error) {
    console.error("Lỗi đổi trạng thái camera:", error);
    res.status(500).json({
      message: "Lỗi đổi trạng thái camera",
    });
  }
});

/*
|--------------------------------------------------------------------------
| DELETE /api/cameras/:id
| Xóa camera
|--------------------------------------------------------------------------
*/
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [historyRows] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM RecognitionHistory
      WHERE camera_id = ?
      `,
      [id]
    );

    if (Number(historyRows[0]?.total || 0) > 0) {
      return res.status(400).json({
        message:
          "Không thể xóa camera vì đã có lịch sử nhận diện. Bạn nên chuyển camera sang OFFLINE.",
      });
    }

    const [result] = await db.query(
      `
      DELETE FROM CameraDevice
      WHERE id_camera = ?
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Không tìm thấy camera",
      });
    }

    res.status(200).json({
      message: "Xóa camera thành công",
    });
  } catch (error) {
    console.error("Lỗi xóa camera:", error);
    res.status(500).json({
      message: "Lỗi xóa camera",
    });
  }
});

export default router;