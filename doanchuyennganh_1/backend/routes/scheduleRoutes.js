import express from "express";
import db from "../config/db.js";

const router = express.Router();

/* =========================================================
   FILE: scheduleRoutes.js
   ---------------------------------------------------------
   Chức năng:
   - Lấy options cho form lịch học
   - Lấy danh sách lịch học
   - Lấy chi tiết lịch học
   - Thêm lịch học
   - Cập nhật lịch học
   - Xóa lịch học an toàn

   DATABASE DÙNG:
   - schedule
   - courseclass
   - subject
   - teacher
   - classroom
   - session

   THỨ TỰ ROUTE:
   1. GET    /api/schedules/options
   2. GET    /api/schedules
   3. GET    /api/schedules/:id
   4. POST   /api/schedules
   5. PUT    /api/schedules/:id
   6. DELETE /api/schedules/:id
========================================================= */


/* =========================================================
   1. HẰNG SỐ VÀ HELPER
========================================================= */

const VALID_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/*
|--------------------------------------------------------------------------
| normalizeText()
|--------------------------------------------------------------------------
| Chức năng:
| - Chuẩn hóa chuỗi.
| - Tránh lỗi undefined/null.
| - Xóa khoảng trắng đầu/cuối.
|--------------------------------------------------------------------------
*/
function normalizeText(value) {
  return String(value || "").trim();
}

/*
|--------------------------------------------------------------------------
| toNull()
|--------------------------------------------------------------------------
| Chức năng:
| - Chuyển chuỗi rỗng thành null trước khi lưu MySQL.
|--------------------------------------------------------------------------
*/
function toNull(value) {
  const text = normalizeText(value);
  return text === "" ? null : text;
}

/*
|--------------------------------------------------------------------------
| toNumberOrNull()
|--------------------------------------------------------------------------
| Chức năng:
| - Chuyển id sang Number.
| - Nếu không hợp lệ thì trả null.
|--------------------------------------------------------------------------
*/
function toNumberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

/*
|--------------------------------------------------------------------------
| isValidDay()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra thứ trong tuần có hợp lệ không.
|--------------------------------------------------------------------------
*/
function isValidDay(day) {
  return VALID_DAYS.includes(day);
}

/*
|--------------------------------------------------------------------------
| compareTime()
|--------------------------------------------------------------------------
| Chức năng:
| - So sánh giờ dạng HH:mm hoặc HH:mm:ss.
|--------------------------------------------------------------------------
*/
function compareTime(startTime, endTime) {
  return String(startTime) < String(endTime);
}

