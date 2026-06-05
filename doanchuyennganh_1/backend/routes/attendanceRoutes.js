import express from "express";
import db from "../config/db.js";

const router = express.Router();

/* =========================================================
   FILE: attendanceRoutes.js
   ---------------------------------------------------------
   Chức năng:
   - Lấy options bộ lọc điểm danh
   - Lấy danh sách điểm danh + thống kê
   - Tìm sinh viên để điểm danh thủ công
   - Lấy sinh viên trong một buổi học
   - Điểm danh thủ công
   - Cập nhật điểm danh
   - Xóa điểm danh
   - Xác nhận điểm danh bằng khuôn mặt

   DATABASE DÙNG:
   - attendance
   - student
   - session
   - schedule
   - courseclass
   - subject
   - classroom
   - enrollment
   - recognitionhistory

   LOGIC ĐI TRỄ:
   Ví dụ:
   - Giờ học bắt đầu: 07:30
   - Từ 07:45 trở đi là LATE
   - Trước 07:45 là PRESENT

   THỨ TỰ ROUTE:
   1. GET    /api/attendance/options
   2. GET    /api/attendance/search-students/list
   3. GET    /api/attendance/session/:id_session/students
   4. POST   /api/attendance/face-confirm
   5. GET    /api/attendance
   6. POST   /api/attendance
   7. PUT    /api/attendance/:id
   8. DELETE /api/attendance/:id
========================================================= */


/* =========================================================
   1. HẰNG SỐ VÀ HELPER
========================================================= */

const VALID_ATTENDANCE_STATUS = ["PRESENT", "ABSENT", "LATE"];

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
| normalizeStatus()
|--------------------------------------------------------------------------
| Chức năng:
| - Chuẩn hóa trạng thái điểm danh thành chữ hoa.
|--------------------------------------------------------------------------
*/
function normalizeStatus(value) {
  return normalizeText(value).toUpperCase();
}

/*
|--------------------------------------------------------------------------
| toNumberOrNull()
|--------------------------------------------------------------------------
| Chức năng:
| - Chuyển id/số về Number.
| - Nếu rỗng hoặc không hợp lệ thì trả null.
|--------------------------------------------------------------------------
*/
function toNumberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
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
  if (value === undefined || value === null) return null;

  const text = String(value).trim();

  return text === "" ? null : text;
}

/*
|--------------------------------------------------------------------------
| normalizeDateOnly()
|--------------------------------------------------------------------------
| Chức năng:
| - Chuẩn hóa ngày về dạng YYYY-MM-DD.
| - Tránh lỗi lệch ngày khi MySQL/JS trả ISO UTC.
|--------------------------------------------------------------------------
*/
function normalizeDateOnly(value) {
  if (!value) return "";

  const text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return text.slice(0, 10);
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
}

/*
|--------------------------------------------------------------------------
| normalizeTimeOnly()
|--------------------------------------------------------------------------
| Chức năng:
| - Chuẩn hóa giờ về HH:mm:ss.
|--------------------------------------------------------------------------
*/
function normalizeTimeOnly(value) {
  const text = String(value || "00:00:00").trim();

  if (/^\d{2}:\d{2}$/.test(text)) {
    return `${text}:00`;
  }

  return text.slice(0, 8);
}

/*
|--------------------------------------------------------------------------
| buildDateFilter()
|--------------------------------------------------------------------------
| Chức năng:
| - Nếu frontend truyền date thì dùng date đó.
| - Nếu không truyền thì mặc định lấy ngày hiện tại theo giờ Việt Nam.
|--------------------------------------------------------------------------
*/
function buildDateFilter(date) {
  const inputDate = normalizeText(date);

  if (inputDate) return normalizeDateOnly(inputDate);

  return normalizeDateOnly(new Date());
}

