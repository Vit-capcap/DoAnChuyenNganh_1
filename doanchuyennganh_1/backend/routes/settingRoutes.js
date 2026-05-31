import express from "express";
import db from "../config/db.js";

const router = express.Router();

const defaultSettings = {
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

function toBoolean(value) {
  return value === true || value === "true" || value === "1";
}

function normalizeSettings(rows) {
  const settings = { ...defaultSettings };

  rows.forEach((item) => {
    settings[item.setting_key] = item.setting_value ?? "";
  });

  return {
    school_name: settings.school_name,
    school_address: settings.school_address,
    school_logo: settings.school_logo,

    ai_confidence_threshold: Number(settings.ai_confidence_threshold || 85),
    ai_face_sensitivity: settings.ai_face_sensitivity || "MEDIUM",
    ai_unknown_face_alert: toBoolean(settings.ai_unknown_face_alert),

    attendance_start_time: settings.attendance_start_time || "07:00",
    attendance_end_time: settings.attendance_end_time || "17:30",
    attendance_late_threshold: Number(settings.attendance_late_threshold || 15),
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

function settingType(key) {
  if (
    key.includes("threshold") ||
    key.includes("confidence")
  ) {
    return "NUMBER";
  }

  if (
    key.includes("alert") ||
    key.includes("auto") ||
    key.includes("notification") ||
    key.includes("2fa")
  ) {
    return "BOOLEAN";
  }

  if (key.includes("logo")) {
    return "IMAGE";
  }

  return "TEXT";
}

/*
|--------------------------------------------------------------------------
| API: Lấy toàn bộ cài đặt hệ thống
|--------------------------------------------------------------------------
| GET /api/settings
|--------------------------------------------------------------------------
*/
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
      FROM SystemSetting
      ORDER BY setting_key ASC
      `
    );

    res.status(200).json({
      settings: normalizeSettings(rows),
      raw: rows,
    });
  } catch (error) {
    console.error("Lỗi lấy cài đặt hệ thống:", error);

    res.status(500).json({
      message: "Lỗi lấy cài đặt hệ thống",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| API: Lưu cài đặt hệ thống
|--------------------------------------------------------------------------
| PUT /api/settings
|--------------------------------------------------------------------------
*/
router.put("/", async (req, res) => {
  const settings = req.body || {};

  const confidence = Number(settings.ai_confidence_threshold);
  const lateThreshold = Number(settings.attendance_late_threshold);

  if (Number.isNaN(confidence) || confidence < 50 || confidence > 100) {
    return res.status(400).json({
      message: "Độ tin cậy AI phải nằm trong khoảng 50 - 100",
    });
  }

  if (Number.isNaN(lateThreshold) || lateThreshold < 0) {
    return res.status(400).json({
      message: "Ngưỡng đi muộn phải lớn hơn hoặc bằng 0",
    });
  }

  if (
    settings.attendance_start_time &&
    settings.attendance_end_time &&
    settings.attendance_start_time >= settings.attendance_end_time
  ) {
    return res.status(400).json({
      message: "Giờ bắt đầu phải nhỏ hơn giờ kết thúc",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const entries = Object.entries(settings);

    for (const [key, value] of entries) {
      await connection.query(
        `
        INSERT INTO SystemSetting (
          setting_key,
          setting_value,
          setting_type,
          description
        )
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          setting_value = VALUES(setting_value),
          setting_type = VALUES(setting_type),
          updated_at = NOW()
        `,
        [
          key,
          String(value ?? ""),
          settingType(key),
          `Cấu hình ${key}`,
        ]
      );
    }

    // await connection.query(
    //   `
    //   INSERT INTO SystemLog (
    //     action,
    //     description,
    //     created_at
    //   )
    //   VALUES (?, ?, NOW())
    //   `,
    //   [
    //     "UPDATE_SETTINGS",
    //     "Cập nhật cài đặt hệ thống",
    //   ]
    // );
    await connection.query(
  `
  INSERT INTO SystemLog (
    action,
    device,
    ip_address,
    created_at
  )
  VALUES (?, ?, ?, NOW())
  `,
  [
    "UPDATE_SETTINGS",
    "Cài đặt hệ thống",
    req.ip || null,
  ]
);

    await connection.commit();

    res.status(200).json({
      message: "Lưu cài đặt hệ thống thành công",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi lưu cài đặt:", error);

    res.status(500).json({
      message: "Lỗi lưu cài đặt hệ thống",
      error: error.message,
      code: error.code,
    });
  } finally {
    connection.release();
  }
});

/*
|--------------------------------------------------------------------------
| API: Đặt lại cấu hình mặc định
|--------------------------------------------------------------------------
| POST /api/settings/reset
|--------------------------------------------------------------------------
*/
router.post("/reset", async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    for (const [key, value] of Object.entries(defaultSettings)) {
      await connection.query(
        `
        INSERT INTO SystemSetting (
          setting_key,
          setting_value,
          setting_type,
          description
        )
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          setting_value = VALUES(setting_value),
          setting_type = VALUES(setting_type),
          updated_at = NOW()
        `,
        [
          key,
          String(value),
          settingType(key),
          `Cấu hình mặc định ${key}`,
        ]
      );
    }

    // await connection.query(
    //   `
    //   INSERT INTO SystemLog (
    //     action,
    //     description,
    //     created_at
    //   )
    //   VALUES (?, ?, NOW())
    //   `,
    //   [
    //     "RESET_SETTINGS",
    //     "Đặt lại cài đặt hệ thống về mặc định",
    //   ]
    // );


    await connection.query(
  `
  INSERT INTO SystemLog (
    action,
    device,
    ip_address,
    created_at
  )
  VALUES (?, ?, ?, NOW())
  `,
  [
    "RESET_SETTINGS",
    "Đặt lại cài đặt mặc định",
    req.ip || null,
  ]
);
    await connection.commit();

    res.status(200).json({
      message: "Đặt lại cài đặt mặc định thành công",
      settings: normalizeSettings(
        Object.entries(defaultSettings).map(([setting_key, setting_value]) => ({
          setting_key,
          setting_value,
        }))
      ),
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi đặt lại cài đặt:", error);

    res.status(500).json({
      message: "Lỗi đặt lại cài đặt",
      error: error.message,
      code: error.code,
    });
  } finally {
    connection.release();
  }
});

/*
|--------------------------------------------------------------------------
| API: Backup database giả lập
|--------------------------------------------------------------------------
| POST /api/settings/backup
|--------------------------------------------------------------------------
*/
router.post("/backup", async (req, res) => {
  try {
    const backupTime = new Date().toISOString();

    await db.query(
      `
      INSERT INTO SystemSetting (
        setting_key,
        setting_value,
        setting_type,
        description
      )
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        setting_value = VALUES(setting_value),
        updated_at = NOW()
      `,
      [
        "backup_last_time",
        backupTime,
        "TEXT",
        "Thời gian backup gần nhất",
      ]
    );

    // await db.query(
    //   `
    //   INSERT INTO SystemLog (
    //     action,
    //     description,
    //     created_at
    //   )
    //   VALUES (?, ?, NOW())
    //   `,
    //   [
    //     "BACKUP_DATABASE",
    //     "Thực hiện backup database",
    //   ]
    // );
    await db.query(
  `
  INSERT INTO SystemLog (
    action,
    device,
    ip_address,
    created_at
  )
  VALUES (?, ?, ?, NOW())
  `,
  [
    "BACKUP_DATABASE",
    "Backup database",
    req.ip || null,
  ]
);

    res.status(200).json({
      message: "Backup database thành công",
      backup_last_time: backupTime,
    });
  } catch (error) {
    console.error("Lỗi backup database:", error);

    res.status(500).json({
      message: "Lỗi backup database",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| API: Lịch sử hệ thống
|--------------------------------------------------------------------------
| GET /api/settings/logs
|--------------------------------------------------------------------------
*/
// router.get("/logs", async (req, res) => {
//   try {
//     const [logs] = await db.query(
//       `
//       SELECT
//         id_log,
//         action,
//         description,
//         created_at
//       FROM SystemLog
//       WHERE action IN (
//         'UPDATE_SETTINGS',
//         'RESET_SETTINGS',
//         'BACKUP_DATABASE'
//       )
//       ORDER BY created_at DESC
//       LIMIT 30
//       `
//     );

//     res.status(200).json(logs);
//   } catch (error) {
//     console.error("Lỗi lấy lịch sử cài đặt:", error);

//     res.status(500).json({
//       message: "Lỗi lấy lịch sử cài đặt",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });
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
      FROM SystemLog
      WHERE action IN (
        'UPDATE_SETTINGS',
        'RESET_SETTINGS',
        'BACKUP_DATABASE'
      )
      ORDER BY created_at DESC
      LIMIT 30
      `
    );

    res.status(200).json(logs);
  } catch (error) {
    console.error("Lỗi lấy lịch sử cài đặt:", error);

    res.status(500).json({
      message: "Lỗi lấy lịch sử cài đặt",
      error: error.message,
      code: error.code,
    });
  }
});

export default router;