/*
|--------------------------------------------------------------------------
| validateSchedulePayload()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra dữ liệu thêm/sửa lịch học.
| - Chuẩn hóa dữ liệu trước khi dùng trong SQL.
|--------------------------------------------------------------------------
*/
function validateSchedulePayload(body) {
  const id_course_class = toNumberOrNull(body.id_course_class);
  const id_room = toNumberOrNull(body.id_room);
  const day_of_week = normalizeText(body.day_of_week);
  const start_time = normalizeText(body.start_time);
  const end_time = normalizeText(body.end_time);
  const start_date = toNull(body.start_date);
  const end_date = toNull(body.end_date);

  if (!id_course_class || !id_room || !day_of_week || !start_time || !end_time) {
    return {
      valid: false,
      message: "Vui lòng nhập đầy đủ lớp học phần, phòng, thứ và thời gian học",
    };
  }

  if (!isValidDay(day_of_week)) {
    return {
      valid: false,
      message: "Thứ trong tuần không hợp lệ",
    };
  }

  if (!compareTime(start_time, end_time)) {
    return {
      valid: false,
      message: "Giờ bắt đầu phải nhỏ hơn giờ kết thúc",
    };
  }

  if (start_date && end_date && start_date > end_date) {
    return {
      valid: false,
      message: "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc",
    };
  }

  return {
    valid: true,
    data: {
      id_course_class,
      id_room,
      day_of_week,
      start_time,
      end_time,
      start_date,
      end_date,
    },
  };
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

/*
|--------------------------------------------------------------------------
| getCourseClass()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra lớp học phần tồn tại.
| - Lấy thêm id_teacher để kiểm tra trùng lịch giáo viên.
|--------------------------------------------------------------------------
*/
async function getCourseClass(connectionOrDb, idCourseClass) {
  const [rows] = await connectionOrDb.query(
    `
    SELECT
      cc.id_course_class,
      cc.class_code,
      cc.id_teacher,
      cc.status,
      t.full_name AS teacher_name
    FROM courseclass cc
    INNER JOIN teacher t
      ON t.id_teacher = cc.id_teacher
    WHERE cc.id_course_class = ?
    LIMIT 1
    `,
    [idCourseClass]
  );

  return rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| getRoom()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra phòng học tồn tại.
| - Không cho xếp lịch vào phòng đang MAINTENANCE.
|--------------------------------------------------------------------------
*/
async function getRoom(connectionOrDb, idRoom) {
  const [rows] = await connectionOrDb.query(
    `
    SELECT
      id_room,
      room_code,
      room_name,
      status
    FROM classroom
    WHERE id_room = ?
    LIMIT 1
    `,
    [idRoom]
  );

  return rows[0] || null;
}

/*
|--------------------------------------------------------------------------
| checkScheduleExists()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra lịch học có tồn tại không.
|--------------------------------------------------------------------------
*/
async function checkScheduleExists(connectionOrDb, idSchedule) {
  const [rows] = await connectionOrDb.query(
    `
    SELECT id_schedule
    FROM schedule
    WHERE id_schedule = ?
    LIMIT 1
    `,
    [idSchedule]
  );

  return rows.length > 0;
}

/*
|--------------------------------------------------------------------------
| buildDateOverlapCondition()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra trùng khoảng ngày.
| - Nếu start_date/end_date null thì xem như lịch dài hạn.
|--------------------------------------------------------------------------
*/
function buildDateOverlapCondition() {
  return `
    AND COALESCE(start_date, '1000-01-01') <= COALESCE(?, '9999-12-31')
    AND COALESCE(end_date, '9999-12-31') >= COALESCE(?, '1000-01-01')
  `;
}

/*
|--------------------------------------------------------------------------
| checkRoomConflict()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra phòng có bị trùng lịch không.
| - Trùng khi:
|   + Cùng phòng
|   + Cùng thứ
|   + Giao nhau thời gian
|   + Giao nhau khoảng ngày
|--------------------------------------------------------------------------
*/
async function checkRoomConflict(connectionOrDb, data, ignoreScheduleId = null) {
  const params = [
    data.id_room,
    data.day_of_week,
    data.end_time,
    data.start_time,
    data.end_date,
    data.start_date,
  ];

  let sql = `
    SELECT id_schedule
    FROM schedule
    WHERE id_room = ?
      AND day_of_week = ?
      AND start_time < ?
      AND end_time > ?
      ${buildDateOverlapCondition()}
  `;

  if (ignoreScheduleId) {
    sql += `
      AND id_schedule <> ?
    `;
    params.push(ignoreScheduleId);
  }

  sql += `
    LIMIT 1
  `;

  const [rows] = await connectionOrDb.query(sql, params);

  return rows.length > 0;
}

/*
|--------------------------------------------------------------------------
| checkCourseClassConflict()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra lớp học phần có bị trùng lịch không.
|--------------------------------------------------------------------------
*/
async function checkCourseClassConflict(
  connectionOrDb,
  data,
  ignoreScheduleId = null
) {
  const params = [
    data.id_course_class,
    data.day_of_week,
    data.end_time,
    data.start_time,
    data.end_date,
    data.start_date,
  ];

  let sql = `
    SELECT id_schedule
    FROM schedule
    WHERE id_course_class = ?
      AND day_of_week = ?
      AND start_time < ?
      AND end_time > ?
      ${buildDateOverlapCondition()}
  `;

  if (ignoreScheduleId) {
    sql += `
      AND id_schedule <> ?
    `;
    params.push(ignoreScheduleId);
  }

  sql += `
    LIMIT 1
  `;

  const [rows] = await connectionOrDb.query(sql, params);

  return rows.length > 0;
}

/*
|--------------------------------------------------------------------------
| checkTeacherConflict()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra giáo viên có bị trùng lịch dạy không.
| - Một giáo viên không thể dạy 2 lớp cùng thời gian.
|--------------------------------------------------------------------------
*/
async function checkTeacherConflict(
  connectionOrDb,
  teacherId,
  data,
  ignoreScheduleId = null
) {
  const params = [
    teacherId,
    data.day_of_week,
    data.end_time,
    data.start_time,
    data.end_date,
    data.start_date,
  ];

  let sql = `
    SELECT sch.id_schedule
    FROM schedule sch
    INNER JOIN courseclass cc
      ON cc.id_course_class = sch.id_course_class
    WHERE cc.id_teacher = ?
      AND sch.day_of_week = ?
      AND sch.start_time < ?
      AND sch.end_time > ?
      AND COALESCE(sch.start_date, '1000-01-01') <= COALESCE(?, '9999-12-31')
      AND COALESCE(sch.end_date, '9999-12-31') >= COALESCE(?, '1000-01-01')
  `;

  if (ignoreScheduleId) {
    sql += `
      AND sch.id_schedule <> ?
    `;
    params.push(ignoreScheduleId);
  }

  sql += `
    LIMIT 1
  `;

  const [rows] = await connectionOrDb.query(sql, params);

  return rows.length > 0;
}


/* =========================================================
   2. API: LẤY OPTIONS CHO FORM LỊCH HỌC
   ---------------------------------------------------------
   Method: GET
   URL: /api/schedules/options

   Chức năng:
   - Lấy danh sách lớp học phần.
   - Lấy danh sách phòng học.
   - Lấy danh sách giáo viên.
   - Trả danh sách thứ trong tuần.
========================================================= */
router.get("/options", async (req, res) => {
  try {
    const [courseClasses] = await db.query(
      `
      SELECT
        cc.id_course_class,
        cc.class_code,
        cc.semester,
        cc.school_year,
        cc.group_number,
        cc.max_student,
        cc.status,

        s.id_subject,
        s.subject_code,
        s.subject_name,

        t.id_teacher,
        t.teacher_code,
        t.full_name AS teacher_name,
        t.avatar AS teacher_avatar

      FROM courseclass cc
      INNER JOIN subject s
        ON s.id_subject = cc.id_subject
      INNER JOIN teacher t
        ON t.id_teacher = cc.id_teacher
      ORDER BY cc.id_course_class DESC
      `
    );

    const [rooms] = await db.query(
      `
      SELECT
        id_room,
        room_code,
        room_name,
        building,
        floor,
        capacity,
        status
      FROM classroom
      ORDER BY id_room DESC
      `
    );

    const [teachers] = await db.query(
      `
      SELECT
        id_teacher,
        teacher_code,
        full_name,
        avatar
      FROM teacher
      ORDER BY full_name ASC
      `
    );

    return res.status(200).json({
      courseClasses,
      rooms,
      teachers,
      days: VALID_DAYS,
    });
  } catch (error) {
    console.error("Lỗi lấy dữ liệu option lịch học:", error);
    return sendServerError(res, "Lỗi lấy dữ liệu option lịch học", error);
  }
});


/* =========================================================
   3. API: LẤY DANH SÁCH LỊCH HỌC
   ---------------------------------------------------------
   Method: GET
   URL: /api/schedules

   Query:
   - search
   - id_course_class
   - id_teacher
   - id_room
   - day_of_week
========================================================= */
router.get("/", async (req, res) => {
  try {
    const search = normalizeText(req.query.search);
    const idCourseClass = toNumberOrNull(req.query.id_course_class);
    const idTeacher = toNumberOrNull(req.query.id_teacher);
    const idRoom = toNumberOrNull(req.query.id_room);
    const dayOfWeek = normalizeText(req.query.day_of_week);

    if (dayOfWeek && !isValidDay(dayOfWeek)) {
      return res.status(400).json({
        message: "Thứ trong tuần không hợp lệ",
      });
    }

    const conditions = [
      `
      (
        cc.class_code LIKE ?
        OR sub.subject_code LIKE ?
        OR sub.subject_name LIKE ?
        OR t.full_name LIKE ?
        OR t.teacher_code LIKE ?
        OR r.room_code LIKE ?
        OR r.room_name LIKE ?
        OR r.building LIKE ?
      )
      `,
    ];

    const keyword = `%${search}%`;

    const params = [
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
      keyword,
    ];

    if (idCourseClass) {
      conditions.push("sch.id_course_class = ?");
      params.push(idCourseClass);
    }

    if (idTeacher) {
      conditions.push("t.id_teacher = ?");
      params.push(idTeacher);
    }

    if (idRoom) {
      conditions.push("sch.id_room = ?");
      params.push(idRoom);
    }

    if (dayOfWeek) {
      conditions.push("sch.day_of_week = ?");
      params.push(dayOfWeek);
    }

    const whereSql = `WHERE ${conditions.join(" AND ")}`;

    const [schedules] = await db.query(
      `
      SELECT
        sch.id_schedule,
        sch.id_course_class,
        sch.id_room,
        sch.day_of_week,
        sch.start_time,
        sch.end_time,
        sch.start_date,
        sch.end_date,

        cc.class_code,
        cc.semester,
        cc.school_year,
        cc.group_number,
        cc.max_student,
        cc.status AS course_status,

        sub.id_subject,
        sub.subject_code,
        sub.subject_name,
        sub.credits,

        t.id_teacher,
        t.teacher_code,
        t.full_name AS teacher_name,
        t.avatar AS teacher_avatar,

        r.room_code,
        r.room_name,
        r.building,
        r.floor,
        r.capacity,
        r.status AS room_status

      FROM schedule sch

      INNER JOIN courseclass cc
        ON cc.id_course_class = sch.id_course_class

      INNER JOIN subject sub
        ON sub.id_subject = cc.id_subject

      INNER JOIN teacher t
        ON t.id_teacher = cc.id_teacher

      INNER JOIN classroom r
        ON r.id_room = sch.id_room

      ${whereSql}

      ORDER BY
        FIELD(
          sch.day_of_week,
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday'
        ),
        sch.start_time ASC
      `,
      params
    );

    return res.status(200).json(schedules);
  } catch (error) {
    console.error("Lỗi lấy danh sách lịch học:", error);
    return sendServerError(res, "Lỗi lấy danh sách lịch học", error);
  }
});


/* =========================================================
   4. API: LẤY CHI TIẾT LỊCH HỌC
   ---------------------------------------------------------
   Method: GET
   URL: /api/schedules/:id
========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [schedules] = await db.query(
      `
      SELECT
        sch.id_schedule,
        sch.id_course_class,
        sch.id_room,
        sch.day_of_week,
        sch.start_time,
        sch.end_time,
        sch.start_date,
        sch.end_date,

        cc.class_code,
        cc.semester,
        cc.school_year,
        cc.group_number,
        cc.max_student,
        cc.status AS course_status,

        sub.id_subject,
        sub.subject_code,
        sub.subject_name,
        sub.credits,

        t.id_teacher,
        t.teacher_code,
        t.full_name AS teacher_name,
        t.avatar AS teacher_avatar,

        r.room_code,
        r.room_name,
        r.building,
        r.floor,
        r.capacity,
        r.status AS room_status

      FROM schedule sch

      INNER JOIN courseclass cc
        ON cc.id_course_class = sch.id_course_class

      INNER JOIN subject sub
        ON sub.id_subject = cc.id_subject

      INNER JOIN teacher t
        ON t.id_teacher = cc.id_teacher

      INNER JOIN classroom r
        ON r.id_room = sch.id_room

      WHERE sch.id_schedule = ?

      LIMIT 1
      `,
      [id]
    );

    if (schedules.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy lịch học",
      });
    }

    return res.status(200).json(schedules[0]);
  } catch (error) {
    console.error("Lỗi lấy chi tiết lịch học:", error);
    return sendServerError(res, "Lỗi lấy chi tiết lịch học", error);
  }
});


/* =========================================================
   5. API: THÊM LỊCH HỌC
   ---------------------------------------------------------
   Method: POST
   URL: /api/schedules

   Logic kiểm tra:
   - Lớp học phần tồn tại
   - Phòng học tồn tại và đang ACTIVE
   - Không trùng phòng
   - Không trùng lớp học phần
   - Không trùng lịch giáo viên
========================================================= */
router.post("/", async (req, res) => {
  const validation = validateSchedulePayload(req.body);

  if (!validation.valid) {
    return res.status(400).json({
      message: validation.message,
    });
  }

  const scheduleData = validation.data;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const courseClass = await getCourseClass(
      connection,
      scheduleData.id_course_class
    );

    if (!courseClass) {
      await connection.rollback();

      return res.status(404).json({
        message: "Lớp học phần không tồn tại",
      });
    }

    if (courseClass.status !== "OPEN") {
      await connection.rollback();

      return res.status(400).json({
        message: "Chỉ được xếp lịch cho lớp học phần đang mở",
      });
    }

    const room = await getRoom(connection, scheduleData.id_room);

    if (!room) {
      await connection.rollback();

      return res.status(404).json({
        message: "Phòng học không tồn tại",
      });
    }

    if (room.status !== "ACTIVE") {
      await connection.rollback();

      return res.status(400).json({
        message: "Không thể xếp lịch vào phòng đang bảo trì",
      });
    }

    const roomConflict = await checkRoomConflict(connection, scheduleData);

    if (roomConflict) {
      await connection.rollback();

      return res.status(409).json({
        message: "Phòng học đã có lịch trong khoảng thời gian này",
      });
    }

    const classConflict = await checkCourseClassConflict(
      connection,
      scheduleData
    );

    if (classConflict) {
      await connection.rollback();

      return res.status(409).json({
        message: "Lớp học phần đã có lịch trong khoảng thời gian này",
      });
    }

    const teacherConflict = await checkTeacherConflict(
      connection,
      courseClass.id_teacher,
      scheduleData
    );

    if (teacherConflict) {
      await connection.rollback();

      return res.status(409).json({
        message: `Giáo viên ${courseClass.teacher_name} đã có lịch dạy trong khoảng thời gian này`,
      });
    }

    const [result] = await connection.query(
      `
      INSERT INTO schedule (
        id_course_class,
        id_room,
        day_of_week,
        start_time,
        end_time,
        start_date,
        end_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        scheduleData.id_course_class,
        scheduleData.id_room,
        scheduleData.day_of_week,
        scheduleData.start_time,
        scheduleData.end_time,
        scheduleData.start_date,
        scheduleData.end_date,
      ]
    );

    await connection.commit();

    return res.status(201).json({
      message: "Thêm lịch học thành công",
      id_schedule: result.insertId,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi thêm lịch học:", error);
    return sendServerError(res, "Lỗi thêm lịch học", error);
  } finally {
    connection.release();
  }
});


/* =========================================================
   6. API: CẬP NHẬT LỊCH HỌC
   ---------------------------------------------------------
   Method: PUT
   URL: /api/schedules/:id

   Logic:
   - Kiểm tra lịch học tồn tại
   - Kiểm tra trùng lịch nhưng bỏ qua chính id_schedule hiện tại
========================================================= */
router.put("/:id", async (req, res) => {
  const { id } = req.params;

  const validation = validateSchedulePayload(req.body);

  if (!validation.valid) {
    return res.status(400).json({
      message: validation.message,
    });
  }

  const scheduleData = validation.data;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const scheduleExists = await checkScheduleExists(connection, id);

    if (!scheduleExists) {
      await connection.rollback();

      return res.status(404).json({
        message: "Không tìm thấy lịch học",
      });
    }

    const courseClass = await getCourseClass(
      connection,
      scheduleData.id_course_class
    );

    if (!courseClass) {
      await connection.rollback();

      return res.status(404).json({
        message: "Lớp học phần không tồn tại",
      });
    }

    if (courseClass.status !== "OPEN") {
      await connection.rollback();

      return res.status(400).json({
        message: "Chỉ được xếp lịch cho lớp học phần đang mở",
      });
    }

    const room = await getRoom(connection, scheduleData.id_room);

    if (!room) {
      await connection.rollback();

      return res.status(404).json({
        message: "Phòng học không tồn tại",
      });
    }

    if (room.status !== "ACTIVE") {
      await connection.rollback();

      return res.status(400).json({
        message: "Không thể xếp lịch vào phòng đang bảo trì",
      });
    }

    const roomConflict = await checkRoomConflict(connection, scheduleData, id);

    if (roomConflict) {
      await connection.rollback();

      return res.status(409).json({
        message: "Phòng học đã có lịch trong khoảng thời gian này",
      });
    }

    const classConflict = await checkCourseClassConflict(
      connection,
      scheduleData,
      id
    );

    if (classConflict) {
      await connection.rollback();

      return res.status(409).json({
        message: "Lớp học phần đã có lịch trong khoảng thời gian này",
      });
    }

    const teacherConflict = await checkTeacherConflict(
      connection,
      courseClass.id_teacher,
      scheduleData,
      id
    );

    if (teacherConflict) {
      await connection.rollback();

      return res.status(409).json({
        message: `Giáo viên ${courseClass.teacher_name} đã có lịch dạy trong khoảng thời gian này`,
      });
    }

    await connection.query(
      `
      UPDATE schedule
      SET
        id_course_class = ?,
        id_room = ?,
        day_of_week = ?,
        start_time = ?,
        end_time = ?,
        start_date = ?,
        end_date = ?
      WHERE id_schedule = ?
      `,
      [
        scheduleData.id_course_class,
        scheduleData.id_room,
        scheduleData.day_of_week,
        scheduleData.start_time,
        scheduleData.end_time,
        scheduleData.start_date,
        scheduleData.end_date,
        id,
      ]
    );

    await connection.commit();

    return res.status(200).json({
      message: "Cập nhật lịch học thành công",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi cập nhật lịch học:", error);
    return sendServerError(res, "Lỗi cập nhật lịch học", error);
  } finally {
    connection.release();
  }
});


/* =========================================================
   7. API: XÓA LỊCH HỌC
   ---------------------------------------------------------
   Method: DELETE
   URL: /api/schedules/:id

   Logic:
   - Nếu lịch học đã phát sinh session thì không cho xóa.
========================================================= */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const scheduleExists = await checkScheduleExists(connection, id);

    if (!scheduleExists) {
      await connection.rollback();

      return res.status(404).json({
        message: "Không tìm thấy lịch học",
      });
    }

    const [sessionRows] = await connection.query(
      `
      SELECT COUNT(*) AS total
      FROM session
      WHERE id_schedule = ?
      `,
      [id]
    );

    if (Number(sessionRows[0]?.total || 0) > 0) {
      await connection.rollback();

      return res.status(409).json({
        message:
          "Không thể xóa lịch học vì lịch này đã phát sinh buổi học trong bảng session",
      });
    }

    await connection.query(
      `
      DELETE FROM schedule
      WHERE id_schedule = ?
      `,
      [id]
    );

    await connection.commit();

    return res.status(200).json({
      message: "Xóa lịch học thành công",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi xóa lịch học:", error);

    return res.status(500).json({
      message:
        "Không thể xóa lịch học. Có thể lịch học đã phát sinh dữ liệu liên quan.",
      error: error.message,
      code: error.code,
    });
  } finally {
    connection.release();
  }
});

export default router;