import express from "express";
import db from "../config/db.js";

const router = express.Router();

/* =========================================================
   FILE: roomRoutes.js
   ---------------------------------------------------------
   Chức năng:
   - Lấy danh sách phòng học
   - Lấy options cho form phòng học
   - Lấy chi tiết phòng học
   - Thêm phòng học kèm camera nếu có
   - Cập nhật phòng học kèm camera
   - Xóa phòng học an toàn

   DATABASE DÙNG:
   - classroom
   - cameradevice
   - schedule
   - recognitionhistory

   THỨ TỰ ROUTE:
   1. GET    /api/rooms/options
   2. GET    /api/rooms
   3. POST   /api/rooms
   4. GET    /api/rooms/:id
   5. PUT    /api/rooms/:id
   6. PATCH  /api/rooms/:id/status
   7. DELETE /api/rooms/:id
========================================================= */


/* =========================================================
   1. HẰNG SỐ VÀ HELPER
========================================================= */

const VALID_ROOM_STATUS = ["ACTIVE", "MAINTENANCE"];
const VALID_CAMERA_STATUS = ["ONLINE", "OFFLINE"];

/*
|--------------------------------------------------------------------------
| normalizeValue()
|--------------------------------------------------------------------------
| Chức năng:
| - Chuyển undefined/null/chuỗi rỗng thành null.
| - Dùng trước khi lưu vào MySQL.
|--------------------------------------------------------------------------
*/
function normalizeValue(value) {
  if (value === undefined || value === null) return null;

  const text = String(value).trim();

  return text === "" ? null : text;
}

/*
|--------------------------------------------------------------------------
| normalizeStatus()
|--------------------------------------------------------------------------
| Chức năng:
| - Chuyển status thành chữ hoa.
|--------------------------------------------------------------------------
*/
function normalizeStatus(value, defaultValue) {
  const status = normalizeValue(value);

  return status ? status.toUpperCase() : defaultValue;
}

/*
|--------------------------------------------------------------------------
| toPositiveInteger()
|--------------------------------------------------------------------------
| Chức năng:
| - Chuyển sức chứa thành số nguyên dương.
|--------------------------------------------------------------------------
*/
function toPositiveInteger(value) {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    return null;
  }

  return number;
}

