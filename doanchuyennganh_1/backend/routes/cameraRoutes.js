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
      FROM classroom
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
| GET /api/cameras/room/check?roomName=A101
| Kiểm tra phòng có tồn tại không
|--------------------------------------------------------------------------
*/
router.get("/room/check", async (req, res) => {
  try {
    const { roomName = "" } = req.query;

    if (!roomName.trim()) {
      return res.status(400).json({
        message: "Vui lòng nhập tên phòng hoặc mã phòng",
      });
    }

    const keyword = `%${roomName.trim()}%`;

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

    return res.status(500).json({
      message: "Lỗi server khi kiểm tra phòng",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET /api/cameras/room/today-session?id_room=1
| Kiểm tra hôm nay phòng đó có lịch học không
|--------------------------------------------------------------------------
*/
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

        r.id_room,
        r.room_code,
        r.room_name,
        r.building,
        r.floor,
        r.camera_ip AS room_camera_ip,

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

      INNER JOIN classroom r
        ON sc.id_room = r.id_room

      LEFT JOIN cameradevice cd
        ON r.id_room = cd.id_room

      WHERE sc.id_room = ?
        AND se.session_date = CURDATE()

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

    return res.status(500).json({
      message: "Lỗi server khi kiểm tra lịch học hôm nay",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET /api/cameras/room/device?id_room=1
| Lấy thiết bị camera đang gắn với phòng
|--------------------------------------------------------------------------
*/
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

    return res.status(500).json({
      message: "Lỗi server khi lấy camera của phòng",
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

    const [statsRows] = await db.query(`
      SELECT
        COUNT(*) AS total_camera,
        SUM(CASE WHEN status = 'ONLINE' THEN 1 ELSE 0 END) AS online_camera,
        SUM(CASE WHEN status = 'OFFLINE' THEN 1 ELSE 0 END) AS offline_camera
      FROM cameradevice
    `);

    const [todayRows] = await db.query(`
      SELECT
        COUNT(*) AS today_faces,
        COALESCE(AVG(confidence), 0) AS today_accuracy
      FROM recognitionhistory
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

      FROM recognitionhistory rh

      LEFT JOIN student s 
        ON rh.id_student = s.id_student

      LEFT JOIN cameradevice cd
        ON rh.camera_id = cd.id_camera

      LEFT JOIN classroom cr
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

    if (!camera_name?.trim() || !camera_ip?.trim()) {
      return res.status(400).json({
        message: "Vui lòng nhập tên camera và IP camera",
      });
    }

    if (!["ONLINE", "OFFLINE"].includes(status)) {
      return res.status(400).json({
        message: "Trạng thái camera không hợp lệ",
      });
    }

    if (id_room) {
      const [rooms] = await db.query(
        `
        SELECT id_room
        FROM classroom
        WHERE id_room = ?
        LIMIT 1
        `,
        [id_room]
      );

      if (rooms.length === 0) {
        return res.status(404).json({
          message: "Phòng học không tồn tại",
        });
      }
    }

    await db.query(
      `
      INSERT INTO cameradevice
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
        camera_name.trim(),
        camera_ip.trim(),
        location?.trim() || null,
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

    if (!camera_name?.trim() || !camera_ip?.trim()) {
      return res.status(400).json({
        message: "Vui lòng nhập tên camera và IP camera",
      });
    }

    if (!["ONLINE", "OFFLINE"].includes(status)) {
      return res.status(400).json({
        message: "Trạng thái camera không hợp lệ",
      });
    }

    if (id_room) {
      const [rooms] = await db.query(
        `
        SELECT id_room
        FROM classroom
        WHERE id_room = ?
        LIMIT 1
        `,
        [id_room]
      );

      if (rooms.length === 0) {
        return res.status(404).json({
          message: "Phòng học không tồn tại",
        });
      }
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
      [
        camera_name.trim(),
        camera_ip.trim(),
        location?.trim() || null,
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

    res.status(200).json({
      message: status === "ONLINE" ? "Đã bật camera" : "Đã tắt camera",
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