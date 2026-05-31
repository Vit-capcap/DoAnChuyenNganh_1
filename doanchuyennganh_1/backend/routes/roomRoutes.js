import express from "express";
import db from "../config/db.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| API: Lấy danh sách phòng học
|--------------------------------------------------------------------------
| GET /api/rooms
|--------------------------------------------------------------------------
*/
router.get("/", async (req, res) => {
  try {
    const search = req.query.search || "";
    const building = req.query.building || "";
    const room_status = req.query.room_status || "";
    const camera_status = req.query.camera_status || "";

    let sql = `
      SELECT
        r.id_room,
        r.room_code,
        r.room_name,
        r.building,
        r.floor,
        r.capacity,
        r.camera_ip AS room_camera_ip,
        r.status AS room_status,

        c.id_camera,
        c.camera_name,
        c.camera_ip,
        c.location AS camera_location,
        c.status AS camera_status

      FROM ClassRoom r
      LEFT JOIN CameraDevice c
        ON c.id_room = r.id_room

      WHERE
        (
          r.room_code LIKE ?
          OR r.room_name LIKE ?
          OR r.building LIKE ?
          OR r.floor LIKE ?
          OR r.camera_ip LIKE ?
          OR c.camera_name LIKE ?
          OR c.camera_ip LIKE ?
          OR c.location LIKE ?
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
      `%${search}%`,
    ];

    if (building) {
      sql += ` AND r.building = ?`;
      params.push(building);
    }

    if (room_status) {
      sql += ` AND r.status = ?`;
      params.push(room_status);
    }

    if (camera_status) {
      sql += ` AND c.status = ?`;
      params.push(camera_status);
    }

    sql += ` ORDER BY r.id_room DESC`;

    const [rooms] = await db.query(sql, params);

    res.status(200).json(rooms);
  } catch (error) {
    console.error("Lỗi lấy danh sách phòng học:", error);

    res.status(500).json({
      message: "Lỗi lấy danh sách phòng học",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| API: Thêm phòng học
|--------------------------------------------------------------------------
| POST /api/rooms
|--------------------------------------------------------------------------
*/
router.post("/", async (req, res) => {
  const {
    room_code,
    room_name,
    building,
    floor,
    capacity,
    camera_ip,
    room_status,
    camera_name,
    camera_location,
    camera_status,
  } = req.body;

  if (!room_code || !room_name || !building || !capacity) {
    return res.status(400).json({
      message: "Vui lòng nhập mã phòng, tên phòng, tòa nhà và sức chứa",
    });
  }

  const validRoomStatus = ["ACTIVE", "MAINTENANCE"];
  const validCameraStatus = ["ONLINE", "OFFLINE"];

  if (room_status && !validRoomStatus.includes(room_status)) {
    return res.status(400).json({
      message: "Trạng thái phòng không hợp lệ",
    });
  }

  if (camera_status && !validCameraStatus.includes(camera_status)) {
    return res.status(400).json({
      message: "Trạng thái camera không hợp lệ",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [existingRooms] = await connection.query(
      `
      SELECT id_room
      FROM ClassRoom
      WHERE room_code = ?
      LIMIT 1
      `,
      [room_code.trim()]
    );

    if (existingRooms.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Mã phòng học đã tồn tại",
      });
    }

    const [roomResult] = await connection.query(
      `
      INSERT INTO ClassRoom (
        room_code,
        room_name,
        building,
        floor,
        capacity,
        camera_ip,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        room_code.trim(),
        room_name.trim(),
        building.trim(),
        floor || null,
        Number(capacity),
        camera_ip || null,
        room_status || "ACTIVE",
      ]
    );

    const roomId = roomResult.insertId;

    if (camera_name || camera_ip || camera_location) {
      await connection.query(
        `
        INSERT INTO CameraDevice (
          camera_name,
          camera_ip,
          location,
          id_room,
          status
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          camera_name || `Camera ${room_code}`,
          camera_ip || null,
          camera_location || `${building} - ${room_name}`,
          roomId,
          camera_status || "ONLINE",
        ]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: "Thêm phòng học thành công",
      id_room: roomId,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi thêm phòng học:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Mã phòng học đã tồn tại",
        error: error.message,
        code: error.code,
      });
    }

    res.status(500).json({
      message: "Lỗi thêm phòng học",
      error: error.message,
      code: error.code,
    });
  } finally {
    connection.release();
  }
});

/*
|--------------------------------------------------------------------------
| API: Lấy chi tiết 1 phòng học
|--------------------------------------------------------------------------
| GET /api/rooms/:id
|--------------------------------------------------------------------------
*/
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rooms] = await db.query(
      `
      SELECT
        r.id_room,
        r.room_code,
        r.room_name,
        r.building,
        r.floor,
        r.capacity,
        r.camera_ip AS room_camera_ip,
        r.status AS room_status,

        c.id_camera,
        c.camera_name,
        c.camera_ip,
        c.location AS camera_location,
        c.status AS camera_status

      FROM ClassRoom r
      LEFT JOIN CameraDevice c
        ON c.id_room = r.id_room

      WHERE r.id_room = ?
      `,
      [id]
    );

    if (rooms.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy phòng học",
      });
    }

    res.status(200).json(rooms[0]);
  } catch (error) {
    console.error("Lỗi lấy chi tiết phòng học:", error);

    res.status(500).json({
      message: "Lỗi lấy chi tiết phòng học",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| API: Cập nhật phòng học
|--------------------------------------------------------------------------
| PUT /api/rooms/:id
|--------------------------------------------------------------------------
*/
router.put("/:id", async (req, res) => {
  const { id } = req.params;

  const {
    room_code,
    room_name,
    building,
    floor,
    capacity,
    camera_ip,
    room_status,
    camera_name,
    camera_location,
    camera_status,
  } = req.body;

  if (!room_code || !room_name || !building || !capacity) {
    return res.status(400).json({
      message: "Vui lòng nhập mã phòng, tên phòng, tòa nhà và sức chứa",
    });
  }

  const validRoomStatus = ["ACTIVE", "MAINTENANCE"];
  const validCameraStatus = ["ONLINE", "OFFLINE"];

  if (room_status && !validRoomStatus.includes(room_status)) {
    return res.status(400).json({
      message: "Trạng thái phòng không hợp lệ",
    });
  }

  if (camera_status && !validCameraStatus.includes(camera_status)) {
    return res.status(400).json({
      message: "Trạng thái camera không hợp lệ",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rooms] = await connection.query(
      `
      SELECT id_room
      FROM ClassRoom
      WHERE id_room = ?
      LIMIT 1
      `,
      [id]
    );

    if (rooms.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Không tìm thấy phòng học",
      });
    }

    const [duplicates] = await connection.query(
      `
      SELECT id_room
      FROM ClassRoom
      WHERE room_code = ?
      AND id_room <> ?
      LIMIT 1
      `,
      [room_code.trim(), id]
    );

    if (duplicates.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Mã phòng học đã tồn tại",
      });
    }

    await connection.query(
      `
      UPDATE ClassRoom
      SET
        room_code = ?,
        room_name = ?,
        building = ?,
        floor = ?,
        capacity = ?,
        camera_ip = ?,
        status = ?
      WHERE id_room = ?
      `,
      [
        room_code.trim(),
        room_name.trim(),
        building.trim(),
        floor || null,
        Number(capacity),
        camera_ip || null,
        room_status || "ACTIVE",
        id,
      ]
    );

    const [cameras] = await connection.query(
      `
      SELECT id_camera
      FROM CameraDevice
      WHERE id_room = ?
      LIMIT 1
      `,
      [id]
    );

    if (cameras.length > 0) {
      await connection.query(
        `
        UPDATE CameraDevice
        SET
          camera_name = ?,
          camera_ip = ?,
          location = ?,
          status = ?
        WHERE id_room = ?
        `,
        [
          camera_name || `Camera ${room_code}`,
          camera_ip || null,
          camera_location || `${building} - ${room_name}`,
          camera_status || "ONLINE",
          id,
        ]
      );
    } else if (camera_name || camera_ip || camera_location) {
      await connection.query(
        `
        INSERT INTO CameraDevice (
          camera_name,
          camera_ip,
          location,
          id_room,
          status
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          camera_name || `Camera ${room_code}`,
          camera_ip || null,
          camera_location || `${building} - ${room_name}`,
          id,
          camera_status || "ONLINE",
        ]
      );
    }

    await connection.commit();

    res.status(200).json({
      message: "Cập nhật phòng học thành công",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi cập nhật phòng học:", error);

    res.status(500).json({
      message: "Lỗi cập nhật phòng học",
      error: error.message,
      code: error.code,
    });
  } finally {
    connection.release();
  }
});

/*
|--------------------------------------------------------------------------
| API: Xóa phòng học
|--------------------------------------------------------------------------
| DELETE /api/rooms/:id
|--------------------------------------------------------------------------
*/
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rooms] = await connection.query(
      `
      SELECT id_room
      FROM ClassRoom
      WHERE id_room = ?
      LIMIT 1
      `,
      [id]
    );

    if (rooms.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Không tìm thấy phòng học",
      });
    }

    await connection.query(
      `
      DELETE FROM CameraDevice
      WHERE id_room = ?
      `,
      [id]
    );

    await connection.query(
      `
      DELETE FROM ClassRoom
      WHERE id_room = ?
      `,
      [id]
    );

    await connection.commit();

    res.status(200).json({
      message: "Xóa phòng học thành công",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi xóa phòng học:", error);

    res.status(500).json({
      message:
        "Không thể xóa phòng học. Có thể phòng học đang được dùng trong lịch học hoặc dữ liệu liên quan.",
      error: error.message,
      code: error.code,
    });
  } finally {
    connection.release();
  }
});

export default router;