/*
|--------------------------------------------------------------------------
| sendServerError()
|--------------------------------------------------------------------------
| Chức năng:
| - Chuẩn hóa lỗi trả về frontend.
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
| validateRoomPayload()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra dữ liệu thêm/sửa phòng học.
| - Chuẩn hóa dữ liệu trước khi insert/update.
|--------------------------------------------------------------------------
*/
function validateRoomPayload(body) {
  const room_code = normalizeValue(body.room_code);
  const room_name = normalizeValue(body.room_name);
  const building = normalizeValue(body.building);
  const floor = normalizeValue(body.floor);
  const capacity = toPositiveInteger(body.capacity);

  const camera_ip = normalizeValue(body.camera_ip);
  const camera_name = normalizeValue(body.camera_name);
  const camera_location = normalizeValue(body.camera_location);

  const room_status = normalizeStatus(body.room_status, "ACTIVE");
  const camera_status = normalizeStatus(body.camera_status, "ONLINE");

  if (!room_code || !room_name || !building || !capacity) {
    return {
      valid: false,
      message: "Vui lòng nhập mã phòng, tên phòng, tòa nhà và sức chứa",
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
      capacity,
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
| checkRoomExists()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra phòng có tồn tại không.
|--------------------------------------------------------------------------
*/
async function checkRoomExists(connectionOrDb, idRoom) {
  const [rooms] = await connectionOrDb.query(
    `
    SELECT id_room
    FROM classroom
    WHERE id_room = ?
    LIMIT 1
    `,
    [idRoom]
  );

  return rooms.length > 0;
}

/*
|--------------------------------------------------------------------------
| checkRoomCodeDuplicate()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra mã phòng đã tồn tại chưa.
| - Khi update thì bỏ qua chính phòng hiện tại.
|--------------------------------------------------------------------------
*/
async function checkRoomCodeDuplicate(connectionOrDb, roomCode, ignoreRoomId = null) {
  const params = [roomCode];

  let sql = `
    SELECT id_room
    FROM classroom
    WHERE room_code = ?
  `;

  if (ignoreRoomId) {
    sql += `
      AND id_room <> ?
    `;
    params.push(ignoreRoomId);
  }

  sql += `
    LIMIT 1
  `;

  const [rows] = await connectionOrDb.query(sql, params);

  return rows.length > 0;
}

/*
|--------------------------------------------------------------------------
| checkCameraIpDuplicate()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra IP camera có bị trùng không.
| - Khi update thì bỏ qua camera đang thuộc phòng hiện tại.
|--------------------------------------------------------------------------
*/
async function checkCameraIpDuplicate(connectionOrDb, cameraIp, ignoreRoomId = null) {
  if (!cameraIp) return false;

  const params = [cameraIp];

  let sql = `
    SELECT id_camera
    FROM cameradevice
    WHERE camera_ip = ?
  `;

  if (ignoreRoomId) {
    sql += `
      AND id_room <> ?
    `;
    params.push(ignoreRoomId);
  }

  sql += `
    LIMIT 1
  `;

  const [rows] = await connectionOrDb.query(sql, params);

  return rows.length > 0;
}


/* =========================================================
   2. API: OPTIONS PHÒNG HỌC
   ---------------------------------------------------------
   Method: GET
   URL: /api/rooms/options

   Chức năng:
   - Lấy danh sách tòa nhà.
   - Trả trạng thái phòng và camera cho form frontend.
========================================================= */
router.get("/options", async (req, res) => {
  try {
    const [buildings] = await db.query(
      `
      SELECT DISTINCT building
      FROM classroom
      WHERE building IS NOT NULL
        AND building <> ''
      ORDER BY building ASC
      `
    );

    return res.status(200).json({
      buildings,
      roomStatuses: VALID_ROOM_STATUS,
      cameraStatuses: VALID_CAMERA_STATUS,
    });
  } catch (error) {
    console.error("Lỗi lấy options phòng học:", error);
    return sendServerError(res, "Lỗi lấy options phòng học", error);
  }
});


/* =========================================================
   3. API: LẤY DANH SÁCH PHÒNG HỌC
   ---------------------------------------------------------
   Method: GET
   URL: /api/rooms

   Query:
   - search
   - building
   - room_status
   - camera_status
========================================================= */
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

    if (String(search).trim()) {
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

      const keyword = `%${String(search).trim()}%`;
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
      const roomStatus = String(room_status).toUpperCase();

      if (!VALID_ROOM_STATUS.includes(roomStatus)) {
        return res.status(400).json({
          message: "Trạng thái phòng không hợp lệ",
        });
      }

      conditions.push("r.status = ?");
      params.push(roomStatus);
    }

    if (camera_status) {
      const cameraStatus = String(camera_status).toUpperCase();

      if (!VALID_CAMERA_STATUS.includes(cameraStatus)) {
        return res.status(400).json({
          message: "Trạng thái camera không hợp lệ",
        });
      }

      conditions.push("c.status = ?");
      params.push(cameraStatus);
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

    return res.status(200).json(rooms);
  } catch (error) {
    console.error("Lỗi lấy danh sách phòng học:", error);
    return sendServerError(res, "Lỗi lấy danh sách phòng học", error);
  }
});


/* =========================================================
   4. API: THÊM PHÒNG HỌC
   ---------------------------------------------------------
   Method: POST
   URL: /api/rooms

   Body:
   - room_code
   - room_name
   - building
   - floor
   - capacity
   - camera_ip
   - room_status
   - camera_name
   - camera_location
   - camera_status

   Logic:
   - Thêm phòng học trước.
   - Nếu có thông tin camera thì thêm camera sau.
========================================================= */
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

    const roomCodeDuplicate = await checkRoomCodeDuplicate(
      connection,
      room_code
    );

    if (roomCodeDuplicate) {
      await connection.rollback();

      return res.status(409).json({
        message: "Mã phòng học đã tồn tại",
      });
    }

    const cameraIpDuplicate = await checkCameraIpDuplicate(
      connection,
      camera_ip
    );

    if (cameraIpDuplicate) {
      await connection.rollback();

      return res.status(409).json({
        message: "IP camera đã tồn tại",
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

    return res.status(201).json({
      message: "Thêm phòng học thành công",
      id_room: roomId,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi thêm phòng học:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Mã phòng học hoặc IP camera đã tồn tại",
        error: error.message,
        code: error.code,
      });
    }

    return sendServerError(res, "Lỗi thêm phòng học", error);
  } finally {
    connection.release();
  }
});


