import express from "express";
import db from "../config/db.js";

const router = express.Router();

const VALID_ROOM_STATUS = ["ACTIVE", "MAINTENANCE"];
const VALID_CAMERA_STATUS = ["ONLINE", "OFFLINE"];

function normalizeValue(value) {
  if (value === undefined || value === null) return null;

  const text = String(value).trim();
  return text === "" ? null : text;
}

function validateRoomPayload(body) {
  const room_code = normalizeValue(body.room_code);
  const room_name = normalizeValue(body.room_name);
  const building = normalizeValue(body.building);
  const floor = normalizeValue(body.floor);
  const camera_ip = normalizeValue(body.camera_ip);

  const room_status = body.room_status || "ACTIVE";
  const camera_status = body.camera_status || "ONLINE";

  const camera_name = normalizeValue(body.camera_name);
  const camera_location = normalizeValue(body.camera_location);

  const capacityNumber = Number(body.capacity);

  if (!room_code || !room_name || !building || !body.capacity) {
    return {
      valid: false,
      message: "Vui lòng nhập mã phòng, tên phòng, tòa nhà và sức chứa",
    };
  }

  if (!Number.isInteger(capacityNumber) || capacityNumber <= 0) {
    return {
      valid: false,
      message: "Sức chứa phòng học phải là số nguyên lớn hơn 0",
    };
  }

  if (!VALID_ROOM_STATUS.includes(room_status)) {
    return {
      valid: false,
      message: "Trạng thái phòng không hợp lệ",
    };
  }

  if (!VALID_CAMERA_STATUS.includes(camera_status)) {
    return {
      valid: false,
      message: "Trạng thái camera không hợp lệ",
    };
  }

  return {
    valid: true,
    data: {
      room_code,
      room_name,
      building,
      floor,
      capacity: capacityNumber,
      camera_ip,
      room_status,
      camera_name,
      camera_location,
      camera_status,
    },
  };
}

/*
|--------------------------------------------------------------------------
| GET /api/rooms
| Lấy danh sách phòng học
|--------------------------------------------------------------------------
*/
router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      building = "",
      room_status = "",
      camera_status = "",
    } = req.query;

    const conditions = [];
    const params = [];

    if (search.trim()) {
      conditions.push(`
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
      `);

      const keyword = `%${search.trim()}%`;
      params.push(
        keyword,
        keyword,
        keyword,
        keyword,
        keyword,
        keyword,
        keyword,
        keyword
      );
    }

    if (building) {
      conditions.push("r.building = ?");
      params.push(building);
    }

    if (room_status) {
      conditions.push("r.status = ?");
      params.push(room_status);
    }

    if (camera_status) {
      conditions.push("c.status = ?");
      params.push(camera_status);
    }

    const whereSql =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

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

      FROM classroom r

      LEFT JOIN cameradevice c
        ON c.id_room = r.id_room

      ${whereSql}

      ORDER BY r.id_room DESC
      `,
      params
    );

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
| POST /api/rooms
| Thêm phòng học
|--------------------------------------------------------------------------
*/
router.post("/", async (req, res) => {
  const validation = validateRoomPayload(req.body);

  if (!validation.valid) {
    return res.status(400).json({
      message: validation.message,
    });
  }

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
  } = validation.data;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [existingRooms] = await connection.query(
      `
      SELECT id_room
      FROM classroom
      WHERE room_code = ?
      LIMIT 1
      `,
      [room_code]
    );

    if (existingRooms.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Mã phòng học đã tồn tại",
      });
    }

    const [roomResult] = await connection.query(
      `
      INSERT INTO classroom (
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
        room_code,
        room_name,
        building,
        floor,
        capacity,
        camera_ip,
        room_status,
      ]
    );

    const roomId = roomResult.insertId;

    if (camera_name || camera_ip || camera_location) {
      await connection.query(
        `
        INSERT INTO cameradevice (
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
          camera_ip,
          camera_location || `${building} - ${room_name}`,
          roomId,
          camera_status,
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
| GET /api/rooms/:id
| Lấy chi tiết 1 phòng học
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

      FROM classroom r

      LEFT JOIN cameradevice c
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
| PUT /api/rooms/:id
| Cập nhật phòng học
|--------------------------------------------------------------------------
*/
router.put("/:id", async (req, res) => {
  const { id } = req.params;

  const validation = validateRoomPayload(req.body);

  if (!validation.valid) {
    return res.status(400).json({
      message: validation.message,
    });
  }

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
  } = validation.data;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rooms] = await connection.query(
      `
      SELECT id_room
      FROM classroom
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
      FROM classroom
      WHERE room_code = ?
        AND id_room <> ?
      LIMIT 1
      `,
      [room_code, id]
    );

    if (duplicates.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Mã phòng học đã tồn tại",
      });
    }

    await connection.query(
      `
      UPDATE classroom
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
        room_code,
        room_name,
        building,
        floor,
        capacity,
        camera_ip,
        room_status,
        id,
      ]
    );

    const [cameras] = await connection.query(
      `
      SELECT id_camera
      FROM cameradevice
      WHERE id_room = ?
      LIMIT 1
      `,
      [id]
    );

    if (cameras.length > 0) {
      await connection.query(
        `
        UPDATE cameradevice
        SET
          camera_name = ?,
          camera_ip = ?,
          location = ?,
          status = ?
        WHERE id_room = ?
        `,
        [
          camera_name || `Camera ${room_code}`,
          camera_ip,
          camera_location || `${building} - ${room_name}`,
          camera_status,
          id,
        ]
      );
    } else if (camera_name || camera_ip || camera_location) {
      await connection.query(
        `
        INSERT INTO cameradevice (
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
          camera_ip,
          camera_location || `${building} - ${room_name}`,
          id,
          camera_status,
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
| DELETE /api/rooms/:id
| Xóa phòng học
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
      FROM classroom
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

    const [scheduleRows] = await connection.query(
      `
      SELECT COUNT(*) AS total
      FROM schedule
      WHERE id_room = ?
      `,
      [id]
    );

    if (Number(scheduleRows[0]?.total || 0) > 0) {
      await connection.rollback();

      return res.status(400).json({
        message:
          "Không thể xóa phòng học vì phòng này đang được sử dụng trong lịch học. Bạn nên chuyển trạng thái phòng sang MAINTENANCE.",
      });
    }

    const [cameraRows] = await connection.query(
      `
      SELECT id_camera
      FROM cameradevice
      WHERE id_room = ?
      `,
      [id]
    );

    for (const camera of cameraRows) {
      const [historyRows] = await connection.query(
        `
        SELECT COUNT(*) AS total
        FROM recognitionhistory
        WHERE camera_id = ?
        `,
        [camera.id_camera]
      );

      if (Number(historyRows[0]?.total || 0) > 0) {
        await connection.rollback();

        return res.status(400).json({
          message:
            "Không thể xóa phòng học vì camera của phòng đã có lịch sử nhận diện. Bạn nên chuyển phòng sang MAINTENANCE hoặc camera sang OFFLINE.",
        });
      }
    }

    await connection.query(
      `
      DELETE FROM cameradevice
      WHERE id_room = ?
      `,
      [id]
    );

    await connection.query(
      `
      DELETE FROM classroom
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