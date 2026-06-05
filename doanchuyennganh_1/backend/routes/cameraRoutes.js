import express from "express";
import db from "../config/db.js";

const router = express.Router();

/* =========================================================
   FILE: cameraRoutes.js
   ---------------------------------------------------------
   Chức năng:
   - Quản lý thiết bị camera
   - Lấy danh sách phòng học để gắn camera
   - Kiểm tra phòng học theo mã phòng / tên phòng
   - Kiểm tra phòng hôm nay có buổi học không
   - Lấy camera theo phòng
   - Lấy danh sách camera + thống kê + lịch sử nhận diện
   - Thêm / sửa / bật tắt / xóa camera

   LƯU Ý DATABASE:
   File này dùng đúng tên bảng chữ thường theo database mới:
   - classroom
   - cameradevice
   - recognitionhistory
   - student
   - schedule
   - session
   - courseclass
   - subject
   - teacher
========================================================= */

/* =========================================================
   1. HẰNG SỐ VÀ HÀM HỖ TRỢ
========================================================= */

const VALID_CAMERA_STATUS = ["ONLINE", "OFFLINE"];

/*
|--------------------------------------------------------------------------
| Helper: normalizeValue()
|--------------------------------------------------------------------------
| Chức năng:
| - Chuyển undefined, null, chuỗi rỗng thành null.
| - Dùng trước khi insert/update database.
|--------------------------------------------------------------------------
*/
function normalizeValue(value) {
  if (value === undefined || value === null) return null;

  const text = String(value).trim();

  return text === "" ? null : text;
}

/*
|--------------------------------------------------------------------------
| Helper: validateCameraStatus()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra trạng thái camera có hợp lệ không.
| - Chỉ cho phép ONLINE hoặc OFFLINE.
|--------------------------------------------------------------------------
*/
function validateCameraStatus(status) {
  return VALID_CAMERA_STATUS.includes(status);
}

