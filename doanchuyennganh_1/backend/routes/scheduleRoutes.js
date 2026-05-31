import express from "express";
import db from "../config/db.js";

const router = express.Router();

const validDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function isValidDay(day) {
  return validDays.includes(day);
}

/*
|--------------------------------------------------------------------------
| API: Lấy dữ liệu option cho form lịch học
|--------------------------------------------------------------------------
| GET /api/schedules/options
|--------------------------------------------------------------------------
*/
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
        cc.status,

        s.id_subject,
        s.subject_code,
        s.subject_name,

        t.id_teacher,
        t.teacher_code,
        t.full_name AS teacher_name,
        t.avatar AS teacher_avatar

      FROM CourseClass cc
      INNER JOIN Subject s
        ON s.id_subject = cc.id_subject
      INNER JOIN Teacher t
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
      FROM ClassRoom
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
      FROM Teacher
      ORDER BY full_name ASC
      `
    );

    res.status(200).json({
      courseClasses,
      rooms,
      teachers,
      days: validDays,
    });
  } catch (error) {
    console.error("Lỗi lấy dữ liệu option lịch học:", error);

    res.status(500).json({
      message: "Lỗi lấy dữ liệu option lịch học",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| API: Lấy danh sách lịch học
|--------------------------------------------------------------------------
| GET /api/schedules
|--------------------------------------------------------------------------
*/
router.get("/", async (req, res) => {
  try {
    const search = req.query.search || "";
    const id_course_class = req.query.id_course_class || "";
    const id_teacher = req.query.id_teacher || "";
    const id_room = req.query.id_room || "";
    const day_of_week = req.query.day_of_week || "";

    let sql = `
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

      FROM Schedule sch
      INNER JOIN CourseClass cc
        ON cc.id_course_class = sch.id_course_class
      INNER JOIN Subject sub
        ON sub.id_subject = cc.id_subject
      INNER JOIN Teacher t
        ON t.id_teacher = cc.id_teacher
      INNER JOIN ClassRoom r
        ON r.id_room = sch.id_room

      WHERE
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

    if (id_course_class) {
      sql += ` AND sch.id_course_class = ?`;
      params.push(Number(id_course_class));
    }

    if (id_teacher) {
      sql += ` AND t.id_teacher = ?`;
      params.push(Number(id_teacher));
    }

    if (id_room) {
      sql += ` AND sch.id_room = ?`;
      params.push(Number(id_room));
    }

    if (day_of_week) {
      sql += ` AND sch.day_of_week = ?`;
      params.push(day_of_week);
    }

    sql += `
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
    `;

    const [schedules] = await db.query(sql, params);

    res.status(200).json(schedules);
  } catch (error) {
    console.error("Lỗi lấy danh sách lịch học:", error);

    res.status(500).json({
      message: "Lỗi lấy danh sách lịch học",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| API: Thêm lịch học
|--------------------------------------------------------------------------
| POST /api/schedules
|--------------------------------------------------------------------------
*/
router.post("/", async (req, res) => {
  const {
    id_course_class,
    id_room,
    day_of_week,
    start_time,
    end_time,
    start_date,
    end_date,
  } = req.body;

  if (!id_course_class || !id_room || !day_of_week || !start_time || !end_time) {
    return res.status(400).json({
      message: "Vui lòng nhập đầy đủ lớp học phần, phòng, thứ và thời gian học",
    });
  }

  if (!isValidDay(day_of_week)) {
    return res.status(400).json({
      message: "Thứ trong tuần không hợp lệ",
    });
  }

  if (start_time >= end_time) {
    return res.status(400).json({
      message: "Giờ bắt đầu phải nhỏ hơn giờ kết thúc",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [courseClasses] = await connection.query(
      `
      SELECT id_course_class
      FROM CourseClass
      WHERE id_course_class = ?
      LIMIT 1
      `,
      [Number(id_course_class)]
    );

    if (courseClasses.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Lớp học phần không tồn tại",
      });
    }

    const [rooms] = await connection.query(
      `
      SELECT id_room
      FROM ClassRoom
      WHERE id_room = ?
      LIMIT 1
      `,
      [Number(id_room)]
    );

    if (rooms.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Phòng học không tồn tại",
      });
    }

    const [roomConflicts] = await connection.query(
      `
      SELECT id_schedule
      FROM Schedule
      WHERE id_room = ?
        AND day_of_week = ?
        AND start_time < ?
        AND end_time > ?
      LIMIT 1
      `,
      [Number(id_room), day_of_week, end_time, start_time]
    );

    if (roomConflicts.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Phòng học đã có lịch trong khoảng thời gian này",
      });
    }

    const [classConflicts] = await connection.query(
      `
      SELECT id_schedule
      FROM Schedule
      WHERE id_course_class = ?
        AND day_of_week = ?
        AND start_time < ?
        AND end_time > ?
      LIMIT 1
      `,
      [Number(id_course_class), day_of_week, end_time, start_time]
    );

    if (classConflicts.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Lớp học phần đã có lịch trong khoảng thời gian này",
      });
    }

    const [result] = await connection.query(
      `
      INSERT INTO Schedule (
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
        Number(id_course_class),
        Number(id_room),
        day_of_week,
        start_time,
        end_time,
        start_date || null,
        end_date || null,
      ]
    );

    await connection.commit();

    res.status(201).json({
      message: "Thêm lịch học thành công",
      id_schedule: result.insertId,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi thêm lịch học:", error);

    res.status(500).json({
      message: "Lỗi thêm lịch học",
      error: error.message,
      code: error.code,
    });
  } finally {
    connection.release();
  }
});

/*
|--------------------------------------------------------------------------
| API: Cập nhật lịch học
|--------------------------------------------------------------------------
| PUT /api/schedules/:id
|--------------------------------------------------------------------------
*/
router.put("/:id", async (req, res) => {
  const { id } = req.params;

  const {
    id_course_class,
    id_room,
    day_of_week,
    start_time,
    end_time,
    start_date,
    end_date,
  } = req.body;

  if (!id_course_class || !id_room || !day_of_week || !start_time || !end_time) {
    return res.status(400).json({
      message: "Vui lòng nhập đầy đủ lớp học phần, phòng, thứ và thời gian học",
    });
  }

  if (!isValidDay(day_of_week)) {
    return res.status(400).json({
      message: "Thứ trong tuần không hợp lệ",
    });
  }

  if (start_time >= end_time) {
    return res.status(400).json({
      message: "Giờ bắt đầu phải nhỏ hơn giờ kết thúc",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [schedules] = await connection.query(
      `
      SELECT id_schedule
      FROM Schedule
      WHERE id_schedule = ?
      LIMIT 1
      `,
      [id]
    );

    if (schedules.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Không tìm thấy lịch học",
      });
    }

    const [roomConflicts] = await connection.query(
      `
      SELECT id_schedule
      FROM Schedule
      WHERE id_room = ?
        AND day_of_week = ?
        AND start_time < ?
        AND end_time > ?
        AND id_schedule <> ?
      LIMIT 1
      `,
      [Number(id_room), day_of_week, end_time, start_time, id]
    );

    if (roomConflicts.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Phòng học đã có lịch trong khoảng thời gian này",
      });
    }

    const [classConflicts] = await connection.query(
      `
      SELECT id_schedule
      FROM Schedule
      WHERE id_course_class = ?
        AND day_of_week = ?
        AND start_time < ?
        AND end_time > ?
        AND id_schedule <> ?
      LIMIT 1
      `,
      [Number(id_course_class), day_of_week, end_time, start_time, id]
    );

    if (classConflicts.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Lớp học phần đã có lịch trong khoảng thời gian này",
      });
    }

    await connection.query(
      `
      UPDATE Schedule
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
        Number(id_course_class),
        Number(id_room),
        day_of_week,
        start_time,
        end_time,
        start_date || null,
        end_date || null,
        id,
      ]
    );

    await connection.commit();

    res.status(200).json({
      message: "Cập nhật lịch học thành công",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi cập nhật lịch học:", error);

    res.status(500).json({
      message: "Lỗi cập nhật lịch học",
      error: error.message,
      code: error.code,
    });
  } finally {
    connection.release();
  }
});

/*
|--------------------------------------------------------------------------
| API: Xóa lịch học
|--------------------------------------------------------------------------
| DELETE /api/schedules/:id
|--------------------------------------------------------------------------
*/
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [schedules] = await connection.query(
      `
      SELECT id_schedule
      FROM Schedule
      WHERE id_schedule = ?
      LIMIT 1
      `,
      [id]
    );

    if (schedules.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Không tìm thấy lịch học",
      });
    }

    await connection.query(
      `
      DELETE FROM Schedule
      WHERE id_schedule = ?
      `,
      [id]
    );

    await connection.commit();

    res.status(200).json({
      message: "Xóa lịch học thành công",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi xóa lịch học:", error);

    res.status(500).json({
      message:
        "Không thể xóa lịch học. Có thể lịch học đã phát sinh buổi học trong bảng Session.",
      error: error.message,
      code: error.code,
    });
  } finally {
    connection.release();
  }
});

export default router;