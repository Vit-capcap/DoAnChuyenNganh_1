import express from "express";
import db from "../config/db.js";

const router = express.Router();

/* =========================================================
   FILE: settingRoutes.js
   ---------------------------------------------------------
   Chức năng:
   - Lấy toàn bộ cài đặt hệ thống
   - Lưu cài đặt hệ thống
   - Đặt lại cấu hình mặc định
   - Backup database giả lập
   - Lấy lịch sử thao tác cài đặt

   DATABASE MỚI DÙNG:
   - systemsetting
   - systemlog

   THỨ TỰ ROUTE:
   1. GET  /api/settings/logs
   2. POST /api/settings/reset
   3. POST /api/settings/backup
   4. GET  /api/settings
   5. PUT  /api/settings
========================================================= */


/* =========================================================
   1. CÀI ĐẶT MẶC ĐỊNH
   ---------------------------------------------------------
   Lưu ý:
   - Nếu database thiếu setting nào thì hệ thống sẽ lấy giá trị
     trong DEFAULT_SETTINGS để frontend vẫn hiển thị đủ dữ liệu.
========================================================= */
const DEFAULT_SETTINGS = {
  school_name: "Trường THPT Chuyên Nguyễn Huệ",
  school_address: "560B Quang Trung, Hà Đông, Hà Nội",
  school_logo: "",

  ai_confidence_threshold: "85",
  ai_face_sensitivity: "MEDIUM",
  ai_unknown_face_alert: "true",

  attendance_start_time: "07:00",
  attendance_end_time: "17:30",
  attendance_late_threshold: "15",
  attendance_auto_absent: "true",

  notification_daily_email: "true",
  notification_late_absent_alert: "true",
  notification_weekly_report: "false",

  security_admin_2fa: "true",
  backup_last_time: "",
};


/* =========================================================
   2. HELPER DÙNG CHUNG
========================================================= */

/*
|--------------------------------------------------------------------------
| normalizeText()
|--------------------------------------------------------------------------
| Chức năng:
| - Chuẩn hóa dữ liệu text.
| - Tránh lỗi undefined/null.
| - Xóa khoảng trắng đầu/cuối.
|
| Lưu ý:
| - Hàm này đang được dùng trong settingType(),
|   nên sẽ không còn lỗi ESLint no-unused-vars.
|--------------------------------------------------------------------------
*/
function normalizeText(value) {
  return String(value ?? "").trim();
}

/*
|--------------------------------------------------------------------------
| toBoolean()
|--------------------------------------------------------------------------
| Chức năng:
| - Chuyển setting_value từ database sang boolean.
| - Vì systemsetting.setting_value đang lưu dạng text.
|--------------------------------------------------------------------------
*/
function toBoolean(value) {
  return value === true || value === "true" || value === "1" || value === 1;
}

/*
|--------------------------------------------------------------------------
| toNumber()
|--------------------------------------------------------------------------
| Chức năng:
| - Chuyển dữ liệu sang number an toàn.
| - Nếu dữ liệu lỗi thì trả về defaultValue.
|--------------------------------------------------------------------------
*/
function toNumber(value, defaultValue = 0) {
  const number = Number(value);

  return Number.isFinite(number) ? number : defaultValue;
}

/*
|--------------------------------------------------------------------------
| getClientIp()
|--------------------------------------------------------------------------
| Chức năng:
| - Lấy IP người dùng để lưu vào systemlog.
|--------------------------------------------------------------------------
*/
function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| settingType()
|--------------------------------------------------------------------------
| Chức năng:
| - Tự xác định setting_type dựa theo setting_key.
| - Phù hợp ENUM của bảng systemsetting:
|   TEXT, NUMBER, BOOLEAN, JSON, IMAGE.
|--------------------------------------------------------------------------
*/
function settingType(key) {
  const settingKey = normalizeText(key).toLowerCase();

  if (settingKey.includes("threshold") || settingKey.includes("confidence")) {
    return "NUMBER";
  }

  if (
    settingKey.includes("alert") ||
    settingKey.includes("auto") ||
    settingKey.includes("notification") ||
    settingKey.includes("2fa")
  ) {
    return "BOOLEAN";
  }

  if (settingKey.includes("logo")) {
    return "IMAGE";
  }

  return "TEXT";
}