/*
|--------------------------------------------------------------------------
| isValidAttendanceStatus()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra trạng thái điểm danh hợp lệ.
|--------------------------------------------------------------------------
*/
function isValidAttendanceStatus(status) {
  return VALID_ATTENDANCE_STATUS.includes(status);
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
| getFinalCheckInTime()
|--------------------------------------------------------------------------
| Chức năng:
| - PRESENT/LATE thì có check_in_time.
| - ABSENT thì check_in_time = null.
|--------------------------------------------------------------------------
*/
function getFinalCheckInTime(status, checkInTime) {
  if (status === "PRESENT" || status === "LATE") {
    return checkInTime || new Date();
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| calculateFaceAttendanceStatus()
|--------------------------------------------------------------------------
| Chức năng:
| - Tính PRESENT/LATE khi sinh viên bấm OK xác nhận điểm danh.
|
| Logic:
| - lateLimit = start_time + 15 phút.
| - Nếu now >= lateLimit thì LATE.
| - Nếu now < lateLimit thì PRESENT.
|
| Ví dụ:
| - start_time = 07:30
| - lateLimit = 07:45
| - từ 07:45:00 trở đi là LATE.
|--------------------------------------------------------------------------
*/
function calculateFaceAttendanceStatus(sessionDate, startTime, now = new Date()) {
  const dateText = normalizeDateOnly(sessionDate);
  const timeText = normalizeTimeOnly(startTime);

  if (!dateText || !timeText) {
    return "PRESENT";
  }

  const startDateTime = new Date(`${dateText}T${timeText}`);

  if (Number.isNaN(startDateTime.getTime())) {
    return "PRESENT";
  }

  const lateLimit = new Date(startDateTime.getTime() + 15 * 60 * 1000);

  return now >= lateLimit ? "LATE" : "PRESENT";
}


/* =========================================================
   2. API: LẤY OPTIONS BỘ LỌC ĐIỂM DANH
   ---------------------------------------------------------
   Method: GET
   URL: /api/attendance/options
========================================================= */
router.get("/options", async (req, res) => {
  try {
    const [classes] = await db.query(
      `
      SELECT DISTINCT
        s.class_name
      FROM student s
      WHERE s.class_name IS NOT NULL
        AND s.class_name <> ''
      ORDER BY s.class_name ASC
      `
    );

    const [subjects] = await db.query(
      `
      SELECT
        id_subject,
        subject_code,
        subject_name
      FROM subject
      ORDER BY subject_name ASC
      `
    );

    const [courseClasses] = await db.query(
      `
      SELECT
        cc.id_course_class,
        cc.class_code,
        sub.subject_name,
        t.full_name AS teacher_name
      FROM courseclass cc
      INNER JOIN subject sub
        ON sub.id_subject = cc.id_subject
      INNER JOIN teacher t
        ON t.id_teacher = cc.id_teacher
      ORDER BY cc.class_code ASC
      `
    );

    const [sessions] = await db.query(
      `
      SELECT
        se.id_session,
        DATE_FORMAT(se.session_date, '%Y-%m-%d') AS session_date,
        se.session_number,
        se.status AS session_status,

        sch.start_time,
        sch.end_time,

        cc.class_code,

        sub.subject_name,

        r.room_code,
        r.room_name

      FROM session se
      INNER JOIN schedule sch
        ON sch.id_schedule = se.id_schedule
      INNER JOIN courseclass cc
        ON cc.id_course_class = sch.id_course_class
      INNER JOIN subject sub
        ON sub.id_subject = cc.id_subject
      INNER JOIN classroom r
        ON r.id_room = sch.id_room

      ORDER BY se.session_date DESC, sch.start_time DESC
      LIMIT 100
      `
    );

    return res.status(200).json({
      classes,
      subjects,
      courseClasses,
      sessions,
      statuses: VALID_ATTENDANCE_STATUS,
    });
  } catch (error) {
    console.error("Lỗi lấy options điểm danh:", error);
    return sendServerError(res, "Lỗi lấy options điểm danh", error);
  }
});


/* =========================================================
   3. API: TÌM SINH VIÊN CHO ĐIỂM DANH THỦ CÔNG
   ---------------------------------------------------------
   Method: GET
   URL: /api/attendance/search-students/list?search=
========================================================= */
router.get("/search-students/list", async (req, res) => {
  try {
    const search = normalizeText(req.query.search);
    const keyword = `%${search}%`;

    const [students] = await db.query(
      `
      SELECT
        id_student,
        student_code,
        full_name,
        class_name,
        faculty,
        avatar
      FROM student
      WHERE
        student_code LIKE ?
        OR full_name LIKE ?
        OR class_name LIKE ?
      ORDER BY full_name ASC
      LIMIT 30
      `,
      [keyword, keyword, keyword]
    );

    return res.status(200).json(students);
  } catch (error) {
    console.error("Lỗi tìm sinh viên:", error);
    return sendServerError(res, "Lỗi tìm sinh viên", error);
  }
});


/* =========================================================
   4. API: LẤY SINH VIÊN TRONG BUỔI HỌC
   ---------------------------------------------------------
   Method: GET
   URL: /api/attendance/session/:id_session/students
========================================================= */
router.get("/session/:id_session/students", async (req, res) => {
  try {
    const { id_session } = req.params;

    if (!id_session) {
      return res.status(400).json({
        message: "Thiếu id_session",
      });
    }

    const [sessionRows] = await db.query(
      `
      SELECT
        se.id_session,
        DATE_FORMAT(se.session_date, '%Y-%m-%d') AS session_date,
        se.session_number,
        se.status AS session_status,

        sc.start_time,
        sc.end_time,

        cc.id_course_class,
        cc.class_code,

        su.id_subject,
        su.subject_code,
        su.subject_name

      FROM session se

      INNER JOIN schedule sc
        ON se.id_schedule = sc.id_schedule

      INNER JOIN courseclass cc
        ON sc.id_course_class = cc.id_course_class

      INNER JOIN subject su
        ON cc.id_subject = su.id_subject

      WHERE se.id_session = ?

      LIMIT 1
      `,
      [id_session]
    );

    if (sessionRows.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy buổi học",
      });
    }

    const session = sessionRows[0];

    const [students] = await db.query(
      `
      SELECT
        s.id_student,
        s.student_code,
        s.full_name,
        s.avatar,
        s.class_name,
        s.email,

        a.id_attendance,
        a.check_in_time,
        a.status AS attendance_status,
        a.confidence_score,
        a.note

      FROM enrollment e

      INNER JOIN student s
        ON e.id_student = s.id_student

      LEFT JOIN attendance a
        ON a.id_student = s.id_student
       AND a.id_session = ?

      WHERE e.id_course_class = ?
        AND e.status = 'STUDYING'

      ORDER BY s.student_code ASC
      `,
      [id_session, session.id_course_class]
    );

    const result = students.map((student) => ({
      ...student,
      display_status: student.id_attendance
        ? student.attendance_status
        : "NOT_MARKED",
    }));

    return res.status(200).json({
      session,
      students: result,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách sinh viên điểm danh:", error);
    return sendServerError(res, "Lỗi lấy danh sách sinh viên điểm danh", error);
  }
});


/* =========================================================
   5. API: XÁC NHẬN ĐIỂM DANH BẰNG KHUÔN MẶT
   ---------------------------------------------------------
   Method: POST
   URL: /api/attendance/face-confirm

   Body:
   - id_session
   - student_code
   - confidence
   - face_image
   - camera_id
   - expected_status       optional
   - client_check_time     optional

   Chức năng:
   - Sau khi AI nhận diện đúng sinh viên,
     sinh viên bấm OK thì API này mới lưu điểm danh.
   - Backend tự tính lại PRESENT/LATE theo giờ học.
   - Không tin hoàn toàn expected_status từ frontend.
========================================================= */
router.post("/face-confirm", async (req, res) => {
  const connection = await db.getConnection();

  try {
    const idSession = toNumberOrNull(req.body.id_session);
    const studentCode = normalizeText(req.body.student_code);
    const confidence = toNumberOrNull(req.body.confidence) || 0;
    const faceImage = toNull(req.body.face_image);
    const cameraId = toNumberOrNull(req.body.camera_id);
    const expectedStatus = normalizeStatus(req.body.expected_status);

    if (!idSession || !studentCode) {
      return res.status(400).json({
        message: "Thiếu id_session hoặc student_code",
      });
    }

    await connection.beginTransaction();

    const [sessionRows] = await connection.query(
      `
      SELECT
        se.id_session,
        DATE_FORMAT(se.session_date, '%Y-%m-%d') AS session_date,
        se.session_number,
        se.status AS session_status,

        sc.start_time,
        sc.end_time,

        cc.id_course_class,
        cc.class_code,

        su.subject_name

      FROM session se

      INNER JOIN schedule sc
        ON se.id_schedule = sc.id_schedule

      INNER JOIN courseclass cc
        ON sc.id_course_class = cc.id_course_class

      INNER JOIN subject su
        ON cc.id_subject = su.id_subject

      WHERE se.id_session = ?

      LIMIT 1
      `,
      [idSession]
    );

    if (sessionRows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Không tìm thấy buổi học",
      });
    }

    const sessionData = sessionRows[0];

    const [studentRows] = await connection.query(
      `
      SELECT
        id_student,
        student_code,
        full_name
      FROM student
      WHERE student_code = ?
      LIMIT 1
      `,
      [studentCode]
    );

    if (studentRows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Không tìm thấy sinh viên trong hệ thống",
      });
    }

    const student = studentRows[0];

    const [enrollRows] = await connection.query(
      `
      SELECT id_enrollment
      FROM enrollment
      WHERE id_student = ?
        AND id_course_class = ?
        AND status = 'STUDYING'
      LIMIT 1
      `,
      [student.id_student, sessionData.id_course_class]
    );

    if (enrollRows.length === 0) {
      await connection.rollback();

      return res.status(400).json({
        message: "Sinh viên không thuộc lớp học phần của buổi học này",
      });
    }

    /*
      Backend tự tính trạng thái thật sự.
      expected_status từ frontend chỉ để debug/đối chiếu.
    */
    const attendanceStatus = calculateFaceAttendanceStatus(
      sessionData.session_date,
      sessionData.start_time,
      new Date()
    );

    const finalStatus = isValidAttendanceStatus(attendanceStatus)
      ? attendanceStatus
      : expectedStatus === "LATE"
        ? "LATE"
        : "PRESENT";

    const [oldRows] = await connection.query(
      `
      SELECT id_attendance
      FROM attendance
      WHERE id_session = ?
        AND id_student = ?
      LIMIT 1
      `,
      [idSession, student.id_student]
    );

    let idAttendance = null;

    if (oldRows.length > 0) {
      idAttendance = oldRows[0].id_attendance;

      await connection.query(
        `
        UPDATE attendance
        SET
          check_in_time = NOW(),
          status = ?,
          confidence_score = ?,
          face_image = ?,
          note = ?
        WHERE id_attendance = ?
        `,
        [
          finalStatus,
          confidence,
          faceImage,
          finalStatus === "LATE"
            ? "Điểm danh đi trễ bằng nhận diện khuôn mặt"
            : "Điểm danh bằng nhận diện khuôn mặt",
          idAttendance,
        ]
      );
    } else {
      const [insertResult] = await connection.query(
        `
        INSERT INTO attendance (
          id_session,
          id_student,
          check_in_time,
          status,
          confidence_score,
          face_image,
          note
        )
        VALUES (?, ?, NOW(), ?, ?, ?, ?)
        `,
        [
          idSession,
          student.id_student,
          finalStatus,
          confidence,
          faceImage,
          finalStatus === "LATE"
            ? "Điểm danh đi trễ bằng nhận diện khuôn mặt"
            : "Điểm danh bằng nhận diện khuôn mặt",
        ]
      );

      idAttendance = insertResult.insertId;
    }

    const [historyResult] = await connection.query(
      `
      INSERT INTO recognitionhistory (
        id_student,
        capture_time,
        confidence,
        camera_id,
        result,
        image_path
      )
      VALUES (?, NOW(), ?, ?, 'SUCCESS', ?)
      `,
      [
        student.id_student,
        confidence,
        cameraId,
        faceImage,
      ]
    );

    await connection.commit();

    return res.status(200).json({
      message:
        finalStatus === "LATE"
          ? `Đã lưu điểm danh đi trễ cho ${student.student_code} - ${student.full_name}`
          : `Đã lưu điểm danh cho ${student.student_code} - ${student.full_name}`,
      id_attendance: idAttendance,
      id_history: historyResult.insertId,
      status: finalStatus,
      expected_status: expectedStatus || null,
      student: {
        id_student: student.id_student,
        student_code: student.student_code,
        full_name: student.full_name,
      },
      session: {
        id_session: sessionData.id_session,
        session_date: sessionData.session_date,
        start_time: sessionData.start_time,
        end_time: sessionData.end_time,
        class_code: sessionData.class_code,
        subject_name: sessionData.subject_name,
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi xác nhận điểm danh khuôn mặt:", error);

    return sendServerError(res, "Lỗi xác nhận điểm danh khuôn mặt", error);
  } finally {
    connection.release();
  }
});


/* =========================================================
   6. API: LẤY DANH SÁCH ĐIỂM DANH + THỐNG KÊ
   ---------------------------------------------------------
   Method: GET
   URL: /api/attendance
========================================================= */
router.get("/", async (req, res) => {
  try {
    const search = normalizeText(req.query.search);
    const className = normalizeText(req.query.class_name);
    const idSubject = toNumberOrNull(req.query.id_subject);
    const status = normalizeStatus(req.query.status);
    const date = buildDateFilter(req.query.date);

    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.max(Number(req.query.limit || 10), 1);
    const offset = (page - 1) * limit;

    if (status && !isValidAttendanceStatus(status)) {
      return res.status(400).json({
        message: "Trạng thái điểm danh không hợp lệ",
      });
    }

    const conditions = [
      "DATE(se.session_date) = ?",
      `
      (
        s.student_code LIKE ?
        OR s.full_name LIKE ?
        OR s.email LIKE ?
        OR s.class_name LIKE ?
        OR sub.subject_name LIKE ?
        OR cc.class_code LIKE ?
        OR r.room_code LIKE ?
      )
      `,
    ];

    const baseParams = [
      date,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
    ];

    if (className) {
      conditions.push("s.class_name = ?");
      baseParams.push(className);
    }

    if (idSubject) {
      conditions.push("sub.id_subject = ?");
      baseParams.push(idSubject);
    }

    if (status) {
      conditions.push("a.status = ?");
      baseParams.push(status);
    }

    const whereSql = `WHERE ${conditions.join(" AND ")}`;

    const baseJoin = `
      FROM attendance a

      INNER JOIN student s
        ON s.id_student = a.id_student

      INNER JOIN session se
        ON se.id_session = a.id_session

      INNER JOIN schedule sch
        ON sch.id_schedule = se.id_schedule

      INNER JOIN courseclass cc
        ON cc.id_course_class = sch.id_course_class

      INNER JOIN subject sub
        ON sub.id_subject = cc.id_subject

      INNER JOIN classroom r
        ON r.id_room = sch.id_room

      ${whereSql}
    `;

    const [countRows] = await db.query(
      `
      SELECT COUNT(*) AS total
      ${baseJoin}
      `,
      baseParams
    );

    const total = Number(countRows[0]?.total || 0);

    const [statsRows] = await db.query(
      `
      SELECT
        COUNT(*) AS total_attendance,

        SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END)
          AS present_count,

        SUM(CASE WHEN a.status = 'LATE' THEN 1 ELSE 0 END)
          AS late_count,

        SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END)
          AS absent_count,

        ROUND(
          (
            SUM(CASE WHEN a.status IN ('PRESENT', 'LATE') THEN 1 ELSE 0 END)
            / NULLIF(COUNT(*), 0)
          ) * 100,
          2
        ) AS attendance_rate

      ${baseJoin}
      `,
      baseParams
    );

    const [attendances] = await db.query(
      `
      SELECT
        a.id_attendance,
        a.id_session,
        a.id_student,
        a.check_in_time,
        a.status,
        a.confidence_score,
        a.face_image,
        a.note,

        s.student_code,
        s.full_name,
        s.class_name,
        s.faculty,
        s.email,
        s.phone,
        s.avatar,

        DATE_FORMAT(se.session_date, '%Y-%m-%d') AS session_date,
        se.session_number,
        se.status AS session_status,

        sch.start_time,
        sch.end_time,

        cc.id_course_class,
        cc.class_code,

        sub.id_subject,
        sub.subject_code,
        sub.subject_name,

        r.id_room,
        r.room_code,
        r.room_name,
        r.building,
        r.floor

      ${baseJoin}

      ORDER BY
        se.session_date DESC,
        sch.start_time ASC,
        s.full_name ASC

      LIMIT ? OFFSET ?
      `,
      [...baseParams, limit, offset]
    );

    return res.status(200).json({
      date,
      stats: statsRows[0] || {
        total_attendance: 0,
        present_count: 0,
        late_count: 0,
        absent_count: 0,
        attendance_rate: 0,
      },
      attendances,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách điểm danh:", error);
    return sendServerError(res, "Lỗi lấy danh sách điểm danh", error);
  }
});


/* =========================================================
   7. API: ĐIỂM DANH THỦ CÔNG
   ---------------------------------------------------------
   Method: POST
   URL: /api/attendance
========================================================= */
router.post("/", async (req, res) => {
  const idSession = toNumberOrNull(req.body.id_session);
  const idStudent = toNumberOrNull(req.body.id_student);
  const status = normalizeStatus(req.body.status);
  const checkInTime = req.body.check_in_time;
  const confidenceScore = toNumberOrNull(req.body.confidence_score);
  const faceImage = toNull(req.body.face_image);
  const note = toNull(req.body.note);

  if (!idSession || !idStudent || !status) {
    return res.status(400).json({
      message: "Vui lòng chọn buổi học, sinh viên và trạng thái điểm danh",
    });
  }

  if (!isValidAttendanceStatus(status)) {
    return res.status(400).json({
      message: "Trạng thái điểm danh không hợp lệ",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [sessions] = await connection.query(
      `
      SELECT id_session
      FROM session
      WHERE id_session = ?
      LIMIT 1
      `,
      [idSession]
    );

    if (sessions.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Buổi học không tồn tại",
      });
    }

    const [students] = await connection.query(
      `
      SELECT id_student
      FROM student
      WHERE id_student = ?
      LIMIT 1
      `,
      [idStudent]
    );

    if (students.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Sinh viên không tồn tại",
      });
    }

    const [existing] = await connection.query(
      `
      SELECT id_attendance
      FROM attendance
      WHERE id_session = ?
        AND id_student = ?
      LIMIT 1
      `,
      [idSession, idStudent]
    );

    if (existing.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Sinh viên này đã có bản ghi điểm danh trong buổi học này",
      });
    }

    const finalCheckInTime = getFinalCheckInTime(status, checkInTime);

    const [result] = await connection.query(
      `
      INSERT INTO attendance (
        id_session,
        id_student,
        check_in_time,
        status,
        confidence_score,
        face_image,
        note
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        idSession,
        idStudent,
        finalCheckInTime,
        status,
        confidenceScore,
        faceImage,
        note,
      ]
    );

    await connection.commit();

    return res.status(201).json({
      message: "Điểm danh thủ công thành công",
      id_attendance: result.insertId,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi điểm danh thủ công:", error);
    return sendServerError(res, "Lỗi điểm danh thủ công", error);
  } finally {
    connection.release();
  }
});


/* =========================================================
   8. API: CẬP NHẬT TRẠNG THÁI ĐIỂM DANH
   ---------------------------------------------------------
   Method: PUT
   URL: /api/attendance/:id
========================================================= */
router.put("/:id", async (req, res) => {
  const { id } = req.params;

  const status = normalizeStatus(req.body.status);
  const checkInTime = req.body.check_in_time;
  const confidenceScore = toNumberOrNull(req.body.confidence_score);
  const note = toNull(req.body.note);

  if (!status) {
    return res.status(400).json({
      message: "Vui lòng chọn trạng thái điểm danh",
    });
  }

  if (!isValidAttendanceStatus(status)) {
    return res.status(400).json({
      message: "Trạng thái điểm danh không hợp lệ",
    });
  }

  try {
    const [attendances] = await db.query(
      `
      SELECT id_attendance
      FROM attendance
      WHERE id_attendance = ?
      LIMIT 1
      `,
      [id]
    );

    if (attendances.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy bản ghi điểm danh",
      });
    }

    const finalCheckInTime = getFinalCheckInTime(status, checkInTime);

    await db.query(
      `
      UPDATE attendance
      SET
        status = ?,
        check_in_time = ?,
        confidence_score = ?,
        note = ?
      WHERE id_attendance = ?
      `,
      [status, finalCheckInTime, confidenceScore, note, id]
    );

    return res.status(200).json({
      message: "Cập nhật điểm danh thành công",
    });
  } catch (error) {
    console.error("Lỗi cập nhật điểm danh:", error);
    return sendServerError(res, "Lỗi cập nhật điểm danh", error);
  }
});


/* =========================================================
   9. API: XÓA BẢN GHI ĐIỂM DANH
   ---------------------------------------------------------
   Method: DELETE
   URL: /api/attendance/:id
========================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [attendances] = await db.query(
      `
      SELECT id_attendance
      FROM attendance
      WHERE id_attendance = ?
      LIMIT 1
      `,
      [id]
    );

    if (attendances.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy bản ghi điểm danh",
      });
    }

    await db.query(
      `
      DELETE FROM attendance
      WHERE id_attendance = ?
      `,
      [id]
    );

    return res.status(200).json({
      message: "Xóa điểm danh thành công",
    });
  } catch (error) {
    console.error("Lỗi xóa điểm danh:", error);
    return sendServerError(res, "Lỗi xóa điểm danh", error);
  }
});

export default router;