/* =========================================================
   5. API: LẤY CHI TIẾT 1 PHÒNG HỌC
   ---------------------------------------------------------
   Method: GET
   URL: /api/rooms/:id
========================================================= */
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
      LIMIT 1
      `,
      [id]
    );

    if (rooms.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy phòng học",
      });
    }

    return res.status(200).json(rooms[0]);
  } catch (error) {
    console.error("Lỗi lấy chi tiết phòng học:", error);
    return sendServerError(res, "Lỗi lấy chi tiết phòng học", error);
  }
});


/* =========================================================
   6. API: CẬP NHẬT PHÒNG HỌC
   ---------------------------------------------------------
   Method: PUT
   URL: /api/rooms/:id

   Logic:
   - Cập nhật phòng học.
   - Nếu đã có camera thì update camera.
   - Nếu chưa có camera nhưng có dữ liệu camera thì insert camera mới.
========================================================= */
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

    const roomExists = await checkRoomExists(connection, id);

    if (!roomExists) {
      await connection.rollback();

      return res.status(404).json({
        message: "Không tìm thấy phòng học",
      });
    }

    const roomCodeDuplicate = await checkRoomCodeDuplicate(
      connection,
      room_code,
      id
    );

    if (roomCodeDuplicate) {
      await connection.rollback();

      return res.status(409).json({
        message: "Mã phòng học đã tồn tại",
      });
    }

    const cameraIpDuplicate = await checkCameraIpDuplicate(
      connection,
      camera_ip,
      id
    );

    if (cameraIpDuplicate) {
      await connection.rollback();

      return res.status(409).json({
        message: "IP camera đã tồn tại ở phòng khác",
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
      ORDER BY id_camera DESC
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
        WHERE id_camera = ?
        `,
        [
          camera_name || `Camera ${room_code}`,
          camera_ip,
          camera_location || `${building} - ${room_name}`,
          camera_status,
          cameras[0].id_camera,
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

    return res.status(200).json({
      message: "Cập nhật phòng học thành công",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi cập nhật phòng học:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Mã phòng học hoặc IP camera đã tồn tại",
        error: error.message,
        code: error.code,
      });
    }

    return sendServerError(res, "Lỗi cập nhật phòng học", error);
  } finally {
    connection.release();
  }
});


/* =========================================================
   7. API: CẬP NHẬT TRẠNG THÁI PHÒNG
   ---------------------------------------------------------
   Method: PATCH
   URL: /api/rooms/:id/status

   Body:
   - room_status: ACTIVE hoặc MAINTENANCE

   Chức năng:
   - Đổi nhanh trạng thái phòng học.
========================================================= */
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const roomStatus = normalizeStatus(req.body.room_status, "");

    if (!VALID_ROOM_STATUS.includes(roomStatus)) {
      return res.status(400).json({
        message: "Trạng thái phòng không hợp lệ",
      });
    }

    const roomExists = await checkRoomExists(db, id);

    if (!roomExists) {
      return res.status(404).json({
        message: "Không tìm thấy phòng học",
      });
    }

    await db.query(
      `
      UPDATE classroom
      SET status = ?
      WHERE id_room = ?
      `,
      [roomStatus, id]
    );

    return res.status(200).json({
      message:
        roomStatus === "ACTIVE"
          ? "Đã chuyển phòng sang trạng thái hoạt động"
          : "Đã chuyển phòng sang trạng thái bảo trì",
    });
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái phòng:", error);
    return sendServerError(res, "Lỗi cập nhật trạng thái phòng", error);
  }
});


/* =========================================================
   8. API: XÓA PHÒNG HỌC
   ---------------------------------------------------------
   Method: DELETE
   URL: /api/rooms/:id

   Logic:
   - Không cho xóa phòng nếu đã dùng trong schedule.
   - Không cho xóa phòng nếu camera của phòng đã có recognitionhistory.
   - Nếu an toàn thì xóa camera trước, xóa classroom sau.
========================================================= */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const roomExists = await checkRoomExists(connection, id);

    if (!roomExists) {
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

    return res.status(200).json({
      message: "Xóa phòng học thành công",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi xóa phòng học:", error);

    return res.status(500).json({
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