/*
|--------------------------------------------------------------------------
| normalizeSettings()
|--------------------------------------------------------------------------
| Chức năng:
| - Gộp dữ liệu trong database với DEFAULT_SETTINGS.
| - Nếu database thiếu key thì dùng giá trị mặc định.
| - Chuẩn hóa kiểu dữ liệu trước khi trả về frontend.
|--------------------------------------------------------------------------
*/
function normalizeSettings(rows) {
  const settings = { ...DEFAULT_SETTINGS };

  rows.forEach((item) => {
    settings[item.setting_key] = item.setting_value ?? "";
  });

  return {
    school_name: settings.school_name,
    school_address: settings.school_address,
    school_logo: settings.school_logo,

    ai_confidence_threshold: toNumber(settings.ai_confidence_threshold, 85),
    ai_face_sensitivity: settings.ai_face_sensitivity || "MEDIUM",
    ai_unknown_face_alert: toBoolean(settings.ai_unknown_face_alert),

    attendance_start_time: settings.attendance_start_time || "07:00",
    attendance_end_time: settings.attendance_end_time || "17:30",
    attendance_late_threshold: toNumber(settings.attendance_late_threshold, 15),
    attendance_auto_absent: toBoolean(settings.attendance_auto_absent),

    notification_daily_email: toBoolean(settings.notification_daily_email),
    notification_late_absent_alert: toBoolean(
      settings.notification_late_absent_alert
    ),
    notification_weekly_report: toBoolean(settings.notification_weekly_report),

    security_admin_2fa: toBoolean(settings.security_admin_2fa),
    backup_last_time: settings.backup_last_time || "",
  };
}

/*
|--------------------------------------------------------------------------
| validateSettings()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra dữ liệu trước khi lưu cài đặt.
| - Tránh lưu dữ liệu sai logic vào database.
|--------------------------------------------------------------------------
*/
function validateSettings(settings) {
  const confidence = Number(settings.ai_confidence_threshold);
  const lateThreshold = Number(settings.attendance_late_threshold);

  if (Number.isNaN(confidence) || confidence < 50 || confidence > 100) {
    return {
      valid: false,
      message: "Độ tin cậy AI phải nằm trong khoảng 50 - 100",
    };
  }

  if (Number.isNaN(lateThreshold) || lateThreshold < 0) {
    return {
      valid: false,
      message: "Ngưỡng đi muộn phải lớn hơn hoặc bằng 0",
    };
  }

  if (
    settings.attendance_start_time &&
    settings.attendance_end_time &&
    settings.attendance_start_time >= settings.attendance_end_time
  ) {
    return {
      valid: false,
      message: "Giờ bắt đầu phải nhỏ hơn giờ kết thúc",
    };
  }

  return {
    valid: true,
    message: "",
  };
}

/*
|--------------------------------------------------------------------------
| upsertSetting()
|--------------------------------------------------------------------------
| Chức năng:
| - Nếu setting_key chưa tồn tại thì INSERT.
| - Nếu setting_key đã tồn tại thì UPDATE.
|
| Lưu ý:
| - setting_key trong database phải có UNIQUE.
|--------------------------------------------------------------------------
*/
async function upsertSetting(connectionOrDb, key, value, description) {
  await connectionOrDb.query(
    `
    INSERT INTO systemsetting (
      setting_key,
      setting_value,
      setting_type,
      description
    )
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      setting_value = VALUES(setting_value),
      setting_type = VALUES(setting_type),
      description = VALUES(description),
      updated_at = NOW()
    `,
    [key, String(value ?? ""), settingType(key), description]
  );
}