/*
|--------------------------------------------------------------------------
| Helper: sendServerError()
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
| Helper: checkRoomExists()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra phòng học có tồn tại không trước khi gắn camera.
|--------------------------------------------------------------------------
*/
async function checkRoomExists(idRoom) {
  if (!idRoom) return true;

  const [rooms] = await db.query(
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

/* =========================================================
   2. API: LẤY OPTIONS PHÒNG HỌC
   ---------------------------------------------------------
   Method: GET
   URL: /api/cameras/options

   Chức năng:
   - Lấy danh sách phòng học để chọn khi thêm/sửa camera.
========================================================= */
router.get("/options", async (req, res) => {
  try {
    const [rooms] = await db.query(
      `
      SELECT
        id_room,
        room_code,
        room_name,
        building,
        floor,
        capacity,
        camera_ip,
        status
      FROM classroom
      ORDER BY room_code ASC
      `
    );

    return res.status(200).json({
      rooms,
      statuses: VALID_CAMERA_STATUS,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách phòng:", error);
    return sendServerError(res, "Lỗi lấy danh sách phòng học", error);
  }
});

/* =========================================================
   3. API: KIỂM TRA PHÒNG CÓ TỒN TẠI KHÔNG
   ---------------------------------------------------------
   Method: GET
   URL: /api/cameras/room/check?roomName=A101

   Chức năng:
   - Tìm phòng theo room_code hoặc room_name.
   - Dùng cho giao diện AI/camera khi nhập tên phòng.
========================================================= */
router.get("/room/check", async (req, res) => {
  try {
    const { roomName = "" } = req.query;

    if (!String(roomName).trim()) {
      return res.status(400).json({
        message: "Vui lòng nhập tên phòng hoặc mã phòng",
      });
    }

    const keyword = `%${String(roomName).trim()}%`;

    const [rooms] = await db.query(
      `
      SELECT
        id_room,
        room_code,
        room_name,
        building,
        floor,
        capacity,
        camera_ip,
        status
      FROM classroom
      WHERE room_code LIKE ?
         OR room_name LIKE ?
      ORDER BY room_code ASC
      LIMIT 1
      `,
      [keyword, keyword]
    );

    if (rooms.length === 0) {
      return res.status(200).json({
        exists: false,
        room: null,
      });
    }

    return res.status(200).json({
      exists: true,
      room: rooms[0],
    });
  } catch (error) {
    console.error("Lỗi kiểm tra phòng:", error);
    return sendServerError(res, "Lỗi server khi kiểm tra phòng", error);
  }
});

/* =========================================================
   4. API: KIỂM TRA PHÒNG HÔM NAY CÓ BUỔI HỌC KHÔNG
   ---------------------------------------------------------
   Method: GET
   URL: /api/cameras/room/today-session?id_room=1

   Chức năng:
   - Kiểm tra phòng đang chọn hôm nay có buổi học nào không.
   - Trả về thông tin buổi học, môn học, giáo viên, camera.
========================================================= */
router.get("/room/today-session", async (req, res) => {
  try {
    const { id_room } = req.query;

    if (!id_room) {
      return res.status(400).json({
        message: "Thiếu id_room",
      });
    }

    const [sessions] = await db.query(
      `
      SELECT
        se.id_session,
        se.session_date,
        se.session_number,
        se.status AS session_status,

        sc.id_schedule,
        sc.day_of_week,
        sc.start_time,
        sc.end_time,
        sc.start_date,
        sc.end_date,

        cc.id_course_class,
        cc.class_code,
        cc.semester,
        cc.school_year,
        cc.group_number,
        cc.status AS course_status,

        su.id_subject,
        su.subject_code,
        su.subject_name,
        su.credits,

        t.id_teacher,
        t.teacher_code,
        t.full_name AS teacher_name,

        cr.id_room,
        cr.room_code,
        cr.room_name,
        cr.building,
        cr.floor,
        cr.camera_ip AS room_camera_ip,

        cd.id_camera,
        cd.camera_name,
        cd.camera_ip,
        cd.location AS camera_location,
        cd.status AS camera_status

      FROM session se

      INNER JOIN schedule sc
        ON se.id_schedule = sc.id_schedule

      INNER JOIN courseclass cc
        ON sc.id_course_class = cc.id_course_class

      INNER JOIN subject su
        ON cc.id_subject = su.id_subject

      INNER JOIN teacher t
        ON cc.id_teacher = t.id_teacher

      INNER JOIN classroom cr
        ON sc.id_room = cr.id_room

      LEFT JOIN cameradevice cd
        ON cr.id_room = cd.id_room

      WHERE sc.id_room = ?
        AND DATE(se.session_date) = CURDATE()

      ORDER BY sc.start_time ASC
      LIMIT 1
      `,
      [id_room]
    );

    if (sessions.length === 0) {
      return res.status(200).json({
        hasSession: false,
        session: null,
      });
    }

    return res.status(200).json({
      hasSession: true,
      session: sessions[0],
    });
  } catch (error) {
    console.error("Lỗi kiểm tra lịch học hôm nay:", error);
    return sendServerError(
      res,
      "Lỗi server khi kiểm tra lịch học hôm nay",
      error
    );
  }
});

/* =========================================================
   5. API: LẤY CAMERA ĐANG GẮN VỚI PHÒNG
   ---------------------------------------------------------
   Method: GET
   URL: /api/cameras/room/device?id_room=1

   Chức năng:
   - Lấy camera mới nhất đang gắn với phòng học.
   - Dùng cho màn hình điểm danh AI theo phòng.
========================================================= */
router.get("/room/device", async (req, res) => {
  try {
    const { id_room } = req.query;

    if (!id_room) {
      return res.status(400).json({
        message: "Thiếu id_room",
      });
    }

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
        cr.floor

      FROM cameradevice cd

      LEFT JOIN classroom cr
        ON cd.id_room = cr.id_room

      WHERE cd.id_room = ?

      ORDER BY cd.id_camera DESC
      LIMIT 1
      `,
      [id_room]
    );

    if (cameras.length === 0) {
      return res.status(200).json({
        hasCamera: false,
        camera: null,
      });
    }

    return res.status(200).json({
      hasCamera: true,
      camera: cameras[0],
    });
  } catch (error) {
    console.error("Lỗi lấy camera của phòng:", error);
    return sendServerError(res, "Lỗi server khi lấy camera của phòng", error);
  }
});

/* =========================================================
   6. API: LẤY DANH SÁCH CAMERA + THỐNG KÊ
   ---------------------------------------------------------
   Method: GET
   URL: /api/cameras

   Query:
   - search: tìm theo tên camera, IP, vị trí, mã phòng, tên phòng
   - status: ONLINE / OFFLINE
   - id_room: lọc theo phòng

   Chức năng:
   - Hiển thị danh sách camera trong trang AdminCameraMonitorPage.
   - Trả thêm thống kê camera và lịch sử nhận diện gần nhất.
========================================================= */
router.get("/", async (req, res) => {
  try {
    const { search = "", status = "", id_room = "" } = req.query;

    const conditions = [];
    const params = [];

    if (String(search).trim()) {
      conditions.push(`
        (
          cd.camera_name LIKE ?
          OR cd.camera_ip LIKE ?
          OR cd.location LIKE ?
          OR cr.room_code LIKE ?
          OR cr.room_name LIKE ?
        )
      `);

      const keyword = `%${String(search).trim()}%`;
      params.push(keyword, keyword, keyword, keyword, keyword);
    }

    if (status) {
      if (!validateCameraStatus(status)) {
        return res.status(400).json({
          message: "Trạng thái camera không hợp lệ",
        });
      }

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

      FROM cameradevice cd

      LEFT JOIN classroom cr
        ON cd.id_room = cr.id_room

      LEFT JOIN recognitionhistory rh
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

    const [statsRows] = await db.query(
      `
      SELECT
        COUNT(*) AS total_camera,
        SUM(CASE WHEN status = 'ONLINE' THEN 1 ELSE 0 END) AS online_camera,
        SUM(CASE WHEN status = 'OFFLINE' THEN 1 ELSE 0 END) AS offline_camera
      FROM cameradevice
      `
    );

    const [todayRows] = await db.query(
      `
      SELECT
        COUNT(*) AS today_faces,
        COALESCE(AVG(confidence), 0) AS today_accuracy
      FROM recognitionhistory
      WHERE DATE(capture_time) = CURDATE()
      `
    );

    const [activities] = await db.query(
      `
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

      FROM recognitionhistory rh

      LEFT JOIN student s
        ON rh.id_student = s.id_student

      LEFT JOIN cameradevice cd
        ON rh.camera_id = cd.id_camera

      LEFT JOIN classroom cr
        ON cd.id_room = cr.id_room

      ORDER BY rh.capture_time DESC
      LIMIT 30
      `
    );

    return res.status(200).json({
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
    return sendServerError(res, "Lỗi lấy danh sách camera", error);
  }
});

/* =========================================================
   7. API: THÊM CAMERA
   ---------------------------------------------------------
   Method: POST
   URL: /api/cameras

   Body:
   - camera_name
   - camera_ip
   - location
   - id_room
   - status

   Chức năng:
   - Thêm thiết bị camera mới.
   - Nếu có id_room thì kiểm tra phòng tồn tại trước khi thêm.
========================================================= */
router.post("/", async (req, res) => {
  try {
    const {
      camera_name,
      camera_ip,
      location,
      id_room,
      status = "ONLINE",
    } = req.body;

    const cameraName = normalizeValue(camera_name);
    const cameraIp = normalizeValue(camera_ip);
    const cameraLocation = normalizeValue(location);
    const roomId = normalizeValue(id_room);
    const cameraStatus = status || "ONLINE";

    if (!cameraName || !cameraIp) {
      return res.status(400).json({
        message: "Vui lòng nhập tên camera và IP camera",
      });
    }

    if (!validateCameraStatus(cameraStatus)) {
      return res.status(400).json({
        message: "Trạng thái camera không hợp lệ",
      });
    }

    const roomExists = await checkRoomExists(roomId);

    if (!roomExists) {
      return res.status(404).json({
        message: "Phòng học không tồn tại",
      });
    }

    const [duplicates] = await db.query(
      `
      SELECT id_camera
      FROM cameradevice
      WHERE camera_ip = ?
      LIMIT 1
      `,
      [cameraIp]
    );

    if (duplicates.length > 0) {
      return res.status(409).json({
        message: "IP camera đã tồn tại",
      });
    }

    const [result] = await db.query(
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
      [cameraName, cameraIp, cameraLocation, roomId, cameraStatus]
    );

    return res.status(201).json({
      message: "Thêm camera thành công",
      id_camera: result.insertId,
    });
  } catch (error) {
    console.error("Lỗi thêm camera:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "IP camera đã tồn tại",
        error: error.message,
        code: error.code,
      });
    }

    return sendServerError(res, "Lỗi thêm camera", error);
  }
});

/* =========================================================
   8. API: CẬP NHẬT CAMERA
   ---------------------------------------------------------
   Method: PUT
   URL: /api/cameras/:id

   Chức năng:
   - Cập nhật tên camera, IP, vị trí, phòng gắn camera, trạng thái.
   - Không cho trùng IP camera với camera khác.
========================================================= */
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

    const cameraName = normalizeValue(camera_name);
    const cameraIp = normalizeValue(camera_ip);
    const cameraLocation = normalizeValue(location);
    const roomId = normalizeValue(id_room);
    const cameraStatus = status || "ONLINE";

    if (!id) {
      return res.status(400).json({
        message: "Thiếu mã camera",
      });
    }

    if (!cameraName || !cameraIp) {
      return res.status(400).json({
        message: "Vui lòng nhập tên camera và IP camera",
      });
    }

    if (!validateCameraStatus(cameraStatus)) {
      return res.status(400).json({
        message: "Trạng thái camera không hợp lệ",
      });
    }

    const roomExists = await checkRoomExists(roomId);

    if (!roomExists) {
      return res.status(404).json({
        message: "Phòng học không tồn tại",
      });
    }

    const [duplicates] = await db.query(
      `
      SELECT id_camera
      FROM cameradevice
      WHERE camera_ip = ?
        AND id_camera <> ?
      LIMIT 1
      `,
      [cameraIp, id]
    );

    if (duplicates.length > 0) {
      return res.status(409).json({
        message: "IP camera đã tồn tại ở camera khác",
      });
    }

    const [result] = await db.query(
      `
      UPDATE cameradevice
      SET
        camera_name = ?,
        camera_ip = ?,
        location = ?,
        id_room = ?,
        status = ?
      WHERE id_camera = ?
      `,
      [cameraName, cameraIp, cameraLocation, roomId, cameraStatus, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Không tìm thấy camera",
      });
    }

    return res.status(200).json({
      message: "Cập nhật camera thành công",
    });
  } catch (error) {
    console.error("Lỗi cập nhật camera:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "IP camera đã tồn tại",
        error: error.message,
        code: error.code,
      });
    }

    return sendServerError(res, "Lỗi cập nhật camera", error);
  }
});

/* =========================================================
   9. API: BẬT / TẮT CAMERA
   ---------------------------------------------------------
   Method: PATCH
   URL: /api/cameras/:id/status

   Body:
   - status: ONLINE hoặc OFFLINE

   Chức năng:
   - Đổi nhanh trạng thái camera.
========================================================= */
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({
        message: "Thiếu mã camera",
      });
    }

    if (!validateCameraStatus(status)) {
      return res.status(400).json({
        message: "Trạng thái camera không hợp lệ",
      });
    }

    const [result] = await db.query(
      `
      UPDATE cameradevice
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

    return res.status(200).json({
      message: status === "ONLINE" ? "Đã bật camera" : "Đã tắt camera",
    });
  } catch (error) {
    console.error("Lỗi đổi trạng thái camera:", error);
    return sendServerError(res, "Lỗi đổi trạng thái camera", error);
  }
});

/* =========================================================
   10. API: XÓA CAMERA
   ---------------------------------------------------------
   Method: DELETE
   URL: /api/cameras/:id

   Chức năng:
   - Chỉ cho xóa camera nếu chưa có lịch sử nhận diện.
   - Nếu đã có recognitionhistory thì nên chuyển sang OFFLINE.
========================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Thiếu mã camera",
      });
    }

    const [historyRows] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM recognitionhistory
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
      DELETE FROM cameradevice
      WHERE id_camera = ?
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Không tìm thấy camera",
      });
    }

    return res.status(200).json({
      message: "Xóa camera thành công",
    });
  } catch (error) {
    console.error("Lỗi xóa camera:", error);
    return sendServerError(res, "Lỗi xóa camera", error);
  }
});

export default router;