/*
|--------------------------------------------------------------------------
| saveSystemLog()
|--------------------------------------------------------------------------
| Chức năng:
| - Lưu lịch sử thao tác vào bảng systemlog.
| - Dùng cho:
|   UPDATE_SETTINGS
|   RESET_SETTINGS
|   BACKUP_DATABASE
|--------------------------------------------------------------------------
*/
async function saveSystemLog(connectionOrDb, req, action, device) {
  await connectionOrDb.query(
    `
    INSERT INTO systemlog (
      action,
      device,
      ip_address,
      created_at
    )
    VALUES (?, ?, ?, NOW())
    `,
    [action, device, getClientIp(req)]
  );
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
   3. API: LẤY LỊCH SỬ CÀI ĐẶT
   ---------------------------------------------------------
   Method: GET
   URL: /api/settings/logs

   Lưu ý:
   - Route /logs phải đặt trước route GET /
     để tránh bị nhầm với route gốc.
========================================================= */
router.get("/logs", async (req, res) => {
  try {
    const [logs] = await db.query(
      `
      SELECT
        id_log,
        action,
        device,
        ip_address,
        created_at
      FROM systemlog
      WHERE action IN (
        'UPDATE_SETTINGS',
        'RESET_SETTINGS',
        'BACKUP_DATABASE'
      )
      ORDER BY created_at DESC
      LIMIT 30
      `
    );

    return res.status(200).json(logs);
  } catch (error) {
    console.error("Lỗi lấy lịch sử cài đặt:", error);
    return sendServerError(res, "Lỗi lấy lịch sử cài đặt", error);
  }
});


/* =========================================================
   4. API: ĐẶT LẠI CÀI ĐẶT MẶC ĐỊNH
   ---------------------------------------------------------
   Method: POST
   URL: /api/settings/reset

   Logic:
   - Ghi toàn bộ DEFAULT_SETTINGS vào systemsetting.
   - Lưu log RESET_SETTINGS.
========================================================= */
router.post("/reset", async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      await upsertSetting(
        connection,
        key,
        value,
        `Cấu hình mặc định ${key}`
      );
    }

    await saveSystemLog(
      connection,
      req,
      "RESET_SETTINGS",
      "Đặt lại cài đặt mặc định"
    );

    await connection.commit();

    const defaultRows = Object.entries(DEFAULT_SETTINGS).map(
      ([setting_key, setting_value]) => ({
        setting_key,
        setting_value,
      })
    );

    return res.status(200).json({
      message: "Đặt lại cài đặt mặc định thành công",
      settings: normalizeSettings(defaultRows),
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi đặt lại cài đặt:", error);
    return sendServerError(res, "Lỗi đặt lại cài đặt", error);
  } finally {
    connection.release();
  }
});


/* =========================================================
   5. API: BACKUP DATABASE GIẢ LẬP
   ---------------------------------------------------------
   Method: POST
   URL: /api/settings/backup

   Logic:
   - Cập nhật backup_last_time.
   - Lưu log BACKUP_DATABASE.
========================================================= */
router.post("/backup", async (req, res) => {
  try {
    const backupTime = new Date().toISOString();

    await upsertSetting(
      db,
      "backup_last_time",
      backupTime,
      "Thời gian backup gần nhất"
    );

    await saveSystemLog(db, req, "BACKUP_DATABASE", "Backup database");

    return res.status(200).json({
      message: "Backup database thành công",
      backup_last_time: backupTime,
    });
  } catch (error) {
    console.error("Lỗi backup database:", error);
    return sendServerError(res, "Lỗi backup database", error);
  }
});


/* =========================================================
   6. API: LẤY TOÀN BỘ CÀI ĐẶT HỆ THỐNG
   ---------------------------------------------------------
   Method: GET
   URL: /api/settings

   Logic:
   - Lấy dữ liệu từ systemsetting.
   - Gộp với DEFAULT_SETTINGS.
   - Trả settings đã chuẩn hóa + raw data.
========================================================= */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
        setting_key,
        setting_value,
        setting_type,
        description,
        updated_at
      FROM systemsetting
      ORDER BY setting_key ASC
      `
    );

    return res.status(200).json({
      settings: normalizeSettings(rows),
      raw: rows,
    });
  } catch (error) {
    console.error("Lỗi lấy cài đặt hệ thống:", error);
    return sendServerError(res, "Lỗi lấy cài đặt hệ thống", error);
  }
});


/* =========================================================
   7. API: LƯU CÀI ĐẶT HỆ THỐNG
   ---------------------------------------------------------
   Method: PUT
   URL: /api/settings

   Logic:
   - Validate dữ liệu cấu hình.
   - Lưu từng setting bằng upsertSetting().
   - Lưu log UPDATE_SETTINGS.
========================================================= */
router.put("/", async (req, res) => {
  const settings = req.body || {};

  const validation = validateSettings(settings);

  if (!validation.valid) {
    return res.status(400).json({
      message: validation.message,
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    for (const [key, value] of Object.entries(settings)) {
      await upsertSetting(connection, key, value, `Cấu hình ${key}`);
    }

    await saveSystemLog(
      connection,
      req,
      "UPDATE_SETTINGS",
      "Cài đặt hệ thống"
    );

    await connection.commit();

    return res.status(200).json({
      message: "Lưu cài đặt hệ thống thành công",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi lưu cài đặt:", error);
    return sendServerError(res, "Lỗi lưu cài đặt hệ thống", error);
  } finally {
    connection.release();
  }
});

export default router;