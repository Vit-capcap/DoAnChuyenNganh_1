// import express from "express";
// import db from "../config/db.js";

// const router = express.Router();

// /*
// |--------------------------------------------------------------------------
// | Helper: Chuẩn hóa phần trăm
// |--------------------------------------------------------------------------
// */
// function normalizePercent(value) {
//   const number = Number(value || 0);
//   return Number.isFinite(number) ? Number(number.toFixed(2)) : 0;
// }

// /*
// |--------------------------------------------------------------------------
// | Helper: Chuẩn hóa giới tính
// |--------------------------------------------------------------------------
// */
// function normalizeGender(gender) {
//   if (!gender) return null;

//   if (gender === "Nam") return "Male";
//   if (gender === "Nữ") return "Female";
//   if (gender === "Khác") return "Other";

//   return gender;
// }

// /*
// |--------------------------------------------------------------------------
// | Helper: Kiểm tra giới tính hợp lệ
// |--------------------------------------------------------------------------
// */
// function validateGender(gender) {
//   const validGenders = [
//     "Nam",
//     "Nữ",
//     "Khác",
//     "Male",
//     "Female",
//     "Other",
//     "",
//     null,
//     undefined,
//   ];

//   return validGenders.includes(gender);
// }

// /*
// |--------------------------------------------------------------------------
// | Helper: Kiểm tra trạng thái tài khoản
// |--------------------------------------------------------------------------
// */
// function validateAccountStatus(status) {
//   const validStatus = ["ACTIVE", "LOCKED", "", null, undefined];

//   return validStatus.includes(status);
// }

// /*
// |--------------------------------------------------------------------------
// | 1. API: Dashboard giáo viên
// |--------------------------------------------------------------------------
// | Method: GET
// | URL: /api/teachers/dashboard/:teacherId
// |--------------------------------------------------------------------------
// */
// router.get("/dashboard/:teacherId", async (req, res) => {
//   const { teacherId } = req.params;

//   if (!teacherId) {
//     return res.status(400).json({
//       message: "Thiếu teacherId",
//     });
//   }

//   try {
//     const [[teacher]] = await db.query(
//       `
//       SELECT
//         t.id_teacher,
//         t.teacher_code,
//         t.full_name,
//         t.gender,
//         t.date_of_birth,
//         t.phone,
//         t.email,
//         t.avatar,
//         t.department_id,
//         d.department_name
//       FROM Teacher t
//       LEFT JOIN Department d
//         ON t.department_id = d.id_department
//       WHERE t.id_teacher = ?
//       LIMIT 1
//       `,
//       [teacherId]
//     );

//     if (!teacher) {
//       return res.status(404).json({
//         message: "Không tìm thấy giáo viên",
//       });
//     }

//     const [[classStats]] = await db.query(
//       `
//       SELECT
//         COUNT(DISTINCT cc.id_course_class) AS totalClasses,
//         COUNT(DISTINCT cc.id_subject) AS totalSubjects
//       FROM CourseClass cc
//       WHERE cc.id_teacher = ?
//       `,
//       [teacherId]
//     );

//     const [[todayStats]] = await db.query(
//       `
//       SELECT
//         COUNT(DISTINCT s.id_schedule) AS todaySchedules,

//         COUNT(DISTINCT CASE
//           WHEN se.status = 'FINISHED' THEN se.id_session
//         END) AS completedToday,

//         COUNT(CASE
//           WHEN a.status = 'ABSENT' THEN 1
//         END) AS absentToday,

//         COUNT(a.id_attendance) AS totalAttendanceToday,

//         COUNT(CASE
//           WHEN a.status IN ('PRESENT', 'LATE') THEN 1
//         END) AS attendedToday

//       FROM CourseClass cc

//       LEFT JOIN Schedule s
//         ON s.id_course_class = cc.id_course_class
//        AND s.day_of_week = DAYNAME(CURDATE())
//        AND CURDATE() BETWEEN s.start_date AND s.end_date

//       LEFT JOIN Session se
//         ON se.id_schedule = s.id_schedule
//        AND se.session_date = CURDATE()

//       LEFT JOIN Attendance a
//         ON a.id_session = se.id_session

//       WHERE cc.id_teacher = ?
//       `,
//       [teacherId]
//     );

//     const [[allAttendanceStats]] = await db.query(
//       `
//       SELECT
//         COUNT(a.id_attendance) AS totalAttendance,

//         COUNT(CASE
//           WHEN a.status IN ('PRESENT', 'LATE') THEN 1
//         END) AS attendedCount

//       FROM CourseClass cc

//       LEFT JOIN Schedule s
//         ON s.id_course_class = cc.id_course_class

//       LEFT JOIN Session se
//         ON se.id_schedule = s.id_schedule

//       LEFT JOIN Attendance a
//         ON a.id_session = se.id_session

//       WHERE cc.id_teacher = ?
//       `,
//       [teacherId]
//     );

//     const [todaySchedule] = await db.query(
//       `
//       SELECT
//         s.id_schedule,
//         s.day_of_week,
//         s.start_time,
//         s.end_time,
//         s.start_date,
//         s.end_date,

//         se.id_session,
//         se.session_date,
//         se.session_number,
//         se.status AS session_status,

//         cc.id_course_class,
//         cc.class_code,
//         cc.semester,
//         cc.school_year,
//         cc.group_number,
//         cc.status AS course_status,

//         sub.id_subject,
//         sub.subject_code,
//         sub.subject_name,

//         cr.id_room,
//         cr.room_code,
//         cr.room_name,
//         cr.building,
//         cr.floor,

//         COUNT(DISTINCT e.id_student) AS totalStudents,

//         COUNT(DISTINCT CASE
//           WHEN a.status IN ('PRESENT', 'LATE') THEN a.id_student
//         END) AS attendedStudents,

//         COUNT(DISTINCT CASE
//           WHEN a.status = 'ABSENT' THEN a.id_student
//         END) AS absentStudents

//       FROM CourseClass cc

//       INNER JOIN Subject sub
//         ON cc.id_subject = sub.id_subject

//       INNER JOIN Schedule s
//         ON s.id_course_class = cc.id_course_class

//       LEFT JOIN ClassRoom cr
//         ON s.id_room = cr.id_room

//       LEFT JOIN Session se
//         ON se.id_schedule = s.id_schedule
//        AND se.session_date = CURDATE()

//       LEFT JOIN Enrollment e
//         ON e.id_course_class = cc.id_course_class
//        AND e.status = 'STUDYING'

//       LEFT JOIN Attendance a
//         ON a.id_session = se.id_session
//        AND a.id_student = e.id_student

//       WHERE cc.id_teacher = ?
//         AND s.day_of_week = DAYNAME(CURDATE())
//         AND CURDATE() BETWEEN s.start_date AND s.end_date

//       GROUP BY
//         s.id_schedule,
//         s.day_of_week,
//         s.start_time,
//         s.end_time,
//         s.start_date,
//         s.end_date,
//         se.id_session,
//         se.session_date,
//         se.session_number,
//         se.status,
//         cc.id_course_class,
//         cc.class_code,
//         cc.semester,
//         cc.school_year,
//         cc.group_number,
//         cc.status,
//         sub.id_subject,
//         sub.subject_code,
//         sub.subject_name,
//         cr.id_room,
//         cr.room_code,
//         cr.room_name,
//         cr.building,
//         cr.floor

//       ORDER BY s.start_time ASC
//       `,
//       [teacherId]
//     );

//     let displaySchedule = todaySchedule;

//     if (displaySchedule.length === 0) {
//       const [allSchedules] = await db.query(
//         `
//         SELECT
//           s.id_schedule,
//           s.day_of_week,
//           s.start_time,
//           s.end_time,
//           s.start_date,
//           s.end_date,

//           se.id_session,
//           se.session_date,
//           se.session_number,
//           se.status AS session_status,

//           cc.id_course_class,
//           cc.class_code,
//           cc.semester,
//           cc.school_year,
//           cc.group_number,
//           cc.status AS course_status,

//           sub.id_subject,
//           sub.subject_code,
//           sub.subject_name,

//           cr.id_room,
//           cr.room_code,
//           cr.room_name,
//           cr.building,
//           cr.floor,

//           COUNT(DISTINCT e.id_student) AS totalStudents,

//           COUNT(DISTINCT CASE
//             WHEN a.status IN ('PRESENT', 'LATE') THEN a.id_student
//           END) AS attendedStudents,

//           COUNT(DISTINCT CASE
//             WHEN a.status = 'ABSENT' THEN a.id_student
//           END) AS absentStudents

//         FROM CourseClass cc

//         INNER JOIN Subject sub
//           ON cc.id_subject = sub.id_subject

//         LEFT JOIN Schedule s
//           ON s.id_course_class = cc.id_course_class

//         LEFT JOIN ClassRoom cr
//           ON s.id_room = cr.id_room

//         LEFT JOIN Session se
//           ON se.id_schedule = s.id_schedule

//         LEFT JOIN Enrollment e
//           ON e.id_course_class = cc.id_course_class
//          AND e.status = 'STUDYING'

//         LEFT JOIN Attendance a
//           ON a.id_session = se.id_session
//          AND a.id_student = e.id_student

//         WHERE cc.id_teacher = ?

//         GROUP BY
//           s.id_schedule,
//           s.day_of_week,
//           s.start_time,
//           s.end_time,
//           s.start_date,
//           s.end_date,
//           se.id_session,
//           se.session_date,
//           se.session_number,
//           se.status,
//           cc.id_course_class,
//           cc.class_code,
//           cc.semester,
//           cc.school_year,
//           cc.group_number,
//           cc.status,
//           sub.id_subject,
//           sub.subject_code,
//           sub.subject_name,
//           cr.id_room,
//           cr.room_code,
//           cr.room_name,
//           cr.building,
//           cr.floor

//         ORDER BY
//           s.start_date DESC,
//           s.start_time ASC

//         LIMIT 5
//         `,
//         [teacherId]
//       );

//       displaySchedule = allSchedules;
//     }

//     const [weeklyTrend] = await db.query(
//       `
//       SELECT
//         DATE_FORMAT(se.session_date, '%Y-%m-%d') AS date,
//         DATE_FORMAT(se.session_date, '%d/%m') AS label,

//         COUNT(a.id_attendance) AS totalAttendance,

//         COUNT(CASE
//           WHEN a.status IN ('PRESENT', 'LATE') THEN 1
//         END) AS attendedCount,

//         ROUND(
//           CASE
//             WHEN COUNT(a.id_attendance) = 0 THEN 0
//             ELSE COUNT(CASE WHEN a.status IN ('PRESENT', 'LATE') THEN 1 END)
//                  / COUNT(a.id_attendance) * 100
//           END,
//           2
//         ) AS attendancePercent

//       FROM CourseClass cc

//       INNER JOIN Schedule s
//         ON s.id_course_class = cc.id_course_class

//       INNER JOIN Session se
//         ON se.id_schedule = s.id_schedule

//       LEFT JOIN Attendance a
//         ON a.id_session = se.id_session

//       WHERE cc.id_teacher = ?
//         AND se.session_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
//         AND se.session_date <= CURDATE()

//       GROUP BY se.session_date

//       ORDER BY se.session_date ASC
//       `,
//       [teacherId]
//     );

//     const [notifications] = await db.query(
//       `
//       SELECT
//         id_notification,
//         title,
//         content,
//         receiver_id,
//         receiver_role,
//         created_at,
//         is_read
//       FROM Notification
//       WHERE receiver_role = 'TEACHER'
//         AND (receiver_id = ? OR receiver_id IS NULL)
//       ORDER BY created_at DESC
//       LIMIT 5
//       `,
//       [teacherId]
//     );

//     const [topAbsentees] = await db.query(
//       `
//       SELECT
//         st.id_student,
//         st.student_code,
//         st.full_name,
//         st.class_name,
//         COUNT(a.id_attendance) AS absentCount

//       FROM CourseClass cc

//       INNER JOIN Schedule s
//         ON s.id_course_class = cc.id_course_class

//       INNER JOIN Session se
//         ON se.id_schedule = s.id_schedule

//       INNER JOIN Attendance a
//         ON a.id_session = se.id_session

//       INNER JOIN Student st
//         ON st.id_student = a.id_student

//       WHERE cc.id_teacher = ?
//         AND a.status = 'ABSENT'

//       GROUP BY
//         st.id_student,
//         st.student_code,
//         st.full_name,
//         st.class_name

//       ORDER BY absentCount DESC
//       LIMIT 5
//       `,
//       [teacherId]
//     );

//     const totalAttendance = Number(allAttendanceStats.totalAttendance || 0);
//     const attendedCount = Number(allAttendanceStats.attendedCount || 0);

//     const avgAttendancePercent =
//       totalAttendance > 0 ? (attendedCount / totalAttendance) * 100 : 0;

//     return res.status(200).json({
//       teacher,
//       stats: {
//         totalClasses: Number(classStats.totalClasses || 0),
//         totalSubjects: Number(classStats.totalSubjects || 0),

//         todaySchedules: Number(todayStats.todaySchedules || 0),
//         completedToday: Number(todayStats.completedToday || 0),
//         absentToday: Number(todayStats.absentToday || 0),

//         totalAttendanceToday: Number(todayStats.totalAttendanceToday || 0),
//         attendedToday: Number(todayStats.attendedToday || 0),

//         totalAttendance,
//         attendedCount,
//         avgAttendancePercent: normalizePercent(avgAttendancePercent),
//       },
//       todaySchedule: displaySchedule,
//       realTodaySchedule: todaySchedule,
//       weeklyTrend,
//       notifications,
//       topAbsentees,
//     });
//   } catch (error) {
//     console.error("Lỗi lấy dashboard giáo viên:", error);

//     return res.status(500).json({
//       message: "Lỗi lấy dashboard giáo viên",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | 2. API: Lấy lịch dạy giáo viên
// |--------------------------------------------------------------------------
// | Method: GET
// | URL: /api/teachers/schedule/:teacherId
// |--------------------------------------------------------------------------
// */
// router.get("/schedule/:teacherId", async (req, res) => {
//   const { teacherId } = req.params;
//   const { view = "week", subject = "", classCode = "" } = req.query;

//   if (!teacherId) {
//     return res.status(400).json({
//       message: "Thiếu teacherId",
//     });
//   }

//   try {
//     const [[teacher]] = await db.query(
//       `
//       SELECT
//         t.id_teacher,
//         t.teacher_code,
//         t.full_name,
//         t.gender,
//         t.email,
//         t.phone,
//         t.avatar,
//         t.department_id,
//         d.department_name
//       FROM Teacher t
//       LEFT JOIN Department d
//         ON t.department_id = d.id_department
//       WHERE t.id_teacher = ?
//       LIMIT 1
//       `,
//       [teacherId]
//     );

//     if (!teacher) {
//       return res.status(404).json({
//         message: "Không tìm thấy giáo viên",
//       });
//     }

//     const subjectFilter = subject ? `%${subject}%` : "%%";
//     const classFilter = classCode ? `%${classCode}%` : "%%";

//     const [schedules] = await db.query(
//       `
//       SELECT
//         s.id_schedule,
//         s.day_of_week,
//         s.start_time,
//         s.end_time,
//         s.start_date,
//         s.end_date,

//         cc.id_course_class,
//         cc.class_code,
//         cc.semester,
//         cc.school_year,
//         cc.group_number,
//         cc.status AS course_status,

//         sub.id_subject,
//         sub.subject_code,
//         sub.subject_name,
//         sub.credits,

//         cr.id_room,
//         cr.room_code,
//         cr.room_name,
//         cr.building,
//         cr.floor,

//         se.id_session,
//         se.session_date,
//         se.session_number,
//         se.status AS session_status,

//         COUNT(DISTINCT e.id_student) AS totalStudents,

//         COUNT(DISTINCT CASE
//           WHEN a.status IN ('PRESENT', 'LATE') THEN a.id_student
//         END) AS attendedStudents,

//         COUNT(DISTINCT CASE
//           WHEN a.status = 'ABSENT' THEN a.id_student
//         END) AS absentStudents

//       FROM CourseClass cc

//       INNER JOIN Subject sub
//         ON cc.id_subject = sub.id_subject

//       LEFT JOIN Schedule s
//         ON s.id_course_class = cc.id_course_class

//       LEFT JOIN ClassRoom cr
//         ON s.id_room = cr.id_room

//       LEFT JOIN Session se
//         ON se.id_schedule = s.id_schedule

//       LEFT JOIN Enrollment e
//         ON e.id_course_class = cc.id_course_class
//        AND e.status = 'STUDYING'

//       LEFT JOIN Attendance a
//         ON a.id_session = se.id_session
//        AND a.id_student = e.id_student

//       WHERE cc.id_teacher = ?
//         AND sub.subject_name LIKE ?
//         AND cc.class_code LIKE ?

//       GROUP BY
//         s.id_schedule,
//         s.day_of_week,
//         s.start_time,
//         s.end_time,
//         s.start_date,
//         s.end_date,
//         cc.id_course_class,
//         cc.class_code,
//         cc.semester,
//         cc.school_year,
//         cc.group_number,
//         cc.status,
//         sub.id_subject,
//         sub.subject_code,
//         sub.subject_name,
//         sub.credits,
//         cr.id_room,
//         cr.room_code,
//         cr.room_name,
//         cr.building,
//         cr.floor,
//         se.id_session,
//         se.session_date,
//         se.session_number,
//         se.status

//       ORDER BY
//         s.start_date DESC,
//         FIELD(
//           s.day_of_week,
//           'Monday',
//           'Tuesday',
//           'Wednesday',
//           'Thursday',
//           'Friday',
//           'Saturday',
//           'Sunday'
//         ),
//         s.start_time ASC
//       `,
//       [teacherId, subjectFilter, classFilter]
//     );

//     const [[weekStats]] = await db.query(
//       `
//       SELECT
//         COUNT(DISTINCT cc.id_course_class) AS totalClasses,
//         COUNT(DISTINCT sub.id_subject) AS totalSubjects,
//         COUNT(DISTINCT s.id_schedule) AS totalSchedules,

//         IFNULL(
//           SUM(
//             CASE
//               WHEN s.start_time IS NOT NULL AND s.end_time IS NOT NULL
//               THEN TIME_TO_SEC(TIMEDIFF(s.end_time, s.start_time)) / 3600
//               ELSE 0
//             END
//           ),
//           0
//         ) AS totalTeachingHours

//       FROM CourseClass cc

//       INNER JOIN Subject sub
//         ON cc.id_subject = sub.id_subject

//       LEFT JOIN Schedule s
//         ON s.id_course_class = cc.id_course_class

//       WHERE cc.id_teacher = ?
//       `,
//       [teacherId]
//     );

//     const [subjects] = await db.query(
//       `
//       SELECT DISTINCT
//         sub.id_subject,
//         sub.subject_code,
//         sub.subject_name
//       FROM CourseClass cc
//       INNER JOIN Subject sub
//         ON cc.id_subject = sub.id_subject
//       WHERE cc.id_teacher = ?
//       ORDER BY sub.subject_name ASC
//       `,
//       [teacherId]
//     );

//     const [classes] = await db.query(
//       `
//       SELECT DISTINCT
//         cc.id_course_class,
//         cc.class_code
//       FROM CourseClass cc
//       WHERE cc.id_teacher = ?
//       ORDER BY cc.class_code ASC
//       `,
//       [teacherId]
//     );

//     return res.status(200).json({
//       teacher,
//       view,
//       stats: {
//         totalClasses: Number(weekStats.totalClasses || 0),
//         totalSubjects: Number(weekStats.totalSubjects || 0),
//         totalSchedules: Number(weekStats.totalSchedules || 0),
//         totalTeachingHours: Number(weekStats.totalTeachingHours || 0).toFixed(
//           1
//         ),
//       },
//       subjects,
//       classes,
//       schedules,
//     });
//   } catch (error) {
//     console.error("Lỗi lấy lịch dạy giáo viên:", error);

//     return res.status(500).json({
//       message: "Lỗi lấy lịch dạy giáo viên",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | 3. API: Lấy chi tiết lớp học phần
// |--------------------------------------------------------------------------
// | Method: GET
// | URL: /api/teachers/classes/:courseClassId
// |--------------------------------------------------------------------------
// */
// router.get("/classes/:courseClassId", async (req, res) => {
//   try {
//     const { courseClassId } = req.params;

//     if (!courseClassId) {
//       return res.status(400).json({
//         message: "Thiếu mã lớp học phần",
//       });
//     }

//     const [rows] = await db.query(
//       `
//       SELECT 
//         cc.id_course_class,
//         cc.class_code,
//         cc.semester,
//         cc.school_year,
//         cc.group_number,
//         cc.max_student,
//         cc.status,

//         sub.id_subject,
//         sub.subject_code,
//         sub.subject_name,
//         sub.credits,

//         t.id_teacher,
//         t.full_name AS teacher_name,

//         MIN(cr.id_room) AS id_room,
//         MIN(cr.room_code) AS room_code,
//         MIN(cr.room_name) AS room_name,
//         MIN(cr.building) AS building,
//         MIN(cr.floor) AS floor,

//         COUNT(DISTINCT e.id_student) AS total_students,

//         COUNT(DISTINCT a.id_attendance) AS total_attendance,

//         COUNT(DISTINCT CASE
//           WHEN a.status IN ('PRESENT', 'LATE') THEN a.id_attendance
//         END) AS attended_count,

//         ROUND(
//           CASE
//             WHEN COUNT(DISTINCT a.id_attendance) = 0 THEN 0
//             ELSE COUNT(DISTINCT CASE
//               WHEN a.status IN ('PRESENT', 'LATE') THEN a.id_attendance
//             END) / COUNT(DISTINCT a.id_attendance) * 100
//           END,
//           2
//         ) AS attendance_percent

//       FROM CourseClass cc

//       INNER JOIN Subject sub
//         ON cc.id_subject = sub.id_subject

//       INNER JOIN Teacher t
//         ON cc.id_teacher = t.id_teacher

//       LEFT JOIN Schedule s
//         ON s.id_course_class = cc.id_course_class

//       LEFT JOIN ClassRoom cr
//         ON s.id_room = cr.id_room

//       LEFT JOIN Enrollment e
//         ON e.id_course_class = cc.id_course_class
//        AND e.status = 'STUDYING'

//       LEFT JOIN Session se
//         ON se.id_schedule = s.id_schedule

//       LEFT JOIN Attendance a
//         ON a.id_session = se.id_session
//        AND a.id_student = e.id_student

//       WHERE cc.id_course_class = ?

//       GROUP BY
//         cc.id_course_class,
//         cc.class_code,
//         cc.semester,
//         cc.school_year,
//         cc.group_number,
//         cc.max_student,
//         cc.status,
//         sub.id_subject,
//         sub.subject_code,
//         sub.subject_name,
//         sub.credits,
//         t.id_teacher,
//         t.full_name

//       LIMIT 1
//       `,
//       [courseClassId]
//     );

//     if (rows.length === 0) {
//       return res.status(404).json({
//         message: "Không tìm thấy lớp học phần",
//       });
//     }

//     return res.status(200).json({
//       classDetail: rows[0],
//     });
//   } catch (error) {
//     console.error("Lỗi lấy chi tiết lớp học:", error);

//     return res.status(500).json({
//       message: "Lỗi lấy chi tiết lớp học",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | 4. API: Lấy danh sách sinh viên trong lớp học phần
// |--------------------------------------------------------------------------
// | Method: GET
// | URL: /api/teachers/classes/:courseClassId/students
// |--------------------------------------------------------------------------
// */
// router.get("/classes/:courseClassId/students", async (req, res) => {
//   try {
//     const { courseClassId } = req.params;
//     const { search = "" } = req.query;

//     if (!courseClassId) {
//       return res.status(400).json({
//         message: "Thiếu mã lớp học phần",
//       });
//     }

//     const keyword = `%${search}%`;

//     const [students] = await db.query(
//       `
//       SELECT 
//         st.id_student,
//         st.student_code,
//         st.full_name,
//         st.gender,
//         st.date_of_birth,
//         st.phone,
//         st.email,
//         st.avatar,
//         st.faculty,
//         st.class_name,
//         st.course_year,
//         st.status,

//         e.id_enrollment,
//         e.enroll_date,
//         e.status AS enrollment_status,

//         MAX(fd.id_face) AS id_face,
//         MAX(fd.face_image) AS face_image,
//         MAX(fd.model_version) AS model_version,

//         COUNT(DISTINCT a.id_attendance) AS total_attendance,

//         COUNT(DISTINCT CASE
//           WHEN a.status = 'PRESENT' THEN a.id_attendance
//         END) AS present_count,

//         COUNT(DISTINCT CASE
//           WHEN a.status = 'LATE' THEN a.id_attendance
//         END) AS late_count,

//         COUNT(DISTINCT CASE
//           WHEN a.status = 'ABSENT' THEN a.id_attendance
//         END) AS absent_count,

//         ROUND(
//           CASE
//             WHEN COUNT(DISTINCT a.id_attendance) = 0 THEN 0
//             ELSE COUNT(DISTINCT CASE
//               WHEN a.status IN ('PRESENT', 'LATE') THEN a.id_attendance
//             END) / COUNT(DISTINCT a.id_attendance) * 100
//           END,
//           2
//         ) AS attendance_percent

//       FROM Enrollment e

//       INNER JOIN Student st
//         ON e.id_student = st.id_student

//       LEFT JOIN FaceData fd
//         ON fd.id_student = st.id_student

//       LEFT JOIN CourseClass cc
//         ON e.id_course_class = cc.id_course_class

//       LEFT JOIN Schedule s
//         ON s.id_course_class = cc.id_course_class

//       LEFT JOIN Session se
//         ON se.id_schedule = s.id_schedule

//       LEFT JOIN Attendance a
//         ON a.id_session = se.id_session
//        AND a.id_student = st.id_student

//       WHERE e.id_course_class = ?
//         AND e.status = 'STUDYING'
//         AND (
//           st.student_code LIKE ?
//           OR st.full_name LIKE ?
//           OR st.email LIKE ?
//           OR st.class_name LIKE ?
//         )

//       GROUP BY
//         st.id_student,
//         st.student_code,
//         st.full_name,
//         st.gender,
//         st.date_of_birth,
//         st.phone,
//         st.email,
//         st.avatar,
//         st.faculty,
//         st.class_name,
//         st.course_year,
//         st.status,
//         e.id_enrollment,
//         e.enroll_date,
//         e.status

//       ORDER BY st.student_code ASC
//       `,
//       [courseClassId, keyword, keyword, keyword, keyword]
//     );

//     return res.status(200).json({
//       students,
//     });
//   } catch (error) {
//     console.error("Lỗi lấy sinh viên trong lớp:", error);

//     return res.status(500).json({
//       message: "Lỗi lấy danh sách sinh viên trong lớp",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | 5. API: Lấy lịch học của lớp học phần
// |--------------------------------------------------------------------------
// | Method: GET
// | URL: /api/teachers/classes/:courseClassId/schedules
// |--------------------------------------------------------------------------
// */
// router.get("/classes/:courseClassId/schedules", async (req, res) => {
//   try {
//     const { courseClassId } = req.params;

//     if (!courseClassId) {
//       return res.status(400).json({
//         message: "Thiếu mã lớp học phần",
//       });
//     }

//     const [schedules] = await db.query(
//       `
//       SELECT
//         s.id_schedule,
//         s.id_course_class,
//         s.id_room,
//         s.day_of_week,
//         s.start_time,
//         s.end_time,
//         s.start_date,
//         s.end_date,

//         cr.room_code,
//         cr.room_name,
//         cr.building,
//         cr.floor

//       FROM Schedule s

//       LEFT JOIN ClassRoom cr
//         ON s.id_room = cr.id_room

//       WHERE s.id_course_class = ?

//       ORDER BY
//         FIELD(
//           s.day_of_week,
//           'Monday',
//           'Tuesday',
//           'Wednesday',
//           'Thursday',
//           'Friday',
//           'Saturday',
//           'Sunday'
//         ),
//         s.start_time ASC
//       `,
//       [courseClassId]
//     );

//     return res.status(200).json({
//       schedules,
//     });
//   } catch (error) {
//     console.error("Lỗi lấy lịch học của lớp:", error);

//     return res.status(500).json({
//       message: "Lỗi lấy lịch học của lớp",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | 6. API: Lấy danh sách buổi học của lớp học phần
// |--------------------------------------------------------------------------
// | Method: GET
// | URL: /api/teachers/classes/:courseClassId/sessions
// |--------------------------------------------------------------------------
// */
// router.get("/classes/:courseClassId/sessions", async (req, res) => {
//   try {
//     const { courseClassId } = req.params;

//     if (!courseClassId) {
//       return res.status(400).json({
//         message: "Thiếu mã lớp học phần",
//       });
//     }

//     const [sessions] = await db.query(
//       `
//       SELECT
//         se.id_session,
//         se.id_schedule,
//         se.session_date,
//         se.session_number,
//         se.status AS session_status,

//         s.day_of_week,
//         s.start_time,
//         s.end_time,

//         cc.id_course_class,
//         cc.class_code,

//         sub.id_subject,
//         sub.subject_code,
//         sub.subject_name,

//         cr.id_room,
//         cr.room_code,
//         cr.room_name,

//         COUNT(DISTINCT e.id_student) AS totalStudents,

//         COUNT(DISTINCT CASE
//           WHEN a.status IN ('PRESENT', 'LATE') THEN a.id_student
//         END) AS attendedStudents,

//         COUNT(DISTINCT CASE
//           WHEN a.status = 'PRESENT' THEN a.id_student
//         END) AS present_count,

//         COUNT(DISTINCT CASE
//           WHEN a.status = 'LATE' THEN a.id_student
//         END) AS late_count,

//         COUNT(DISTINCT CASE
//           WHEN a.status = 'ABSENT' THEN a.id_student
//         END) AS absent_count

//       FROM Session se

//       INNER JOIN Schedule s
//         ON se.id_schedule = s.id_schedule

//       INNER JOIN CourseClass cc
//         ON s.id_course_class = cc.id_course_class

//       INNER JOIN Subject sub
//         ON cc.id_subject = sub.id_subject

//       LEFT JOIN ClassRoom cr
//         ON s.id_room = cr.id_room

//       LEFT JOIN Enrollment e
//         ON e.id_course_class = cc.id_course_class
//        AND e.status = 'STUDYING'

//       LEFT JOIN Attendance a
//         ON a.id_session = se.id_session
//        AND a.id_student = e.id_student

//       WHERE cc.id_course_class = ?

//       GROUP BY
//         se.id_session,
//         se.id_schedule,
//         se.session_date,
//         se.session_number,
//         se.status,
//         s.day_of_week,
//         s.start_time,
//         s.end_time,
//         cc.id_course_class,
//         cc.class_code,
//         sub.id_subject,
//         sub.subject_code,
//         sub.subject_name,
//         cr.id_room,
//         cr.room_code,
//         cr.room_name

//       ORDER BY se.session_date DESC, s.start_time ASC
//       `,
//       [courseClassId]
//     );

//     return res.status(200).json({
//       sessions,
//     });
//   } catch (error) {
//     console.error("Lỗi lấy danh sách buổi học:", error);

//     return res.status(500).json({
//       message: "Lỗi lấy danh sách buổi học",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | 7. API: Tạo buổi học từ lịch học
// |--------------------------------------------------------------------------
// | Method: POST
// | URL: /api/teachers/sessions
// |--------------------------------------------------------------------------
// | Body:
// | {
// |   id_schedule,
// |   session_date,
// |   session_number
// | }
// |--------------------------------------------------------------------------
// | Ghi chú:
// | - Tạo bản ghi trong bảng Session
// | - Tự tạo Attendance mặc định ABSENT cho sinh viên đang học trong lớp
// |--------------------------------------------------------------------------
// */
// router.post("/sessions", async (req, res) => {
//   const { id_schedule, session_date, session_number } = req.body;

//   if (!id_schedule || !session_date) {
//     return res.status(400).json({
//       message: "Thiếu id_schedule hoặc session_date",
//     });
//   }

//   const connection = await db.getConnection();

//   try {
//     await connection.beginTransaction();

//     const [[schedule]] = await connection.query(
//       `
//       SELECT
//         s.id_schedule,
//         s.id_course_class,
//         cc.class_code
//       FROM Schedule s
//       INNER JOIN CourseClass cc
//         ON s.id_course_class = cc.id_course_class
//       WHERE s.id_schedule = ?
//       LIMIT 1
//       `,
//       [id_schedule]
//     );

//     if (!schedule) {
//       await connection.rollback();

//       return res.status(404).json({
//         message: "Không tìm thấy lịch học",
//       });
//     }

//     const [existingSessions] = await connection.query(
//       `
//       SELECT id_session
//       FROM Session
//       WHERE id_schedule = ?
//         AND session_date = ?
//       LIMIT 1
//       `,
//       [id_schedule, session_date]
//     );

//     if (existingSessions.length > 0) {
//       await connection.rollback();

//       return res.status(409).json({
//         message: "Buổi học này đã tồn tại",
//         id_session: existingSessions[0].id_session,
//       });
//     }

//     const [sessionResult] = await connection.query(
//       `
//       INSERT INTO Session (
//         id_schedule,
//         session_date,
//         session_number,
//         status
//       )
//       VALUES (?, ?, ?, 'NOT_STARTED')
//       `,
//       [id_schedule, session_date, session_number || 1]
//     );

//     const sessionId = sessionResult.insertId;

//     await connection.query(
//       `
//       INSERT INTO Attendance (
//         id_session,
//         id_student,
//         status,
//         check_in_time,
//         note
//       )
//       SELECT
//         ? AS id_session,
//         e.id_student,
//         'ABSENT' AS status,
//         NULL AS check_in_time,
//         NULL AS note
//       FROM Enrollment e
//       WHERE e.id_course_class = ?
//         AND e.status = 'STUDYING'
//       `,
//       [sessionId, schedule.id_course_class]
//     );

//     await connection.commit();

//     return res.status(201).json({
//       message: "Tạo buổi học thành công",
//       id_session: sessionId,
//     });
//   } catch (error) {
//     await connection.rollback();

//     console.error("Lỗi tạo buổi học:", error);

//     return res.status(500).json({
//       message: "Lỗi tạo buổi học",
//       error: error.message,
//       code: error.code,
//     });
//   } finally {
//     connection.release();
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | 8. API: Lấy chi tiết buổi học
// |--------------------------------------------------------------------------
// | Method: GET
// | URL: /api/teachers/sessions/:sessionId
// |--------------------------------------------------------------------------
// | API này sửa lỗi:
// | Backend không trả về JSON. URL: /api/teachers/sessions/527 | Status: 404
// |--------------------------------------------------------------------------
// */
// router.get("/sessions/:sessionId", async (req, res) => {
//   try {
//     const { sessionId } = req.params;

//     if (!sessionId) {
//       return res.status(400).json({
//         message: "Thiếu mã buổi học",
//       });
//     }

//     const [rows] = await db.query(
//       `
//       SELECT
//         se.id_session,
//         se.id_schedule,
//         se.session_date,
//         se.session_number,
//         se.status,

//         s.day_of_week,
//         s.start_time,
//         s.end_time,
//         s.start_date,
//         s.end_date,

//         cc.id_course_class,
//         cc.class_code,
//         cc.semester,
//         cc.school_year,
//         cc.group_number,
//         cc.status AS course_status,

//         sub.id_subject,
//         sub.subject_code,
//         sub.subject_name,
//         sub.credits,

//         t.id_teacher,
//         t.full_name AS teacher_name,

//         cr.id_room,
//         cr.room_code,
//         cr.room_name,
//         cr.building,
//         cr.floor

//       FROM Session se

//       INNER JOIN Schedule s
//         ON se.id_schedule = s.id_schedule

//       INNER JOIN CourseClass cc
//         ON s.id_course_class = cc.id_course_class

//       INNER JOIN Subject sub
//         ON cc.id_subject = sub.id_subject

//       INNER JOIN Teacher t
//         ON cc.id_teacher = t.id_teacher

//       LEFT JOIN ClassRoom cr
//         ON s.id_room = cr.id_room

//       WHERE se.id_session = ?

//       LIMIT 1
//       `,
//       [sessionId]
//     );

//     if (rows.length === 0) {
//       return res.status(404).json({
//         message: "Không tìm thấy buổi học",
//       });
//     }

//     return res.status(200).json({
//       session: rows[0],
//     });
//   } catch (error) {
//     console.error("Lỗi lấy chi tiết buổi học:", error);

//     return res.status(500).json({
//       message: "Lỗi lấy chi tiết buổi học",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | 9. API: Cập nhật trạng thái buổi học
// |--------------------------------------------------------------------------
// | Method: PUT
// | URL: /api/teachers/sessions/:sessionId/status
// |--------------------------------------------------------------------------
// */
// router.put("/sessions/:sessionId/status", async (req, res) => {
//   try {
//     const { sessionId } = req.params;
//     const { status } = req.body;

//     const validStatus = ["NOT_STARTED", "ONGOING", "FINISHED"];

//     if (!sessionId) {
//       return res.status(400).json({
//         message: "Thiếu mã buổi học",
//       });
//     }

//     if (!validStatus.includes(status)) {
//       return res.status(400).json({
//         message: "Trạng thái buổi học không hợp lệ",
//       });
//     }

//     const [result] = await db.query(
//       `
//       UPDATE Session
//       SET status = ?
//       WHERE id_session = ?
//       `,
//       [status, sessionId]
//     );

//     if (result.affectedRows === 0) {
//       return res.status(404).json({
//         message: "Không tìm thấy buổi học",
//       });
//     }

//     return res.status(200).json({
//       message: "Cập nhật trạng thái buổi học thành công",
//     });
//   } catch (error) {
//     console.error("Lỗi cập nhật trạng thái buổi học:", error);

//     return res.status(500).json({
//       message: "Lỗi cập nhật trạng thái buổi học",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | 10. API: Lấy danh sách điểm danh theo buổi học
// |--------------------------------------------------------------------------
// | Method: GET
// | URL: /api/teachers/sessions/:sessionId/attendance
// |--------------------------------------------------------------------------
// */
// router.get("/sessions/:sessionId/attendance", async (req, res) => {
//   try {
//     const { sessionId } = req.params;

//     if (!sessionId) {
//       return res.status(400).json({
//         message: "Thiếu mã buổi học",
//       });
//     }

//     const [attendances] = await db.query(
//       `
//       SELECT
//         a.id_attendance,
//         a.id_session,
//         a.id_student,
//         a.status,
//         a.check_in_time,
//         a.note,

//         st.student_code,
//         st.full_name,
//         st.email,
//         st.phone,
//         st.avatar,
//         st.class_name,
//         st.faculty,
//         st.course_year,

//         MAX(fd.id_face) AS id_face,
//         MAX(fd.face_image) AS face_image,
//         MAX(fd.model_version) AS model_version

//       FROM Attendance a

//       INNER JOIN Student st
//         ON a.id_student = st.id_student

//       LEFT JOIN FaceData fd
//         ON fd.id_student = st.id_student

//       WHERE a.id_session = ?

//       GROUP BY
//         a.id_attendance,
//         a.id_session,
//         a.id_student,
//         a.status,
//         a.check_in_time,
//         a.note,
//         st.student_code,
//         st.full_name,
//         st.email,
//         st.phone,
//         st.avatar,
//         st.class_name,
//         st.faculty,
//         st.course_year

//       ORDER BY st.student_code ASC
//       `,
//       [sessionId]
//     );

//     return res.status(200).json({
//       attendances,
//     });
//   } catch (error) {
//     console.error("Lỗi lấy danh sách điểm danh:", error);

//     return res.status(500).json({
//       message: "Lỗi lấy danh sách điểm danh",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | 11. API: Cập nhật điểm danh 1 sinh viên
// |--------------------------------------------------------------------------
// | Method: PUT
// | URL: /api/teachers/attendance/:attendanceId
// |--------------------------------------------------------------------------
// */
// router.put("/attendance/:attendanceId", async (req, res) => {
//   try {
//     const { attendanceId } = req.params;
//     const { status, check_in_time, note } = req.body;

//     const validStatus = ["PRESENT", "ABSENT", "LATE"];

//     if (!attendanceId) {
//       return res.status(400).json({
//         message: "Thiếu mã điểm danh",
//       });
//     }

//     if (!validStatus.includes(status)) {
//       return res.status(400).json({
//         message: "Trạng thái điểm danh không hợp lệ",
//       });
//     }

//     const finalCheckInTime =
//       status === "PRESENT" || status === "LATE" ? check_in_time || null : null;

//     const [result] = await db.query(
//       `
//       UPDATE Attendance
//       SET
//         status = ?,
//         check_in_time = ?,
//         note = ?
//       WHERE id_attendance = ?
//       `,
//       [status, finalCheckInTime, note || null, attendanceId]
//     );

//     if (result.affectedRows === 0) {
//       return res.status(404).json({
//         message: "Không tìm thấy bản ghi điểm danh",
//       });
//     }

//     return res.status(200).json({
//       message: "Cập nhật điểm danh thành công",
//     });
//   } catch (error) {
//     console.error("Lỗi cập nhật điểm danh:", error);

//     return res.status(500).json({
//       message: "Lỗi cập nhật điểm danh",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | 12. API: Cập nhật điểm danh hàng loạt
// |--------------------------------------------------------------------------
// | Method: PUT
// | URL: /api/teachers/sessions/:sessionId/attendance/bulk
// |--------------------------------------------------------------------------
// */
// router.put("/sessions/:sessionId/attendance/bulk", async (req, res) => {
//   const { sessionId } = req.params;
//   const { attendances = [] } = req.body;

//   if (!sessionId) {
//     return res.status(400).json({
//       message: "Thiếu mã buổi học",
//     });
//   }

//   if (!Array.isArray(attendances)) {
//     return res.status(400).json({
//       message: "Dữ liệu điểm danh phải là mảng",
//     });
//   }

//   const connection = await db.getConnection();

//   try {
//     await connection.beginTransaction();

//     for (const item of attendances) {
//       const attendanceId = item.id_attendance || item.idAttendance;
//       const studentId = item.id_student || item.idStudent;
//       const status = item.status || "ABSENT";
//       const note = item.note || null;

//       const validStatus = ["PRESENT", "ABSENT", "LATE"];

//       if (!validStatus.includes(status)) {
//         await connection.rollback();

//         return res.status(400).json({
//           message: `Trạng thái điểm danh không hợp lệ: ${status}`,
//         });
//       }

//       const checkInTime =
//         status === "PRESENT" || status === "LATE"
//           ? item.check_in_time || item.checkInTime || null
//           : null;

//       if (attendanceId) {
//         await connection.query(
//           `
//           UPDATE Attendance
//           SET
//             status = ?,
//             check_in_time = ?,
//             note = ?
//           WHERE id_attendance = ?
//             AND id_session = ?
//           `,
//           [status, checkInTime, note, attendanceId, sessionId]
//         );
//       } else if (studentId) {
//         await connection.query(
//           `
//           INSERT INTO Attendance (
//             id_session,
//             id_student,
//             status,
//             check_in_time,
//             note
//           )
//           VALUES (?, ?, ?, ?, ?)
//           ON DUPLICATE KEY UPDATE
//             status = VALUES(status),
//             check_in_time = VALUES(check_in_time),
//             note = VALUES(note)
//           `,
//           [sessionId, studentId, status, checkInTime, note]
//         );
//       }
//     }

//     await connection.commit();

//     return res.status(200).json({
//       message: "Cập nhật điểm danh hàng loạt thành công",
//     });
//   } catch (error) {
//     await connection.rollback();

//     console.error("Lỗi cập nhật điểm danh hàng loạt:", error);

//     return res.status(500).json({
//       message: "Lỗi cập nhật điểm danh hàng loạt",
//       error: error.message,
//       code: error.code,
//     });
//   } finally {
//     connection.release();
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | 13. API: Báo cáo điểm danh theo buổi học
// |--------------------------------------------------------------------------
// | Method: GET
// | URL: /api/teachers/sessions/:sessionId/attendance/report
// |--------------------------------------------------------------------------
// */
// router.get("/sessions/:sessionId/attendance/report", async (req, res) => {
//   try {
//     const { sessionId } = req.params;

//     if (!sessionId) {
//       return res.status(400).json({
//         message: "Thiếu mã buổi học",
//       });
//     }

//     const [[summary]] = await db.query(
//       `
//       SELECT
//         COUNT(*) AS total,
//         COUNT(CASE WHEN status = 'PRESENT' THEN 1 END) AS present,
//         COUNT(CASE WHEN status = 'LATE' THEN 1 END) AS late,
//         COUNT(CASE WHEN status = 'ABSENT' THEN 1 END) AS absent
//       FROM Attendance
//       WHERE id_session = ?
//       `,
//       [sessionId]
//     );

//     const [attendances] = await db.query(
//       `
//       SELECT
//         a.id_attendance,
//         a.id_session,
//         a.id_student,
//         a.status,
//         a.check_in_time,
//         a.note,

//         st.student_code,
//         st.full_name,
//         st.email,
//         st.class_name

//       FROM Attendance a

//       INNER JOIN Student st
//         ON a.id_student = st.id_student

//       WHERE a.id_session = ?

//       ORDER BY st.student_code ASC
//       `,
//       [sessionId]
//     );

//     const total = Number(summary.total || 0);
//     const attended = Number(summary.present || 0) + Number(summary.late || 0);

//     return res.status(200).json({
//       summary: {
//         total,
//         present: Number(summary.present || 0),
//         late: Number(summary.late || 0),
//         absent: Number(summary.absent || 0),
//         attendancePercent: normalizePercent(
//           total > 0 ? (attended / total) * 100 : 0
//         ),
//       },
//       attendances,
//     });
//   } catch (error) {
//     console.error("Lỗi lấy báo cáo điểm danh:", error);

//     return res.status(500).json({
//       message: "Lỗi lấy báo cáo điểm danh",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | 14. API: Lịch sử nhận diện theo buổi học
// |--------------------------------------------------------------------------
// | Method: GET
// | URL: /api/teachers/sessions/:sessionId/recognition-history
// |--------------------------------------------------------------------------
// */
// router.get("/sessions/:sessionId/recognition-history", async (req, res) => {
//   try {
//     const { sessionId } = req.params;

//     if (!sessionId) {
//       return res.status(400).json({
//         message: "Thiếu mã buổi học",
//       });
//     }

//     const [history] = await db.query(
//       `
//       SELECT
//         rh.id_history,
//         rh.id_student,
//         rh.camera_id,
//         rh.recognized_at,
//         rh.confidence,
//         rh.status,

//         st.student_code,
//         st.full_name,

//         c.camera_code,
//         c.location

//       FROM RecognitionHistory rh

//       LEFT JOIN Student st
//         ON rh.id_student = st.id_student

//       LEFT JOIN CameraDevice c
//         ON rh.camera_id = c.id_camera

//       WHERE rh.id_session = ?

//       ORDER BY rh.recognized_at DESC
//       `,
//       [sessionId]
//     );

//     return res.status(200).json({
//       history,
//     });
//   } catch (error) {
//     console.error("Lỗi lấy lịch sử nhận diện:", error);

//     return res.status(500).json({
//       message: "Lỗi lấy lịch sử nhận diện",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | 15. API: Lấy danh sách giáo viên
// |--------------------------------------------------------------------------
// | Method: GET
// | URL: /api/teachers
// |--------------------------------------------------------------------------
// */
// router.get("/", async (req, res) => {
//   try {
//     const search = req.query.search || "";

//     const [teachers] = await db.query(
//       `
//       SELECT
//         t.id_teacher,
//         t.teacher_code,
//         t.full_name,
//         t.gender,
//         t.date_of_birth,
//         t.phone,
//         t.email,
//         t.avatar,
//         t.department_id,

//         d.id_department,
//         d.department_name,

//         a.id_account,
//         a.username,
//         a.role,
//         a.status AS account_status,

//         t.created_at,
//         t.updated_at,

//         CASE
//           WHEN a.status = 'ACTIVE' THEN 'Đang hoạt động'
//           WHEN a.status = 'LOCKED' THEN 'Đã khóa'
//           ELSE 'Chưa có tài khoản'
//         END AS work_status,

//         CASE
//           WHEN a.status = 'ACTIVE' THEN 'active'
//           WHEN a.status = 'LOCKED' THEN 'locked'
//           ELSE 'inactive'
//         END AS status_type

//       FROM Teacher t

//       LEFT JOIN Department d
//         ON t.department_id = d.id_department

//       LEFT JOIN Account a
//         ON a.teacher_id = t.id_teacher

//       WHERE
//         t.full_name LIKE ?
//         OR t.teacher_code LIKE ?
//         OR t.email LIKE ?
//         OR t.phone LIKE ?
//         OR d.department_name LIKE ?

//       ORDER BY t.id_teacher DESC
//       `,
//       [
//         `%${search}%`,
//         `%${search}%`,
//         `%${search}%`,
//         `%${search}%`,
//         `%${search}%`,
//       ]
//     );

//     return res.status(200).json(teachers);
//   } catch (error) {
//     console.error("Lỗi lấy danh sách giáo viên:", error);

//     return res.status(500).json({
//       message: "Lỗi lấy danh sách giáo viên",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | 16. API: Thêm giáo viên
// |--------------------------------------------------------------------------
// | Method: POST
// | URL: /api/teachers
// |--------------------------------------------------------------------------
// */
// router.post("/", async (req, res) => {
//   const {
//     teacher_code,
//     full_name,
//     gender,
//     date_of_birth,
//     phone,
//     email,
//     avatar,
//     password,
//     department_id,
//     account_status,
//   } = req.body;

//   if (!teacher_code || !full_name || !email || !phone || !password) {
//     return res.status(400).json({
//       message:
//         "Vui lòng nhập đầy đủ mã giáo viên, họ tên, email, số điện thoại và mật khẩu",
//     });
//   }

//   if (!department_id) {
//     return res.status(400).json({
//       message: "Vui lòng chọn khoa/bộ môn",
//     });
//   }

//   if (!validateGender(gender)) {
//     return res.status(400).json({
//       message: "Giới tính không hợp lệ",
//     });
//   }

//   if (!validateAccountStatus(account_status)) {
//     return res.status(400).json({
//       message: "Trạng thái tài khoản không hợp lệ",
//     });
//   }

//   const connection = await db.getConnection();

//   try {
//     await connection.beginTransaction();

//     const [departments] = await connection.query(
//       `
//       SELECT id_department
//       FROM Department
//       WHERE id_department = ?
//       LIMIT 1
//       `,
//       [Number(department_id)]
//     );

//     if (departments.length === 0) {
//       await connection.rollback();

//       return res.status(404).json({
//         message: "Khoa/bộ môn không tồn tại",
//       });
//     }

//     const [existingTeachers] = await connection.query(
//       `
//       SELECT id_teacher
//       FROM Teacher
//       WHERE teacher_code = ? OR email = ?
//       LIMIT 1
//       `,
//       [teacher_code.trim(), email.trim()]
//     );

//     if (existingTeachers.length > 0) {
//       await connection.rollback();

//       return res.status(409).json({
//         message: "Mã giáo viên hoặc email đã tồn tại",
//       });
//     }

//     const [existingAccounts] = await connection.query(
//       `
//       SELECT id_account
//       FROM Account
//       WHERE username = ?
//       LIMIT 1
//       `,
//       [email.trim()]
//     );

//     if (existingAccounts.length > 0) {
//       await connection.rollback();

//       return res.status(409).json({
//         message: "Tài khoản giáo viên đã tồn tại",
//       });
//     }

//     const [teacherResult] = await connection.query(
//       `
//       INSERT INTO Teacher (
//         teacher_code,
//         full_name,
//         gender,
//         date_of_birth,
//         phone,
//         email,
//         avatar,
//         password,
//         department_id
//       )
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//       `,
//       [
//         teacher_code.trim(),
//         full_name.trim(),
//         normalizeGender(gender),
//         date_of_birth || null,
//         phone.trim(),
//         email.trim(),
//         avatar || null,
//         password,
//         Number(department_id),
//       ]
//     );

//     const teacherId = teacherResult.insertId;

//     await connection.query(
//       `
//       INSERT INTO Account (
//         username,
//         password,
//         role,
//         teacher_id,
//         student_id,
//         status
//       )
//       VALUES (?, ?, 'TEACHER', ?, NULL, ?)
//       `,
//       [email.trim(), password, teacherId, account_status || "ACTIVE"]
//     );

//     await connection.commit();

//     return res.status(201).json({
//       message: "Thêm giáo viên thành công",
//       id_teacher: teacherId,
//     });
//   } catch (error) {
//     await connection.rollback();

//     console.error("Lỗi thêm giáo viên:", error);

//     if (error.code === "ER_DUP_ENTRY") {
//       return res.status(409).json({
//         message: "Mã giáo viên, email hoặc tài khoản đã tồn tại",
//         error: error.message,
//         code: error.code,
//       });
//     }

//     if (error.code === "ER_DATA_TOO_LONG") {
//       return res.status(400).json({
//         message:
//           "Dữ liệu quá dài. Có thể avatar dạng Base64 vượt quá giới hạn cột trong MySQL.",
//         error: error.message,
//         code: error.code,
//       });
//     }

//     return res.status(500).json({
//       message: "Lỗi thêm giáo viên",
//       error: error.message,
//       code: error.code,
//     });
//   } finally {
//     connection.release();
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | 17. API: Lấy chi tiết giáo viên
// |--------------------------------------------------------------------------
// | Method: GET
// | URL: /api/teachers/:id
// |--------------------------------------------------------------------------
// | Lưu ý:
// | - Route này phải đặt gần cuối file
// | - Không đặt trên /classes hoặc /sessions
// |--------------------------------------------------------------------------
// */
// router.get("/:id", async (req, res) => {
//   try {
//     const { id } = req.params;

//     const [teachers] = await db.query(
//       `
//       SELECT
//         t.id_teacher,
//         t.teacher_code,
//         t.full_name,
//         t.gender,
//         t.date_of_birth,
//         t.phone,
//         t.email,
//         t.avatar,
//         t.department_id,

//         d.id_department,
//         d.department_name,

//         a.id_account,
//         a.username,
//         a.role,
//         a.status AS account_status,

//         t.created_at,
//         t.updated_at,

//         CASE
//           WHEN a.status = 'ACTIVE' THEN 'Đang hoạt động'
//           WHEN a.status = 'LOCKED' THEN 'Đã khóa'
//           ELSE 'Chưa có tài khoản'
//         END AS work_status,

//         CASE
//           WHEN a.status = 'ACTIVE' THEN 'active'
//           WHEN a.status = 'LOCKED' THEN 'locked'
//           ELSE 'inactive'
//         END AS status_type

//       FROM Teacher t

//       LEFT JOIN Department d
//         ON t.department_id = d.id_department

//       LEFT JOIN Account a
//         ON a.teacher_id = t.id_teacher

//       WHERE t.id_teacher = ?
//       `,
//       [id]
//     );

//     if (teachers.length === 0) {
//       return res.status(404).json({
//         message: "Không tìm thấy giáo viên",
//       });
//     }

//     return res.status(200).json(teachers[0]);
//   } catch (error) {
//     console.error("Lỗi lấy chi tiết giáo viên:", error);

//     return res.status(500).json({
//       message: "Lỗi lấy chi tiết giáo viên",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | 18. API: Cập nhật giáo viên
// |--------------------------------------------------------------------------
// | Method: PUT
// | URL: /api/teachers/:id
// |--------------------------------------------------------------------------
// */
// router.put("/:id", async (req, res) => {
//   const { id } = req.params;

//   const {
//     teacher_code,
//     full_name,
//     gender,
//     date_of_birth,
//     phone,
//     email,
//     avatar,
//     password,
//     department_id,
//     account_status,
//   } = req.body;

//   if (!teacher_code || !full_name || !email || !phone) {
//     return res.status(400).json({
//       message:
//         "Vui lòng nhập đầy đủ mã giáo viên, họ tên, email và số điện thoại",
//     });
//   }

//   if (!department_id) {
//     return res.status(400).json({
//       message: "Vui lòng chọn khoa/bộ môn",
//     });
//   }

//   if (!validateGender(gender)) {
//     return res.status(400).json({
//       message: "Giới tính không hợp lệ",
//     });
//   }

//   if (!validateAccountStatus(account_status)) {
//     return res.status(400).json({
//       message: "Trạng thái tài khoản không hợp lệ",
//     });
//   }

//   const connection = await db.getConnection();

//   try {
//     await connection.beginTransaction();

//     const [teachers] = await connection.query(
//       `
//       SELECT id_teacher
//       FROM Teacher
//       WHERE id_teacher = ?
//       LIMIT 1
//       `,
//       [id]
//     );

//     if (teachers.length === 0) {
//       await connection.rollback();

//       return res.status(404).json({
//         message: "Không tìm thấy giáo viên",
//       });
//     }

//     const [departments] = await connection.query(
//       `
//       SELECT id_department
//       FROM Department
//       WHERE id_department = ?
//       LIMIT 1
//       `,
//       [Number(department_id)]
//     );

//     if (departments.length === 0) {
//       await connection.rollback();

//       return res.status(404).json({
//         message: "Khoa/bộ môn không tồn tại",
//       });
//     }

//     const [duplicateTeachers] = await connection.query(
//       `
//       SELECT id_teacher
//       FROM Teacher
//       WHERE (teacher_code = ? OR email = ?)
//         AND id_teacher <> ?
//       LIMIT 1
//       `,
//       [teacher_code.trim(), email.trim(), id]
//     );

//     if (duplicateTeachers.length > 0) {
//       await connection.rollback();

//       return res.status(409).json({
//         message: "Mã giáo viên hoặc email đã tồn tại",
//       });
//     }

//     await connection.query(
//       `
//       UPDATE Teacher
//       SET
//         teacher_code = ?,
//         full_name = ?,
//         gender = ?,
//         date_of_birth = ?,
//         phone = ?,
//         email = ?,
//         avatar = ?,
//         department_id = ?,
//         updated_at = NOW()
//       WHERE id_teacher = ?
//       `,
//       [
//         teacher_code.trim(),
//         full_name.trim(),
//         normalizeGender(gender),
//         date_of_birth || null,
//         phone.trim(),
//         email.trim(),
//         avatar || null,
//         Number(department_id),
//         id,
//       ]
//     );

//     const [accounts] = await connection.query(
//       `
//       SELECT id_account
//       FROM Account
//       WHERE teacher_id = ?
//       LIMIT 1
//       `,
//       [id]
//     );

//     if (accounts.length === 0) {
//       await connection.query(
//         `
//         INSERT INTO Account (
//           username,
//           password,
//           role,
//           teacher_id,
//           student_id,
//           status
//         )
//         VALUES (?, ?, 'TEACHER', ?, NULL, ?)
//         `,
//         [
//           email.trim(),
//           password && password.trim() !== "" ? password : "123456",
//           id,
//           account_status || "ACTIVE",
//         ]
//       );
//     } else if (password && password.trim() !== "") {
//       await connection.query(
//         `
//         UPDATE Account
//         SET
//           username = ?,
//           password = ?,
//           status = ?
//         WHERE teacher_id = ?
//         `,
//         [email.trim(), password, account_status || "ACTIVE", id]
//       );

//       await connection.query(
//         `
//         UPDATE Teacher
//         SET password = ?
//         WHERE id_teacher = ?
//         `,
//         [password, id]
//       );
//     } else {
//       await connection.query(
//         `
//         UPDATE Account
//         SET
//           username = ?,
//           status = ?
//         WHERE teacher_id = ?
//         `,
//         [email.trim(), account_status || "ACTIVE", id]
//       );
//     }

//     await connection.commit();

//     return res.status(200).json({
//       message: "Cập nhật giáo viên thành công",
//     });
//   } catch (error) {
//     await connection.rollback();

//     console.error("Lỗi cập nhật giáo viên:", error);

//     if (error.code === "ER_DUP_ENTRY") {
//       return res.status(409).json({
//         message: "Mã giáo viên, email hoặc tài khoản đã tồn tại",
//         error: error.message,
//         code: error.code,
//       });
//     }

//     if (error.code === "ER_DATA_TOO_LONG") {
//       return res.status(400).json({
//         message:
//           "Dữ liệu quá dài. Có thể avatar dạng Base64 vượt quá giới hạn cột trong MySQL.",
//         error: error.message,
//         code: error.code,
//       });
//     }

//     return res.status(500).json({
//       message: "Lỗi cập nhật giáo viên",
//       error: error.message,
//       code: error.code,
//     });
//   } finally {
//     connection.release();
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | 19. API: Xóa giáo viên
// |--------------------------------------------------------------------------
// | Method: DELETE
// | URL: /api/teachers/:id
// |--------------------------------------------------------------------------
// */
// router.delete("/:id", async (req, res) => {
//   const { id } = req.params;

//   const connection = await db.getConnection();

//   try {
//     await connection.beginTransaction();

//     const [teachers] = await connection.query(
//       `
//       SELECT id_teacher
//       FROM Teacher
//       WHERE id_teacher = ?
//       LIMIT 1
//       `,
//       [id]
//     );

//     if (teachers.length === 0) {
//       await connection.rollback();

//       return res.status(404).json({
//         message: "Không tìm thấy giáo viên",
//       });
//     }

//     await connection.query(
//       `
//       DELETE FROM Account
//       WHERE teacher_id = ?
//       `,
//       [id]
//     );

//     await connection.query(
//       `
//       DELETE FROM Teacher
//       WHERE id_teacher = ?
//       `,
//       [id]
//     );

//     await connection.commit();

//     return res.status(200).json({
//       message: "Xóa giáo viên thành công",
//     });
//   } catch (error) {
//     await connection.rollback();

//     console.error("Lỗi xóa giáo viên:", error);

//     return res.status(500).json({
//       message:
//         "Không thể xóa giáo viên. Có thể giáo viên đang được dùng trong lớp học phần hoặc dữ liệu liên quan khác.",
//       error: error.message,
//       code: error.code,
//     });
//   } finally {
//     connection.release();
//   }
// });


// /*
// |--------------------------------------------------------------------------
// | API: Lấy thông báo của giáo viên
// |--------------------------------------------------------------------------
// | Method: GET
// | URL: /api/teachers/:teacherId/notifications
// |--------------------------------------------------------------------------
// */
// router.get("/:teacherId/notifications", async (req, res) => {
//   try {
//     const { teacherId } = req.params;

//     if (!teacherId) {
//       return res.status(400).json({
//         message: "Thiếu mã giáo viên",
//       });
//     }

//     const [notifications] = await db.query(
//       `
//       SELECT
//         id_notification,
//         title,
//         content,
//         receiver_id,
//         receiver_role,
//         created_at,
//         is_read
//       FROM Notification
//       WHERE receiver_role = 'TEACHER'
//         AND (receiver_id = ? OR receiver_id IS NULL)
//       ORDER BY created_at DESC
//       `,
//       [teacherId]
//     );

//     return res.status(200).json({
//       notifications,
//     });
//   } catch (error) {
//     console.error("Lỗi lấy thông báo giáo viên:", error);

//     return res.status(500).json({
//       message: "Lỗi lấy thông báo giáo viên",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | API: Đánh dấu thông báo đã đọc
// |--------------------------------------------------------------------------
// | Method: PUT
// | URL: /api/teachers/notifications/:notificationId/read
// |--------------------------------------------------------------------------
// */
// router.put("/notifications/:notificationId/read", async (req, res) => {
//   try {
//     const { notificationId } = req.params;

//     if (!notificationId) {
//       return res.status(400).json({
//         message: "Thiếu mã thông báo",
//       });
//     }

//     const [result] = await db.query(
//       `
//       UPDATE Notification
//       SET is_read = 1
//       WHERE id_notification = ?
//       `,
//       [notificationId]
//     );

//     if (result.affectedRows === 0) {
//       return res.status(404).json({
//         message: "Không tìm thấy thông báo",
//       });
//     }

//     return res.status(200).json({
//       message: "Đã đánh dấu thông báo là đã đọc",
//     });
//   } catch (error) {
//     console.error("Lỗi đánh dấu thông báo:", error);

//     return res.status(500).json({
//       message: "Lỗi đánh dấu thông báo",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | API: Lấy thông tin cá nhân giáo viên
// |--------------------------------------------------------------------------
// | Method: GET
// | URL: /api/teachers/profile/:teacherId
// |--------------------------------------------------------------------------
// */
// router.get("/profile/:teacherId", async (req, res) => {
//   try {
//     const { teacherId } = req.params;

//     if (!teacherId) {
//       return res.status(400).json({
//         message: "Thiếu mã giáo viên",
//       });
//     }

//     const [rows] = await db.query(
//       `
//       SELECT
//         t.id_teacher,
//         t.teacher_code,
//         t.full_name,
//         t.gender,
//         t.date_of_birth,
//         t.phone,
//         t.email,
//         t.avatar,
//         t.department_id,

//         d.department_name,

//         a.id_account,
//         a.username,
//         a.role,
//         a.status AS account_status,

//         t.created_at,
//         t.updated_at

//       FROM Teacher t

//       LEFT JOIN Department d
//         ON t.department_id = d.id_department

//       LEFT JOIN Account a
//         ON a.teacher_id = t.id_teacher

//       WHERE t.id_teacher = ?

//       LIMIT 1
//       `,
//       [teacherId]
//     );

//     if (rows.length === 0) {
//       return res.status(404).json({
//         message: "Không tìm thấy giáo viên",
//       });
//     }

//     return res.status(200).json({
//       teacher: rows[0],
//     });
//   } catch (error) {
//     console.error("Lỗi lấy thông tin cá nhân giáo viên:", error);

//     return res.status(500).json({
//       message: "Lỗi lấy thông tin cá nhân giáo viên",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | API: Cập nhật thông tin cá nhân giáo viên
// |--------------------------------------------------------------------------
// | Method: PUT
// | URL: /api/teachers/profile/:teacherId
// |--------------------------------------------------------------------------
// */
// router.put("/profile/:teacherId", async (req, res) => {
//   try {
//     const { teacherId } = req.params;

//     const {
//       full_name,
//       gender,
//       date_of_birth,
//       phone,
//       email,
//       avatar,
//       personal_email,
//       office,
//     } = req.body;

//     if (!teacherId) {
//       return res.status(400).json({
//         message: "Thiếu mã giáo viên",
//       });
//     }

//     if (!full_name || !email || !phone) {
//       return res.status(400).json({
//         message: "Vui lòng nhập đầy đủ họ tên, email và số điện thoại",
//       });
//     }

//     const [teachers] = await db.query(
//       `
//       SELECT id_teacher
//       FROM Teacher
//       WHERE id_teacher = ?
//       LIMIT 1
//       `,
//       [teacherId]
//     );

//     if (teachers.length === 0) {
//       return res.status(404).json({
//         message: "Không tìm thấy giáo viên",
//       });
//     }

//     const [duplicates] = await db.query(
//       `
//       SELECT id_teacher
//       FROM Teacher
//       WHERE email = ?
//         AND id_teacher <> ?
//       LIMIT 1
//       `,
//       [email.trim(), teacherId]
//     );

//     if (duplicates.length > 0) {
//       return res.status(409).json({
//         message: "Email đã được giáo viên khác sử dụng",
//       });
//     }

//     await db.query(
//       `
//       UPDATE Teacher
//       SET
//         full_name = ?,
//         gender = ?,
//         date_of_birth = ?,
//         phone = ?,
//         email = ?,
//         avatar = ?,
//         updated_at = NOW()
//       WHERE id_teacher = ?
//       `,
//       [
//         full_name.trim(),
//         gender || null,
//         date_of_birth || null,
//         phone.trim(),
//         email.trim(),
//         avatar || null,
//         teacherId,
//       ]
//     );

//     await db.query(
//       `
//       UPDATE Account
//       SET username = ?
//       WHERE teacher_id = ?
//       `,
//       [email.trim(), teacherId]
//     );

//     return res.status(200).json({
//       message: "Cập nhật thông tin cá nhân thành công",
//       teacher: {
//         id_teacher: Number(teacherId),
//         full_name: full_name.trim(),
//         gender,
//         date_of_birth,
//         phone: phone.trim(),
//         email: email.trim(),
//         avatar,
//         personal_email,
//         office,
//       },
//     });
//   } catch (error) {
//     console.error("Lỗi cập nhật thông tin cá nhân giáo viên:", error);

//     if (error.code === "ER_DATA_TOO_LONG") {
//       return res.status(400).json({
//         message:
//           "Dữ liệu quá dài. Có thể ảnh đại diện dạng Base64 vượt quá giới hạn cột avatar trong MySQL.",
//         error: error.message,
//         code: error.code,
//       });
//     }

//     return res.status(500).json({
//       message: "Lỗi cập nhật thông tin cá nhân giáo viên",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | API: Đổi mật khẩu giáo viên
// |--------------------------------------------------------------------------
// | Method: PUT
// | URL: /api/teachers/:teacherId/change-password
// |--------------------------------------------------------------------------
// */
// router.put("/:teacherId/change-password", async (req, res) => {
//   try {
//     const { teacherId } = req.params;
//     const { oldPassword, newPassword } = req.body;

//     if (!teacherId) {
//       return res.status(400).json({
//         message: "Thiếu mã giáo viên",
//       });
//     }

//     if (!oldPassword || !newPassword) {
//       return res.status(400).json({
//         message: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới",
//       });
//     }

//     if (newPassword.length < 8) {
//       return res.status(400).json({
//         message: "Mật khẩu mới phải có ít nhất 8 ký tự",
//       });
//     }

//     const [accounts] = await db.query(
//       `
//       SELECT
//         id_account,
//         username,
//         password,
//         teacher_id,
//         role,
//         status
//       FROM Account
//       WHERE teacher_id = ?
//         AND role = 'TEACHER'
//       LIMIT 1
//       `,
//       [teacherId]
//     );

//     if (accounts.length === 0) {
//       return res.status(404).json({
//         message: "Không tìm thấy tài khoản giáo viên",
//       });
//     }

//     const account = accounts[0];

//     if (account.status === "LOCKED") {
//       return res.status(403).json({
//         message: "Tài khoản giáo viên đang bị khóa",
//       });
//     }

//     if (String(account.password) !== String(oldPassword)) {
//       return res.status(400).json({
//         message: "Mật khẩu hiện tại không đúng",
//       });
//     }

//     if (String(oldPassword) === String(newPassword)) {
//       return res.status(400).json({
//         message: "Mật khẩu mới không được trùng với mật khẩu hiện tại",
//       });
//     }

//     await db.query(
//       `
//       UPDATE Account
//       SET password = ?
//       WHERE teacher_id = ?
//         AND role = 'TEACHER'
//       `,
//       [newPassword, teacherId]
//     );

//     await db.query(
//       `
//       UPDATE Teacher
//       SET password = ?, updated_at = NOW()
//       WHERE id_teacher = ?
//       `,
//       [newPassword, teacherId]
//     );

//     return res.status(200).json({
//       message: "Đổi mật khẩu thành công",
//     });
//   } catch (error) {
//     console.error("Lỗi đổi mật khẩu giáo viên:", error);

//     return res.status(500).json({
//       message: "Lỗi đổi mật khẩu giáo viên",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// //
// // /*
// // |--------------------------------------------------------------------------
// // | API: Đổi mật khẩu giáo viên
// // |--------------------------------------------------------------------------
// // | Method: PUT
// // | URL: /api/teachers/:teacherId/change-password
// // |--------------------------------------------------------------------------
// // */
// // router.put("/:teacherId/change-password", async (req, res) => {
// //   try {
// //     const { teacherId } = req.params;
// //     const { oldPassword, newPassword } = req.body;

// //     if (!teacherId) {
// //       return res.status(400).json({
// //         message: "Thiếu mã giáo viên",
// //       });
// //     }

// //     if (!oldPassword || !newPassword) {
// //       return res.status(400).json({
// //         message: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới",
// //       });
// //     }

// //     if (newPassword.length < 8) {
// //       return res.status(400).json({
// //         message: "Mật khẩu mới phải có ít nhất 8 ký tự",
// //       });
// //     }

// //     const [accounts] = await db.query(
// //       `
// //       SELECT
// //         id_account,
// //         username,
// //         password,
// //         teacher_id
// //       FROM Account
// //       WHERE teacher_id = ?
// //         AND role = 'TEACHER'
// //       LIMIT 1
// //       `,
// //       [teacherId]
// //     );

// //     if (accounts.length === 0) {
// //       return res.status(404).json({
// //         message: "Không tìm thấy tài khoản giáo viên",
// //       });
// //     }

// //     const account = accounts[0];

// //     if (String(account.password) !== String(oldPassword)) {
// //       return res.status(400).json({
// //         message: "Mật khẩu hiện tại không đúng",
// //       });
// //     }

// //     await db.query(
// //       `
// //       UPDATE Account
// //       SET password = ?
// //       WHERE teacher_id = ?
// //         AND role = 'TEACHER'
// //       `,
// //       [newPassword, teacherId]
// //     );

// //     await db.query(
// //       `
// //       UPDATE Teacher
// //       SET password = ?
// //       WHERE id_teacher = ?
// //       `,
// //       [newPassword, teacherId]
// //     );

// //     return res.status(200).json({
// //       message: "Đổi mật khẩu thành công",
// //     });
// //   } catch (error) {
// //     console.error("Lỗi đổi mật khẩu giáo viên:", error);

// //     return res.status(500).json({
// //       message: "Lỗi đổi mật khẩu giáo viên",
// //       error: error.message,
// //       code: error.code,
// //     });
// //   }
// // });

// /*
// |--------------------------------------------------------------------------
// | API: Thống kê điểm danh giáo viên
// |--------------------------------------------------------------------------
// | Method: GET
// | URL: /api/teachers/statistics/:teacherId
// |--------------------------------------------------------------------------
// */
// router.get("/statistics/:teacherId", async (req, res) => {
//   try {
//     const { teacherId } = req.params;
//     const { courseClassId } = req.query;

//     if (!teacherId) {
//       return res.status(400).json({
//         message: "Thiếu mã giáo viên",
//       });
//     }

//     const classCondition =
//       courseClassId && courseClassId !== "all"
//         ? "AND cc.id_course_class = ?"
//         : "";

//     const params =
//       courseClassId && courseClassId !== "all"
//         ? [teacherId, courseClassId]
//         : [teacherId];

//     const [[overview]] = await db.query(
//       `
//       SELECT
//         COUNT(DISTINCT se.id_session) AS totalSessions,
//         COUNT(DISTINCT e.id_student) AS totalStudents,
//         COUNT(a.id_attendance) AS totalAttendance,

//         COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) AS presentCount,
//         COUNT(CASE WHEN a.status = 'LATE' THEN 1 END) AS lateCount,
//         COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END) AS absentCount,

//         ROUND(
//           CASE
//             WHEN COUNT(a.id_attendance) = 0 THEN 0
//             ELSE COUNT(CASE WHEN a.status IN ('PRESENT', 'LATE') THEN 1 END)
//                  / COUNT(a.id_attendance) * 100
//           END,
//           2
//         ) AS attendancePercent

//       FROM CourseClass cc

//       LEFT JOIN Enrollment e
//         ON e.id_course_class = cc.id_course_class
//        AND e.status = 'STUDYING'

//       LEFT JOIN Schedule s
//         ON s.id_course_class = cc.id_course_class

//       LEFT JOIN Session se
//         ON se.id_schedule = s.id_schedule

//       LEFT JOIN Attendance a
//         ON a.id_session = se.id_session
//        AND a.id_student = e.id_student

//       WHERE cc.id_teacher = ?
//       ${classCondition}
//       `,
//       params
//     );

//     const [warningRows] = await db.query(
//       `
//       SELECT
//         st.id_student
//       FROM CourseClass cc

//       INNER JOIN Enrollment e
//         ON e.id_course_class = cc.id_course_class
//        AND e.status = 'STUDYING'

//       INNER JOIN Student st
//         ON st.id_student = e.id_student

//       LEFT JOIN Schedule s
//         ON s.id_course_class = cc.id_course_class

//       LEFT JOIN Session se
//         ON se.id_schedule = s.id_schedule

//       LEFT JOIN Attendance a
//         ON a.id_session = se.id_session
//        AND a.id_student = st.id_student

//       WHERE cc.id_teacher = ?
//       ${classCondition}

//       GROUP BY st.id_student

//       HAVING
//         COUNT(a.id_attendance) > 0
//         AND COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END)
//             / COUNT(a.id_attendance) * 100 >= 20
//       `,
//       params
//     );

//     const [trend] = await db.query(
//       `
//       SELECT
//         DATE_FORMAT(se.session_date, '%d/%m') AS label,
//         DATE_FORMAT(se.session_date, '%Y-%m-%d') AS date,

//         ROUND(
//           CASE
//             WHEN COUNT(a.id_attendance) = 0 THEN 0
//             ELSE COUNT(CASE WHEN a.status IN ('PRESENT', 'LATE') THEN 1 END)
//                  / COUNT(a.id_attendance) * 100
//           END,
//           2
//         ) AS attendancePercent,

//         ROUND(
//           CASE
//             WHEN COUNT(a.id_attendance) = 0 THEN 0
//             ELSE COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END)
//                  / COUNT(a.id_attendance) * 100
//           END,
//           2
//         ) AS absentPercent

//       FROM CourseClass cc

//       INNER JOIN Schedule s
//         ON s.id_course_class = cc.id_course_class

//       INNER JOIN Session se
//         ON se.id_schedule = s.id_schedule

//       LEFT JOIN Attendance a
//         ON a.id_session = se.id_session

//       WHERE cc.id_teacher = ?
//       ${classCondition}

//       GROUP BY se.session_date

//       ORDER BY se.session_date ASC

//       LIMIT 12
//       `,
//       params
//     );

//     const [classStats] = await db.query(
//       `
//       SELECT
//         cc.id_course_class,
//         cc.class_code,

//         COUNT(a.id_attendance) AS totalAttendance,

//         COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END) AS absentCount,

//         ROUND(
//           CASE
//             WHEN COUNT(a.id_attendance) = 0 THEN 0
//             ELSE COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END)
//                  / COUNT(a.id_attendance) * 100
//           END,
//           2
//         ) AS absentPercent

//       FROM CourseClass cc

//       LEFT JOIN Schedule s
//         ON s.id_course_class = cc.id_course_class

//       LEFT JOIN Session se
//         ON se.id_schedule = s.id_schedule

//       LEFT JOIN Attendance a
//         ON a.id_session = se.id_session

//       WHERE cc.id_teacher = ?
//       ${classCondition}

//       GROUP BY
//         cc.id_course_class,
//         cc.class_code

//       ORDER BY absentPercent DESC
//       `,
//       params
//     );

//     const [topAbsentees] = await db.query(
//       `
//       SELECT
//         st.id_student,
//         st.student_code,
//         st.full_name,
//         st.avatar,
//         st.class_name,
//         cc.class_code,

//         COUNT(DISTINCT se.id_session) AS totalSessions,

//         COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END) AS absentCount,

//         ROUND(
//           CASE
//             WHEN COUNT(a.id_attendance) = 0 THEN 0
//             ELSE COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END)
//                  / COUNT(a.id_attendance) * 100
//           END,
//           2
//         ) AS absentPercent

//       FROM CourseClass cc

//       INNER JOIN Enrollment e
//         ON e.id_course_class = cc.id_course_class
//        AND e.status = 'STUDYING'

//       INNER JOIN Student st
//         ON st.id_student = e.id_student

//       LEFT JOIN Schedule s
//         ON s.id_course_class = cc.id_course_class

//       LEFT JOIN Session se
//         ON se.id_schedule = s.id_schedule

//       LEFT JOIN Attendance a
//         ON a.id_session = se.id_session
//        AND a.id_student = st.id_student

//       WHERE cc.id_teacher = ?
//       ${classCondition}

//       GROUP BY
//         st.id_student,
//         st.student_code,
//         st.full_name,
//         st.avatar,
//         st.class_name,
//         cc.class_code

//       HAVING COUNT(a.id_attendance) > 0

//       ORDER BY absentPercent DESC, absentCount DESC

//       LIMIT 10
//       `,
//       params
//     );

//     return res.status(200).json({
//       overview: {
//         totalSessions: Number(overview.totalSessions || 0),
//         totalStudents: Number(overview.totalStudents || 0),
//         totalAttendance: Number(overview.totalAttendance || 0),
//         presentCount: Number(overview.presentCount || 0),
//         lateCount: Number(overview.lateCount || 0),
//         absentCount: Number(overview.absentCount || 0),
//         attendancePercent: Number(overview.attendancePercent || 0),
//         warningStudents: warningRows.length,
//       },
//       trend,
//       classStats,
//       topAbsentees,
//     });
//   } catch (error) {
//     console.error("Lỗi lấy thống kê điểm danh giáo viên:", error);

//     return res.status(500).json({
//       message: "Lỗi lấy thống kê điểm danh giáo viên",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// /*
// |--------------------------------------------------------------------------
// | API: Lấy danh sách lớp học phần của giáo viên
// |--------------------------------------------------------------------------
// | Method: GET
// | URL: /api/teachers/classes/teacher/:teacherId
// |--------------------------------------------------------------------------
// */
// router.get("/classes/teacher/:teacherId", async (req, res) => {
//   try {
//     const { teacherId } = req.params;
//     const { search = "", semester = "all", status = "all" } = req.query;

//     if (!teacherId) {
//       return res.status(400).json({
//         message: "Thiếu mã giáo viên",
//       });
//     }

//     const conditions = ["cc.id_teacher = ?"];
//     const params = [teacherId];

//     if (search) {
//       conditions.push(`
//         (
//           cc.class_code LIKE ?
//           OR sub.subject_name LIKE ?
//           OR sub.subject_code LIKE ?
//           OR cr.room_name LIKE ?
//           OR cr.room_code LIKE ?
//         )
//       `);

//       const keyword = `%${search}%`;
//       params.push(keyword, keyword, keyword, keyword, keyword);
//     }

//     if (semester && semester !== "all") {
//       const parts = String(semester).split(" - ");
//       const semesterValue = parts[0];
//       const schoolYearValue = parts[1];

//       if (semesterValue) {
//         conditions.push("cc.semester = ?");
//         params.push(semesterValue);
//       }

//       if (schoolYearValue) {
//         conditions.push("cc.school_year = ?");
//         params.push(schoolYearValue);
//       }
//     }

//     if (status && status !== "all") {
//       conditions.push("cc.status = ?");
//       params.push(status);
//     }

//     const whereClause = conditions.join(" AND ");

//     const [classes] = await db.query(
//       `
//       SELECT
//         cc.id_course_class,
//         cc.class_code,
//         cc.semester,
//         cc.school_year,
//         cc.group_number,
//         cc.max_student,
//         cc.status,

//         sub.id_subject,
//         sub.subject_code,
//         sub.subject_name,
//         sub.credits,

//         t.id_teacher,
//         t.teacher_code,
//         t.full_name AS teacher_name,

//         MIN(cr.id_room) AS id_room,
//         MIN(cr.room_code) AS room_code,
//         MIN(cr.room_name) AS room_name,
//         MIN(cr.building) AS building,
//         MIN(cr.floor) AS floor,

//         COUNT(DISTINCT s.id_schedule) AS total_schedules,
//         COUNT(DISTINCT se.id_session) AS total_sessions,
//         COUNT(DISTINCT CASE
//           WHEN se.status = 'FINISHED' THEN se.id_session
//         END) AS finished_sessions,

//         COUNT(DISTINCT e.id_student) AS total_students,

//         COUNT(DISTINCT a.id_attendance) AS total_attendance,

//         COUNT(DISTINCT CASE
//           WHEN a.status = 'PRESENT' THEN a.id_attendance
//         END) AS present_count,

//         COUNT(DISTINCT CASE
//           WHEN a.status = 'LATE' THEN a.id_attendance
//         END) AS late_count,

//         COUNT(DISTINCT CASE
//           WHEN a.status = 'ABSENT' THEN a.id_attendance
//         END) AS absent_count,

//         COUNT(DISTINCT CASE
//           WHEN a.status IN ('PRESENT', 'LATE') THEN a.id_attendance
//         END) AS attended_count,

//         ROUND(
//           CASE
//             WHEN COUNT(DISTINCT a.id_attendance) = 0 THEN 0
//             ELSE COUNT(DISTINCT CASE
//               WHEN a.status IN ('PRESENT', 'LATE') THEN a.id_attendance
//             END) / COUNT(DISTINCT a.id_attendance) * 100
//           END,
//           2
//         ) AS attendance_percent

//       FROM CourseClass cc

//       INNER JOIN Subject sub
//         ON cc.id_subject = sub.id_subject

//       INNER JOIN Teacher t
//         ON cc.id_teacher = t.id_teacher

//       LEFT JOIN Schedule s
//         ON s.id_course_class = cc.id_course_class

//       LEFT JOIN ClassRoom cr
//         ON s.id_room = cr.id_room

//       LEFT JOIN Session se
//         ON se.id_schedule = s.id_schedule

//       LEFT JOIN Enrollment e
//         ON e.id_course_class = cc.id_course_class
//        AND e.status = 'STUDYING'

//       LEFT JOIN Attendance a
//         ON a.id_session = se.id_session
//        AND a.id_student = e.id_student

//       WHERE ${whereClause}

//       GROUP BY
//         cc.id_course_class,
//         cc.class_code,
//         cc.semester,
//         cc.school_year,
//         cc.group_number,
//         cc.max_student,
//         cc.status,
//         sub.id_subject,
//         sub.subject_code,
//         sub.subject_name,
//         sub.credits,
//         t.id_teacher,
//         t.teacher_code,
//         t.full_name

//       ORDER BY
//         cc.school_year DESC,
//         cc.semester DESC,
//         cc.class_code ASC
//       `,
//       params
//     );

//     return res.status(200).json({
//       classes,
//     });
//   } catch (error) {
//     console.error("Lỗi lấy danh sách lớp học của giáo viên:", error);

//     return res.status(500).json({
//       message: "Lỗi lấy danh sách lớp học của giáo viên",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// //
// /*
// |--------------------------------------------------------------------------
// | API: Lấy danh sách buổi học của giáo viên
// |--------------------------------------------------------------------------
// | Method: GET
// | URL: /api/teachers/sessions/teacher/:teacherId
// |--------------------------------------------------------------------------
// */
// router.get("/sessions/teacher/:teacherId", async (req, res) => {
//   try {
//     const { teacherId } = req.params;
//     const {
//       date = "",
//       classCode = "all",
//       subject = "all",
//       status = "all",
//       search = "",
//     } = req.query;

//     if (!teacherId) {
//       return res.status(400).json({
//         message: "Thiếu mã giáo viên",
//       });
//     }

//     const conditions = ["cc.id_teacher = ?"];
//     const params = [teacherId];

//     if (date) {
//       conditions.push(`
//         (
//           se.session_date = ?
//           OR (
//             se.id_session IS NULL
//             AND ? BETWEEN s.start_date AND s.end_date
//           )
//         )
//       `);

//       params.push(date, date);
//     }

//     if (classCode && classCode !== "all") {
//       conditions.push("cc.class_code = ?");
//       params.push(classCode);
//     }

//     if (subject && subject !== "all") {
//       conditions.push("sub.subject_name = ?");
//       params.push(subject);
//     }

//     if (status && status !== "all") {
//       if (status === "NOT_CREATED") {
//         conditions.push("se.id_session IS NULL");
//       } else {
//         conditions.push("se.status = ?");
//         params.push(status);
//       }
//     }

//     if (search) {
//       conditions.push(`
//         (
//           cc.class_code LIKE ?
//           OR sub.subject_name LIKE ?
//           OR sub.subject_code LIKE ?
//           OR cr.room_name LIKE ?
//           OR cr.room_code LIKE ?
//         )
//       `);

//       const keyword = `%${search}%`;
//       params.push(keyword, keyword, keyword, keyword, keyword);
//     }

//     const whereClause = conditions.join(" AND ");

//     const [sessions] = await db.query(
//       `
//       SELECT
//         s.id_schedule,
//         s.day_of_week,
//         s.start_time,
//         s.end_time,
//         s.start_date,
//         s.end_date,

//         cc.id_course_class,
//         cc.class_code,

//         sub.id_subject,
//         sub.subject_code,
//         sub.subject_name,

//         cr.id_room,
//         cr.room_code,
//         cr.room_name,

//         se.id_session,
//         se.session_date,
//         se.session_number,
//         se.status AS session_status,

//         COUNT(DISTINCT e.id_student) AS total_students,

//         COUNT(DISTINCT CASE
//           WHEN a.status = 'PRESENT' THEN a.id_attendance
//         END) AS present_students,

//         COUNT(DISTINCT CASE
//           WHEN a.status = 'LATE' THEN a.id_attendance
//         END) AS late_students,

//         COUNT(DISTINCT CASE
//           WHEN a.status = 'ABSENT' THEN a.id_attendance
//         END) AS absent_students,

//         COUNT(DISTINCT CASE
//           WHEN a.status IN ('PRESENT', 'LATE') THEN a.id_attendance
//         END) AS attended_students

//       FROM Schedule s

//       INNER JOIN CourseClass cc
//         ON s.id_course_class = cc.id_course_class

//       INNER JOIN Subject sub
//         ON cc.id_subject = sub.id_subject

//       LEFT JOIN ClassRoom cr
//         ON s.id_room = cr.id_room

//       LEFT JOIN Session se
//         ON se.id_schedule = s.id_schedule
//        AND (
//           ? = ''
//           OR se.session_date = ?
//        )

//       LEFT JOIN Enrollment e
//         ON e.id_course_class = cc.id_course_class
//        AND e.status = 'STUDYING'

//       LEFT JOIN Attendance a
//         ON a.id_session = se.id_session
//        AND a.id_student = e.id_student

//       WHERE ${whereClause}

//       GROUP BY
//         s.id_schedule,
//         s.day_of_week,
//         s.start_time,
//         s.end_time,
//         s.start_date,
//         s.end_date,
//         cc.id_course_class,
//         cc.class_code,
//         sub.id_subject,
//         sub.subject_code,
//         sub.subject_name,
//         cr.id_room,
//         cr.room_code,
//         cr.room_name,
//         se.id_session,
//         se.session_date,
//         se.session_number,
//         se.status

//       ORDER BY
//         COALESCE(se.session_date, ?) ASC,
//         s.start_time ASC
//       `,
//       [date, date, ...params, date || new Date().toISOString().slice(0, 10)]
//     );

//     return res.status(200).json({
//       sessions,
//     });
//   } catch (error) {
//     console.error("Lỗi lấy danh sách buổi học giáo viên:", error);

//     return res.status(500).json({
//       message: "Lỗi lấy danh sách buổi học giáo viên",
//       error: error.message,
//       code: error.code,
//     });
//   }
// });

// //




// export default router;


import express from "express";
import db from "../config/db.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Helper: Chuẩn hóa phần trăm
|--------------------------------------------------------------------------
*/
function normalizePercent(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? Number(number.toFixed(2)) : 0;
}

/*
|--------------------------------------------------------------------------
| Helper: Chuẩn hóa giới tính
|--------------------------------------------------------------------------
*/
function normalizeGender(gender) {
  if (!gender) return null;

  if (gender === "Nam") return "Male";
  if (gender === "Nữ") return "Female";
  if (gender === "Khác") return "Other";

  return gender;
}

/*
|--------------------------------------------------------------------------
| Helper: Kiểm tra giới tính hợp lệ
|--------------------------------------------------------------------------
*/
function validateGender(gender) {
  const validGenders = [
    "Nam",
    "Nữ",
    "Khác",
    "Male",
    "Female",
    "Other",
    "",
    null,
    undefined,
  ];

  return validGenders.includes(gender);
}

/*
|--------------------------------------------------------------------------
| Helper: Kiểm tra trạng thái tài khoản
|--------------------------------------------------------------------------
*/
function validateAccountStatus(status) {
  const validStatus = ["ACTIVE", "LOCKED", "", null, undefined];

  return validStatus.includes(status);
}

/*
|--------------------------------------------------------------------------
| Helper: Kiểm tra trạng thái điểm danh
|--------------------------------------------------------------------------
*/
function validateAttendanceStatus(status) {
  const validStatus = ["PRESENT", "ABSENT", "LATE"];
  return validStatus.includes(status);
}

/*
|--------------------------------------------------------------------------
| Helper: Kiểm tra trạng thái buổi học
|--------------------------------------------------------------------------
*/
function validateSessionStatus(status) {
  const validStatus = ["NOT_STARTED", "ONGOING", "FINISHED"];
  return validStatus.includes(status);
}

/*
|--------------------------------------------------------------------------
| 1. API: Dashboard giáo viên
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/dashboard/:teacherId
|--------------------------------------------------------------------------
*/
router.get("/dashboard/:teacherId", async (req, res) => {
  const { teacherId } = req.params;

  if (!teacherId) {
    return res.status(400).json({
      message: "Thiếu teacherId",
    });
  }

  try {
    const [[teacher]] = await db.query(
      `
      SELECT
        t.id_teacher,
        t.teacher_code,
        t.full_name,
        t.gender,
        t.date_of_birth,
        t.phone,
        t.email,
        t.avatar,
        t.department_id,
        d.department_name
      FROM Teacher t
      LEFT JOIN Department d
        ON t.department_id = d.id_department
      WHERE t.id_teacher = ?
      LIMIT 1
      `,
      [teacherId]
    );

    if (!teacher) {
      return res.status(404).json({
        message: "Không tìm thấy giáo viên",
      });
    }

    const [[classStats]] = await db.query(
      `
      SELECT
        COUNT(DISTINCT cc.id_course_class) AS totalClasses,
        COUNT(DISTINCT cc.id_subject) AS totalSubjects
      FROM CourseClass cc
      WHERE cc.id_teacher = ?
      `,
      [teacherId]
    );

    const [[todayStats]] = await db.query(
      `
      SELECT
        COUNT(DISTINCT s.id_schedule) AS todaySchedules,

        COUNT(DISTINCT CASE
          WHEN se.status = 'FINISHED' THEN se.id_session
        END) AS completedToday,

        COUNT(CASE
          WHEN a.status = 'ABSENT' THEN 1
        END) AS absentToday,

        COUNT(a.id_attendance) AS totalAttendanceToday,

        COUNT(CASE
          WHEN a.status IN ('PRESENT', 'LATE') THEN 1
        END) AS attendedToday

      FROM CourseClass cc

      LEFT JOIN Schedule s
        ON s.id_course_class = cc.id_course_class
       AND s.day_of_week = DAYNAME(CURDATE())
       AND CURDATE() BETWEEN s.start_date AND s.end_date

      LEFT JOIN Session se
        ON se.id_schedule = s.id_schedule
       AND se.session_date = CURDATE()

      LEFT JOIN Attendance a
        ON a.id_session = se.id_session

      WHERE cc.id_teacher = ?
      `,
      [teacherId]
    );

    const [[allAttendanceStats]] = await db.query(
      `
      SELECT
        COUNT(a.id_attendance) AS totalAttendance,

        COUNT(CASE
          WHEN a.status IN ('PRESENT', 'LATE') THEN 1
        END) AS attendedCount

      FROM CourseClass cc

      LEFT JOIN Schedule s
        ON s.id_course_class = cc.id_course_class

      LEFT JOIN Session se
        ON se.id_schedule = s.id_schedule

      LEFT JOIN Attendance a
        ON a.id_session = se.id_session

      WHERE cc.id_teacher = ?
      `,
      [teacherId]
    );

    const [todaySchedule] = await db.query(
      `
      SELECT
        s.id_schedule,
        s.day_of_week,
        s.start_time,
        s.end_time,
        s.start_date,
        s.end_date,

        se.id_session,
        se.session_date,
        se.session_number,
        se.status AS session_status,

        cc.id_course_class,
        cc.class_code,
        cc.semester,
        cc.school_year,
        cc.group_number,
        cc.status AS course_status,

        sub.id_subject,
        sub.subject_code,
        sub.subject_name,

        cr.id_room,
        cr.room_code,
        cr.room_name,
        cr.building,
        cr.floor,

        COUNT(DISTINCT e.id_student) AS totalStudents,

        COUNT(DISTINCT CASE
          WHEN a.status IN ('PRESENT', 'LATE') THEN a.id_student
        END) AS attendedStudents,

        COUNT(DISTINCT CASE
          WHEN a.status = 'ABSENT' THEN a.id_student
        END) AS absentStudents

      FROM CourseClass cc

      INNER JOIN Subject sub
        ON cc.id_subject = sub.id_subject

      INNER JOIN Schedule s
        ON s.id_course_class = cc.id_course_class

      LEFT JOIN ClassRoom cr
        ON s.id_room = cr.id_room

      LEFT JOIN Session se
        ON se.id_schedule = s.id_schedule
       AND se.session_date = CURDATE()

      LEFT JOIN Enrollment e
        ON e.id_course_class = cc.id_course_class
       AND e.status = 'STUDYING'

      LEFT JOIN Attendance a
        ON a.id_session = se.id_session
       AND a.id_student = e.id_student

      WHERE cc.id_teacher = ?
        AND s.day_of_week = DAYNAME(CURDATE())
        AND CURDATE() BETWEEN s.start_date AND s.end_date

      GROUP BY
        s.id_schedule,
        s.day_of_week,
        s.start_time,
        s.end_time,
        s.start_date,
        s.end_date,
        se.id_session,
        se.session_date,
        se.session_number,
        se.status,
        cc.id_course_class,
        cc.class_code,
        cc.semester,
        cc.school_year,
        cc.group_number,
        cc.status,
        sub.id_subject,
        sub.subject_code,
        sub.subject_name,
        cr.id_room,
        cr.room_code,
        cr.room_name,
        cr.building,
        cr.floor

      ORDER BY s.start_time ASC
      `,
      [teacherId]
    );

    let displaySchedule = todaySchedule;

    if (displaySchedule.length === 0) {
      const [allSchedules] = await db.query(
        `
        SELECT
          s.id_schedule,
          s.day_of_week,
          s.start_time,
          s.end_time,
          s.start_date,
          s.end_date,

          se.id_session,
          se.session_date,
          se.session_number,
          se.status AS session_status,

          cc.id_course_class,
          cc.class_code,
          cc.semester,
          cc.school_year,
          cc.group_number,
          cc.status AS course_status,

          sub.id_subject,
          sub.subject_code,
          sub.subject_name,

          cr.id_room,
          cr.room_code,
          cr.room_name,
          cr.building,
          cr.floor,

          COUNT(DISTINCT e.id_student) AS totalStudents,

          COUNT(DISTINCT CASE
            WHEN a.status IN ('PRESENT', 'LATE') THEN a.id_student
          END) AS attendedStudents,

          COUNT(DISTINCT CASE
            WHEN a.status = 'ABSENT' THEN a.id_student
          END) AS absentStudents

        FROM CourseClass cc

        INNER JOIN Subject sub
          ON cc.id_subject = sub.id_subject

        LEFT JOIN Schedule s
          ON s.id_course_class = cc.id_course_class

        LEFT JOIN ClassRoom cr
          ON s.id_room = cr.id_room

        LEFT JOIN Session se
          ON se.id_schedule = s.id_schedule

        LEFT JOIN Enrollment e
          ON e.id_course_class = cc.id_course_class
         AND e.status = 'STUDYING'

        LEFT JOIN Attendance a
          ON a.id_session = se.id_session
         AND a.id_student = e.id_student

        WHERE cc.id_teacher = ?

        GROUP BY
          s.id_schedule,
          s.day_of_week,
          s.start_time,
          s.end_time,
          s.start_date,
          s.end_date,
          se.id_session,
          se.session_date,
          se.session_number,
          se.status,
          cc.id_course_class,
          cc.class_code,
          cc.semester,
          cc.school_year,
          cc.group_number,
          cc.status,
          sub.id_subject,
          sub.subject_code,
          sub.subject_name,
          cr.id_room,
          cr.room_code,
          cr.room_name,
          cr.building,
          cr.floor

        ORDER BY
          s.start_date DESC,
          s.start_time ASC

        LIMIT 5
        `,
        [teacherId]
      );

      displaySchedule = allSchedules;
    }

    const [weeklyTrend] = await db.query(
      `
      SELECT
        DATE_FORMAT(se.session_date, '%Y-%m-%d') AS date,
        DATE_FORMAT(se.session_date, '%d/%m') AS label,

        COUNT(a.id_attendance) AS totalAttendance,

        COUNT(CASE
          WHEN a.status IN ('PRESENT', 'LATE') THEN 1
        END) AS attendedCount,

        ROUND(
          CASE
            WHEN COUNT(a.id_attendance) = 0 THEN 0
            ELSE COUNT(CASE WHEN a.status IN ('PRESENT', 'LATE') THEN 1 END)
                 / COUNT(a.id_attendance) * 100
          END,
          2
        ) AS attendancePercent

      FROM CourseClass cc

      INNER JOIN Schedule s
        ON s.id_course_class = cc.id_course_class

      INNER JOIN Session se
        ON se.id_schedule = s.id_schedule

      LEFT JOIN Attendance a
        ON a.id_session = se.id_session

      WHERE cc.id_teacher = ?
        AND se.session_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        AND se.session_date <= CURDATE()

      GROUP BY se.session_date

      ORDER BY se.session_date ASC
      `,
      [teacherId]
    );

    const [notifications] = await db.query(
      `
      SELECT
        id_notification,
        title,
        content,
        receiver_id,
        receiver_role,
        created_at,
        is_read
      FROM Notification
      WHERE receiver_role = 'TEACHER'
        AND (receiver_id = ? OR receiver_id IS NULL)
      ORDER BY created_at DESC
      LIMIT 5
      `,
      [teacherId]
    );

    const [topAbsentees] = await db.query(
      `
      SELECT
        st.id_student,
        st.student_code,
        st.full_name,
        st.class_name,
        COUNT(a.id_attendance) AS absentCount

      FROM CourseClass cc

      INNER JOIN Schedule s
        ON s.id_course_class = cc.id_course_class

      INNER JOIN Session se
        ON se.id_schedule = s.id_schedule

      INNER JOIN Attendance a
        ON a.id_session = se.id_session

      INNER JOIN Student st
        ON st.id_student = a.id_student

      WHERE cc.id_teacher = ?
        AND a.status = 'ABSENT'

      GROUP BY
        st.id_student,
        st.student_code,
        st.full_name,
        st.class_name

      ORDER BY absentCount DESC
      LIMIT 5
      `,
      [teacherId]
    );

    const totalAttendance = Number(allAttendanceStats.totalAttendance || 0);
    const attendedCount = Number(allAttendanceStats.attendedCount || 0);

    const avgAttendancePercent =
      totalAttendance > 0 ? (attendedCount / totalAttendance) * 100 : 0;

    return res.status(200).json({
      teacher,
      stats: {
        totalClasses: Number(classStats.totalClasses || 0),
        totalSubjects: Number(classStats.totalSubjects || 0),

        todaySchedules: Number(todayStats.todaySchedules || 0),
        completedToday: Number(todayStats.completedToday || 0),
        absentToday: Number(todayStats.absentToday || 0),

        totalAttendanceToday: Number(todayStats.totalAttendanceToday || 0),
        attendedToday: Number(todayStats.attendedToday || 0),

        totalAttendance,
        attendedCount,
        avgAttendancePercent: normalizePercent(avgAttendancePercent),
      },
      todaySchedule: displaySchedule,
      realTodaySchedule: todaySchedule,
      weeklyTrend,
      notifications,
      topAbsentees,
    });
  } catch (error) {
    console.error("Lỗi lấy dashboard giáo viên:", error);

    return res.status(500).json({
      message: "Lỗi lấy dashboard giáo viên",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| 2. API: Lấy lịch dạy giáo viên
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/schedule/:teacherId
|--------------------------------------------------------------------------
*/
router.get("/schedule/:teacherId", async (req, res) => {
  const { teacherId } = req.params;
  const { view = "week", subject = "", classCode = "" } = req.query;

  if (!teacherId) {
    return res.status(400).json({
      message: "Thiếu teacherId",
    });
  }

  try {
    const [[teacher]] = await db.query(
      `
      SELECT
        t.id_teacher,
        t.teacher_code,
        t.full_name,
        t.gender,
        t.email,
        t.phone,
        t.avatar,
        t.department_id,
        d.department_name
      FROM Teacher t
      LEFT JOIN Department d
        ON t.department_id = d.id_department
      WHERE t.id_teacher = ?
      LIMIT 1
      `,
      [teacherId]
    );

    if (!teacher) {
      return res.status(404).json({
        message: "Không tìm thấy giáo viên",
      });
    }

    const subjectFilter = subject ? `%${subject}%` : "%%";
    const classFilter = classCode ? `%${classCode}%` : "%%";

    const [schedules] = await db.query(
      `
      SELECT
        s.id_schedule,
        s.day_of_week,
        s.start_time,
        s.end_time,
        s.start_date,
        s.end_date,

        cc.id_course_class,
        cc.class_code,
        cc.semester,
        cc.school_year,
        cc.group_number,
        cc.status AS course_status,

        sub.id_subject,
        sub.subject_code,
        sub.subject_name,
        sub.credits,

        cr.id_room,
        cr.room_code,
        cr.room_name,
        cr.building,
        cr.floor,

        se.id_session,
        se.session_date,
        se.session_number,
        se.status AS session_status,

        COUNT(DISTINCT e.id_student) AS totalStudents,

        COUNT(DISTINCT CASE
          WHEN a.status IN ('PRESENT', 'LATE') THEN a.id_student
        END) AS attendedStudents,

        COUNT(DISTINCT CASE
          WHEN a.status = 'ABSENT' THEN a.id_student
        END) AS absentStudents

      FROM CourseClass cc

      INNER JOIN Subject sub
        ON cc.id_subject = sub.id_subject

      LEFT JOIN Schedule s
        ON s.id_course_class = cc.id_course_class

      LEFT JOIN ClassRoom cr
        ON s.id_room = cr.id_room

      LEFT JOIN Session se
        ON se.id_schedule = s.id_schedule

      LEFT JOIN Enrollment e
        ON e.id_course_class = cc.id_course_class
       AND e.status = 'STUDYING'

      LEFT JOIN Attendance a
        ON a.id_session = se.id_session
       AND a.id_student = e.id_student

      WHERE cc.id_teacher = ?
        AND sub.subject_name LIKE ?
        AND cc.class_code LIKE ?

      GROUP BY
        s.id_schedule,
        s.day_of_week,
        s.start_time,
        s.end_time,
        s.start_date,
        s.end_date,
        cc.id_course_class,
        cc.class_code,
        cc.semester,
        cc.school_year,
        cc.group_number,
        cc.status,
        sub.id_subject,
        sub.subject_code,
        sub.subject_name,
        sub.credits,
        cr.id_room,
        cr.room_code,
        cr.room_name,
        cr.building,
        cr.floor,
        se.id_session,
        se.session_date,
        se.session_number,
        se.status

      ORDER BY
        s.start_date DESC,
        FIELD(
          s.day_of_week,
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday'
        ),
        s.start_time ASC
      `,
      [teacherId, subjectFilter, classFilter]
    );

    const [[weekStats]] = await db.query(
      `
      SELECT
        COUNT(DISTINCT cc.id_course_class) AS totalClasses,
        COUNT(DISTINCT sub.id_subject) AS totalSubjects,
        COUNT(DISTINCT s.id_schedule) AS totalSchedules,

        IFNULL(
          SUM(
            CASE
              WHEN s.start_time IS NOT NULL AND s.end_time IS NOT NULL
              THEN TIME_TO_SEC(TIMEDIFF(s.end_time, s.start_time)) / 3600
              ELSE 0
            END
          ),
          0
        ) AS totalTeachingHours

      FROM CourseClass cc

      INNER JOIN Subject sub
        ON cc.id_subject = sub.id_subject

      LEFT JOIN Schedule s
        ON s.id_course_class = cc.id_course_class

      WHERE cc.id_teacher = ?
      `,
      [teacherId]
    );

    const [subjects] = await db.query(
      `
      SELECT DISTINCT
        sub.id_subject,
        sub.subject_code,
        sub.subject_name
      FROM CourseClass cc
      INNER JOIN Subject sub
        ON cc.id_subject = sub.id_subject
      WHERE cc.id_teacher = ?
      ORDER BY sub.subject_name ASC
      `,
      [teacherId]
    );

    const [classes] = await db.query(
      `
      SELECT DISTINCT
        cc.id_course_class,
        cc.class_code
      FROM CourseClass cc
      WHERE cc.id_teacher = ?
      ORDER BY cc.class_code ASC
      `,
      [teacherId]
    );

    return res.status(200).json({
      teacher,
      view,
      stats: {
        totalClasses: Number(weekStats.totalClasses || 0),
        totalSubjects: Number(weekStats.totalSubjects || 0),
        totalSchedules: Number(weekStats.totalSchedules || 0),
        totalTeachingHours: Number(weekStats.totalTeachingHours || 0).toFixed(
          1
        ),
      },
      subjects,
      classes,
      schedules,
    });
  } catch (error) {
    console.error("Lỗi lấy lịch dạy giáo viên:", error);

    return res.status(500).json({
      message: "Lỗi lấy lịch dạy giáo viên",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| 3. API: Lấy thông tin cá nhân giáo viên
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/profile/:teacherId
|--------------------------------------------------------------------------
*/
router.get("/profile/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;

    if (!teacherId) {
      return res.status(400).json({
        message: "Thiếu mã giáo viên",
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        t.id_teacher,
        t.teacher_code,
        t.full_name,
        t.gender,
        t.date_of_birth,
        t.phone,
        t.email,
        t.avatar,
        t.department_id,

        d.department_name,

        a.id_account,
        a.username,
        a.role,
        a.status AS account_status,

        t.created_at,
        t.updated_at

      FROM Teacher t

      LEFT JOIN Department d
        ON t.department_id = d.id_department

      LEFT JOIN Account a
        ON a.teacher_id = t.id_teacher

      WHERE t.id_teacher = ?

      LIMIT 1
      `,
      [teacherId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy giáo viên",
      });
    }

    return res.status(200).json({
      teacher: rows[0],
    });
  } catch (error) {
    console.error("Lỗi lấy thông tin cá nhân giáo viên:", error);

    return res.status(500).json({
      message: "Lỗi lấy thông tin cá nhân giáo viên",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| 4. API: Cập nhật thông tin cá nhân giáo viên
|--------------------------------------------------------------------------
| Method: PUT
| URL: /api/teachers/profile/:teacherId
|--------------------------------------------------------------------------
*/
router.put("/profile/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;

    const {
      full_name,
      gender,
      date_of_birth,
      phone,
      email,
      avatar,
    } = req.body;

    if (!teacherId) {
      return res.status(400).json({
        message: "Thiếu mã giáo viên",
      });
    }

    if (!full_name || !email || !phone) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ họ tên, email và số điện thoại",
      });
    }

    if (!validateGender(gender)) {
      return res.status(400).json({
        message: "Giới tính không hợp lệ",
      });
    }

    const [teachers] = await db.query(
      `
      SELECT id_teacher
      FROM Teacher
      WHERE id_teacher = ?
      LIMIT 1
      `,
      [teacherId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy giáo viên",
      });
    }

    const [duplicates] = await db.query(
      `
      SELECT id_teacher
      FROM Teacher
      WHERE email = ?
        AND id_teacher <> ?
      LIMIT 1
      `,
      [email.trim(), teacherId]
    );

    if (duplicates.length > 0) {
      return res.status(409).json({
        message: "Email đã được giáo viên khác sử dụng",
      });
    }

    await db.query(
      `
      UPDATE Teacher
      SET
        full_name = ?,
        gender = ?,
        date_of_birth = ?,
        phone = ?,
        email = ?,
        avatar = ?,
        updated_at = NOW()
      WHERE id_teacher = ?
      `,
      [
        full_name.trim(),
        normalizeGender(gender),
        date_of_birth || null,
        phone.trim(),
        email.trim(),
        avatar || null,
        teacherId,
      ]
    );

    await db.query(
      `
      UPDATE Account
      SET username = ?
      WHERE teacher_id = ?
      `,
      [email.trim(), teacherId]
    );

    return res.status(200).json({
      message: "Cập nhật thông tin cá nhân thành công",
      teacher: {
        id_teacher: Number(teacherId),
        full_name: full_name.trim(),
        gender: normalizeGender(gender),
        date_of_birth: date_of_birth || null,
        phone: phone.trim(),
        email: email.trim(),
        avatar: avatar || null,
      },
    });
  } catch (error) {
    console.error("Lỗi cập nhật thông tin cá nhân giáo viên:", error);

    if (error.code === "ER_DATA_TOO_LONG") {
      return res.status(400).json({
        message:
          "Dữ liệu quá dài. Có thể ảnh đại diện dạng Base64 vượt quá giới hạn cột avatar trong MySQL.",
        error: error.message,
        code: error.code,
      });
    }

    return res.status(500).json({
      message: "Lỗi cập nhật thông tin cá nhân giáo viên",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| 5. API: Đổi mật khẩu giáo viên
|--------------------------------------------------------------------------
| Method: PUT
| URL: /api/teachers/:teacherId/change-password
|--------------------------------------------------------------------------
*/
router.put("/:teacherId/change-password", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!teacherId) {
      return res.status(400).json({
        message: "Thiếu mã giáo viên",
      });
    }

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Mật khẩu mới phải có ít nhất 8 ký tự",
      });
    }

    const [accounts] = await db.query(
      `
      SELECT
        id_account,
        username,
        password,
        teacher_id,
        role,
        status
      FROM Account
      WHERE teacher_id = ?
        AND role = 'TEACHER'
      LIMIT 1
      `,
      [teacherId]
    );

    if (accounts.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy tài khoản giáo viên",
      });
    }

    const account = accounts[0];

    if (account.status === "LOCKED") {
      return res.status(403).json({
        message: "Tài khoản giáo viên đang bị khóa",
      });
    }

    if (String(account.password) !== String(oldPassword)) {
      return res.status(400).json({
        message: "Mật khẩu hiện tại không đúng",
      });
    }

    if (String(oldPassword) === String(newPassword)) {
      return res.status(400).json({
        message: "Mật khẩu mới không được trùng với mật khẩu hiện tại",
      });
    }

    await db.query(
      `
      UPDATE Account
      SET password = ?
      WHERE teacher_id = ?
        AND role = 'TEACHER'
      `,
      [newPassword, teacherId]
    );

    await db.query(
      `
      UPDATE Teacher
      SET password = ?, updated_at = NOW()
      WHERE id_teacher = ?
      `,
      [newPassword, teacherId]
    );

    return res.status(200).json({
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    console.error("Lỗi đổi mật khẩu giáo viên:", error);

    return res.status(500).json({
      message: "Lỗi đổi mật khẩu giáo viên",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| 6. API: Đánh dấu thông báo đã đọc
|--------------------------------------------------------------------------
| Method: PUT
| URL: /api/teachers/notifications/:notificationId/read
|--------------------------------------------------------------------------
*/
router.put("/notifications/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({
        message: "Thiếu mã thông báo",
      });
    }

    const [result] = await db.query(
      `
      UPDATE Notification
      SET is_read = 1
      WHERE id_notification = ?
      `,
      [notificationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Không tìm thấy thông báo",
      });
    }

    return res.status(200).json({
      message: "Đã đánh dấu thông báo là đã đọc",
    });
  } catch (error) {
    console.error("Lỗi đánh dấu thông báo:", error);

    return res.status(500).json({
      message: "Lỗi đánh dấu thông báo",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| 7. API: Lấy thông báo của giáo viên
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/:teacherId/notifications
|--------------------------------------------------------------------------
*/
router.get("/:teacherId/notifications", async (req, res) => {
  try {
    const { teacherId } = req.params;

    if (!teacherId) {
      return res.status(400).json({
        message: "Thiếu mã giáo viên",
      });
    }

    const [notifications] = await db.query(
      `
      SELECT
        id_notification,
        title,
        content,
        receiver_id,
        receiver_role,
        created_at,
        is_read
      FROM Notification
      WHERE receiver_role = 'TEACHER'
        AND (receiver_id = ? OR receiver_id IS NULL)
      ORDER BY created_at DESC
      `,
      [teacherId]
    );

    return res.status(200).json({
      notifications,
    });
  } catch (error) {
    console.error("Lỗi lấy thông báo giáo viên:", error);

    return res.status(500).json({
      message: "Lỗi lấy thông báo giáo viên",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| 8. API: Thống kê điểm danh giáo viên
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/statistics/:teacherId
|--------------------------------------------------------------------------
*/
router.get("/statistics/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { courseClassId = "all" } = req.query;

    if (!teacherId) {
      return res.status(400).json({
        message: "Thiếu mã giáo viên",
      });
    }

    const conditions = ["cc.id_teacher = ?"];
    const params = [teacherId];

    if (courseClassId && courseClassId !== "all") {
      conditions.push("cc.id_course_class = ?");
      params.push(courseClassId);
    }

    const whereClause = conditions.join(" AND ");

    const [[summary]] = await db.query(
      `
      SELECT
        COUNT(DISTINCT cc.id_course_class) AS total_classes,
        COUNT(DISTINCT sub.id_subject) AS total_subjects,
        COUNT(DISTINCT se.id_session) AS total_sessions,

        COUNT(DISTINCT CASE
          WHEN se.status = 'FINISHED' THEN se.id_session
        END) AS finished_sessions,

        COUNT(DISTINCT e.id_student) AS total_students,

        COUNT(DISTINCT a.id_attendance) AS total_attendance,

        COUNT(DISTINCT CASE
          WHEN a.status = 'PRESENT' THEN a.id_attendance
        END) AS present_count,

        COUNT(DISTINCT CASE
          WHEN a.status = 'LATE' THEN a.id_attendance
        END) AS late_count,

        COUNT(DISTINCT CASE
          WHEN a.status = 'ABSENT' THEN a.id_attendance
        END) AS absent_count

      FROM CourseClass cc

      INNER JOIN Subject sub
        ON cc.id_subject = sub.id_subject

      LEFT JOIN Schedule s
        ON s.id_course_class = cc.id_course_class

      LEFT JOIN Session se
        ON se.id_schedule = s.id_schedule

      LEFT JOIN Enrollment e
        ON e.id_course_class = cc.id_course_class
       AND e.status = 'STUDYING'

      LEFT JOIN Attendance a
        ON a.id_session = se.id_session
       AND a.id_student = e.id_student

      WHERE ${whereClause}
      `,
      params
    );

    const [byClass] = await db.query(
      `
      SELECT
        cc.id_course_class,
        cc.class_code,
        sub.subject_code,
        sub.subject_name,

        COUNT(DISTINCT e.id_student) AS total_students,
        COUNT(DISTINCT se.id_session) AS total_sessions,
        COUNT(DISTINCT a.id_attendance) AS total_attendance,

        COUNT(DISTINCT CASE
          WHEN a.status = 'PRESENT' THEN a.id_attendance
        END) AS present_count,

        COUNT(DISTINCT CASE
          WHEN a.status = 'LATE' THEN a.id_attendance
        END) AS late_count,

        COUNT(DISTINCT CASE
          WHEN a.status = 'ABSENT' THEN a.id_attendance
        END) AS absent_count,

        ROUND(
          CASE
            WHEN COUNT(DISTINCT a.id_attendance) = 0 THEN 0
            ELSE COUNT(DISTINCT CASE
              WHEN a.status IN ('PRESENT', 'LATE') THEN a.id_attendance
            END) / COUNT(DISTINCT a.id_attendance) * 100
          END,
          2
        ) AS attendance_percent

      FROM CourseClass cc

      INNER JOIN Subject sub
        ON cc.id_subject = sub.id_subject

      LEFT JOIN Enrollment e
        ON e.id_course_class = cc.id_course_class
       AND e.status = 'STUDYING'

      LEFT JOIN Schedule s
        ON s.id_course_class = cc.id_course_class

      LEFT JOIN Session se
        ON se.id_schedule = s.id_schedule

      LEFT JOIN Attendance a
        ON a.id_session = se.id_session
       AND a.id_student = e.id_student

      WHERE ${whereClause}

      GROUP BY
        cc.id_course_class,
        cc.class_code,
        sub.subject_code,
        sub.subject_name

      ORDER BY cc.class_code ASC
      `,
      params
    );

    const totalAttendance = Number(summary.total_attendance || 0);
    const attended =
      Number(summary.present_count || 0) + Number(summary.late_count || 0);

    return res.status(200).json({
      summary: {
        totalClasses: Number(summary.total_classes || 0),
        totalSubjects: Number(summary.total_subjects || 0),
        totalSessions: Number(summary.total_sessions || 0),
        finishedSessions: Number(summary.finished_sessions || 0),
        totalStudents: Number(summary.total_students || 0),
        totalAttendance,
        present: Number(summary.present_count || 0),
        late: Number(summary.late_count || 0),
        absent: Number(summary.absent_count || 0),
        attendancePercent: normalizePercent(
          totalAttendance > 0 ? (attended / totalAttendance) * 100 : 0
        ),
      },
      byClass,
    });
  } catch (error) {
    console.error("Lỗi thống kê điểm danh giáo viên:", error);

    return res.status(500).json({
      message: "Lỗi thống kê điểm danh giáo viên",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| 9. API: Lấy danh sách lớp học phần của giáo viên
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/classes/teacher/:teacherId
|--------------------------------------------------------------------------
*/
router.get("/classes/teacher/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { search = "", status = "all" } = req.query;

    if (!teacherId) {
      return res.status(400).json({
        message: "Thiếu mã giáo viên",
      });
    }

    const conditions = ["cc.id_teacher = ?"];
    const params = [teacherId];

    if (status && status !== "all") {
      conditions.push("cc.status = ?");
      params.push(status);
    }

    if (search) {
      conditions.push(`
        (
          cc.class_code LIKE ?
          OR sub.subject_code LIKE ?
          OR sub.subject_name LIKE ?
        )
      `);

      const keyword = `%${search}%`;
      params.push(keyword, keyword, keyword);
    }

    const whereClause = conditions.join(" AND ");

    const [classes] = await db.query(
      `
      SELECT
        cc.id_course_class,
        cc.class_code,
        cc.semester,
        cc.school_year,
        cc.group_number,
        cc.max_student,
        cc.status,

        sub.id_subject,
        sub.subject_code,
        sub.subject_name,
        sub.credits,

        t.id_teacher,
        t.teacher_code,
        t.full_name AS teacher_name,

        COUNT(DISTINCT s.id_schedule) AS total_schedules,
        COUNT(DISTINCT se.id_session) AS total_sessions,

        COUNT(DISTINCT CASE
          WHEN se.status = 'FINISHED' THEN se.id_session
        END) AS finished_sessions,

        COUNT(DISTINCT e.id_student) AS total_students,

        COUNT(DISTINCT a.id_attendance) AS total_attendance,

        COUNT(DISTINCT CASE
          WHEN a.status = 'PRESENT' THEN a.id_attendance
        END) AS present_count,

        COUNT(DISTINCT CASE
          WHEN a.status = 'LATE' THEN a.id_attendance
        END) AS late_count,

        COUNT(DISTINCT CASE
          WHEN a.status = 'ABSENT' THEN a.id_attendance
        END) AS absent_count,

        COUNT(DISTINCT CASE
          WHEN a.status IN ('PRESENT', 'LATE') THEN a.id_attendance
        END) AS attended_count,

        ROUND(
          CASE
            WHEN COUNT(DISTINCT a.id_attendance) = 0 THEN 0
            ELSE COUNT(DISTINCT CASE
              WHEN a.status IN ('PRESENT', 'LATE') THEN a.id_attendance
            END) / COUNT(DISTINCT a.id_attendance) * 100
          END,
          2
        ) AS attendance_percent

      FROM CourseClass cc

      INNER JOIN Subject sub
        ON cc.id_subject = sub.id_subject

      INNER JOIN Teacher t
        ON cc.id_teacher = t.id_teacher

      LEFT JOIN Schedule s
        ON s.id_course_class = cc.id_course_class

      LEFT JOIN Session se
        ON se.id_schedule = s.id_schedule

      LEFT JOIN Enrollment e
        ON e.id_course_class = cc.id_course_class
       AND e.status = 'STUDYING'

      LEFT JOIN Attendance a
        ON a.id_session = se.id_session
       AND a.id_student = e.id_student

      WHERE ${whereClause}

      GROUP BY
        cc.id_course_class,
        cc.class_code,
        cc.semester,
        cc.school_year,
        cc.group_number,
        cc.max_student,
        cc.status,
        sub.id_subject,
        sub.subject_code,
        sub.subject_name,
        sub.credits,
        t.id_teacher,
        t.teacher_code,
        t.full_name

      ORDER BY
        cc.school_year DESC,
        cc.semester DESC,
        cc.class_code ASC
      `,
      params
    );

    return res.status(200).json({
      classes,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách lớp học của giáo viên:", error);

    return res.status(500).json({
      message: "Lỗi lấy danh sách lớp học của giáo viên",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| 10. API: Lấy chi tiết lớp học phần
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/classes/:courseClassId
|--------------------------------------------------------------------------
*/
router.get("/classes/:courseClassId", async (req, res) => {
  try {
    const { courseClassId } = req.params;

    if (!courseClassId) {
      return res.status(400).json({
        message: "Thiếu mã lớp học phần",
      });
    }

    const [rows] = await db.query(
      `
      SELECT 
        cc.id_course_class,
        cc.class_code,
        cc.semester,
        cc.school_year,
        cc.group_number,
        cc.max_student,
        cc.status,

        sub.id_subject,
        sub.subject_code,
        sub.subject_name,
        sub.credits,

        t.id_teacher,
        t.full_name AS teacher_name,

        MIN(cr.id_room) AS id_room,
        MIN(cr.room_code) AS room_code,
        MIN(cr.room_name) AS room_name,
        MIN(cr.building) AS building,
        MIN(cr.floor) AS floor,

        COUNT(DISTINCT e.id_student) AS total_students,

        COUNT(DISTINCT a.id_attendance) AS total_attendance,

        COUNT(DISTINCT CASE
          WHEN a.status IN ('PRESENT', 'LATE') THEN a.id_attendance
        END) AS attended_count,

        ROUND(
          CASE
            WHEN COUNT(DISTINCT a.id_attendance) = 0 THEN 0
            ELSE COUNT(DISTINCT CASE
              WHEN a.status IN ('PRESENT', 'LATE') THEN a.id_attendance
            END) / COUNT(DISTINCT a.id_attendance) * 100
          END,
          2
        ) AS attendance_percent

      FROM CourseClass cc

      INNER JOIN Subject sub
        ON cc.id_subject = sub.id_subject

      INNER JOIN Teacher t
        ON cc.id_teacher = t.id_teacher

      LEFT JOIN Schedule s
        ON s.id_course_class = cc.id_course_class

      LEFT JOIN ClassRoom cr
        ON s.id_room = cr.id_room

      LEFT JOIN Enrollment e
        ON e.id_course_class = cc.id_course_class
       AND e.status = 'STUDYING'

      LEFT JOIN Session se
        ON se.id_schedule = s.id_schedule

      LEFT JOIN Attendance a
        ON a.id_session = se.id_session
       AND a.id_student = e.id_student

      WHERE cc.id_course_class = ?

      GROUP BY
        cc.id_course_class,
        cc.class_code,
        cc.semester,
        cc.school_year,
        cc.group_number,
        cc.max_student,
        cc.status,
        sub.id_subject,
        sub.subject_code,
        sub.subject_name,
        sub.credits,
        t.id_teacher,
        t.full_name

      LIMIT 1
      `,
      [courseClassId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy lớp học phần",
      });
    }

    return res.status(200).json({
      classDetail: rows[0],
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết lớp học:", error);

    return res.status(500).json({
      message: "Lỗi lấy chi tiết lớp học",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| 11. API: Lấy danh sách sinh viên trong lớp học phần
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/classes/:courseClassId/students
|--------------------------------------------------------------------------
*/
router.get("/classes/:courseClassId/students", async (req, res) => {
  try {
    const { courseClassId } = req.params;
    const { search = "" } = req.query;

    if (!courseClassId) {
      return res.status(400).json({
        message: "Thiếu mã lớp học phần",
      });
    }

    const keyword = `%${search}%`;

    const [students] = await db.query(
      `
      SELECT 
        st.id_student,
        st.student_code,
        st.full_name,
        st.gender,
        st.date_of_birth,
        st.phone,
        st.email,
        st.avatar,
        st.faculty,
        st.class_name,
        st.course_year,
        st.status,

        e.id_enrollment,
        e.enroll_date,
        e.status AS enrollment_status,

        MAX(fd.id_face) AS id_face,
        MAX(fd.face_image) AS face_image,
        MAX(fd.model_version) AS model_version,

        COUNT(DISTINCT a.id_attendance) AS total_attendance,

        COUNT(DISTINCT CASE
          WHEN a.status = 'PRESENT' THEN a.id_attendance
        END) AS present_count,

        COUNT(DISTINCT CASE
          WHEN a.status = 'LATE' THEN a.id_attendance
        END) AS late_count,

        COUNT(DISTINCT CASE
          WHEN a.status = 'ABSENT' THEN a.id_attendance
        END) AS absent_count,

        ROUND(
          CASE
            WHEN COUNT(DISTINCT a.id_attendance) = 0 THEN 0
            ELSE COUNT(DISTINCT CASE
              WHEN a.status IN ('PRESENT', 'LATE') THEN a.id_attendance
            END) / COUNT(DISTINCT a.id_attendance) * 100
          END,
          2
        ) AS attendance_percent

      FROM Enrollment e

      INNER JOIN Student st
        ON e.id_student = st.id_student

      LEFT JOIN FaceData fd
        ON fd.id_student = st.id_student

      LEFT JOIN CourseClass cc
        ON e.id_course_class = cc.id_course_class

      LEFT JOIN Schedule s
        ON s.id_course_class = cc.id_course_class

      LEFT JOIN Session se
        ON se.id_schedule = s.id_schedule

      LEFT JOIN Attendance a
        ON a.id_session = se.id_session
       AND a.id_student = st.id_student

      WHERE e.id_course_class = ?
        AND e.status = 'STUDYING'
        AND (
          st.student_code LIKE ?
          OR st.full_name LIKE ?
          OR st.email LIKE ?
          OR st.class_name LIKE ?
        )

      GROUP BY
        st.id_student,
        st.student_code,
        st.full_name,
        st.gender,
        st.date_of_birth,
        st.phone,
        st.email,
        st.avatar,
        st.faculty,
        st.class_name,
        st.course_year,
        st.status,
        e.id_enrollment,
        e.enroll_date,
        e.status

      ORDER BY st.student_code ASC
      `,
      [courseClassId, keyword, keyword, keyword, keyword]
    );

    return res.status(200).json({
      students,
    });
  } catch (error) {
    console.error("Lỗi lấy sinh viên trong lớp:", error);

    return res.status(500).json({
      message: "Lỗi lấy danh sách sinh viên trong lớp",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| 12. API: Lấy lịch học của lớp học phần
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/classes/:courseClassId/schedules
|--------------------------------------------------------------------------
*/
router.get("/classes/:courseClassId/schedules", async (req, res) => {
  try {
    const { courseClassId } = req.params;

    if (!courseClassId) {
      return res.status(400).json({
        message: "Thiếu mã lớp học phần",
      });
    }

    const [schedules] = await db.query(
      `
      SELECT
        s.id_schedule,
        s.id_course_class,
        s.id_room,
        s.day_of_week,
        s.start_time,
        s.end_time,
        s.start_date,
        s.end_date,

        cr.room_code,
        cr.room_name,
        cr.building,
        cr.floor

      FROM Schedule s

      LEFT JOIN ClassRoom cr
        ON s.id_room = cr.id_room

      WHERE s.id_course_class = ?

      ORDER BY
        FIELD(
          s.day_of_week,
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday'
        ),
        s.start_time ASC
      `,
      [courseClassId]
    );

    return res.status(200).json({
      schedules,
    });
  } catch (error) {
    console.error("Lỗi lấy lịch học của lớp:", error);

    return res.status(500).json({
      message: "Lỗi lấy lịch học của lớp",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| 13. API: Lấy danh sách buổi học của lớp học phần
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/classes/:courseClassId/sessions
|--------------------------------------------------------------------------
*/
router.get("/classes/:courseClassId/sessions", async (req, res) => {
  try {
    const { courseClassId } = req.params;

    if (!courseClassId) {
      return res.status(400).json({
        message: "Thiếu mã lớp học phần",
      });
    }

    const [sessions] = await db.query(
      `
      SELECT
        se.id_session,
        se.id_schedule,
        se.session_date,
        se.session_number,
        se.status AS session_status,

        s.day_of_week,
        s.start_time,
        s.end_time,

        cc.id_course_class,
        cc.class_code,

        sub.id_subject,
        sub.subject_code,
        sub.subject_name,

        cr.id_room,
        cr.room_code,
        cr.room_name,

        COUNT(DISTINCT e.id_student) AS totalStudents,

        COUNT(DISTINCT CASE
          WHEN a.status IN ('PRESENT', 'LATE') THEN a.id_student
        END) AS attendedStudents,

        COUNT(DISTINCT CASE
          WHEN a.status = 'PRESENT' THEN a.id_student
        END) AS present_count,

        COUNT(DISTINCT CASE
          WHEN a.status = 'LATE' THEN a.id_student
        END) AS late_count,

        COUNT(DISTINCT CASE
          WHEN a.status = 'ABSENT' THEN a.id_student
        END) AS absent_count

      FROM Session se

      INNER JOIN Schedule s
        ON se.id_schedule = s.id_schedule

      INNER JOIN CourseClass cc
        ON s.id_course_class = cc.id_course_class

      INNER JOIN Subject sub
        ON cc.id_subject = sub.id_subject

      LEFT JOIN ClassRoom cr
        ON s.id_room = cr.id_room

      LEFT JOIN Enrollment e
        ON e.id_course_class = cc.id_course_class
       AND e.status = 'STUDYING'

      LEFT JOIN Attendance a
        ON a.id_session = se.id_session
       AND a.id_student = e.id_student

      WHERE cc.id_course_class = ?

      GROUP BY
        se.id_session,
        se.id_schedule,
        se.session_date,
        se.session_number,
        se.status,
        s.day_of_week,
        s.start_time,
        s.end_time,
        cc.id_course_class,
        cc.class_code,
        sub.id_subject,
        sub.subject_code,
        sub.subject_name,
        cr.id_room,
        cr.room_code,
        cr.room_name

      ORDER BY se.session_date DESC, s.start_time ASC
      `,
      [courseClassId]
    );

    return res.status(200).json({
      sessions,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách buổi học:", error);

    return res.status(500).json({
      message: "Lỗi lấy danh sách buổi học",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| 14. API: Lấy danh sách buổi học của giáo viên
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/sessions/teacher/:teacherId
|--------------------------------------------------------------------------
*/
router.get("/sessions/teacher/:teacherId", async (req, res) => {
  try {
    const { teacherId } = req.params;
    const {
      date = "",
      classCode = "all",
      subject = "all",
      status = "all",
      search = "",
    } = req.query;

    if (!teacherId) {
      return res.status(400).json({
        message: "Thiếu mã giáo viên",
      });
    }

    const conditions = ["cc.id_teacher = ?"];
    const params = [teacherId];

    if (date) {
      conditions.push(`
        (
          se.session_date = ?
          OR (
            se.id_session IS NULL
            AND ? BETWEEN s.start_date AND s.end_date
          )
        )
      `);

      params.push(date, date);
    }

    if (classCode && classCode !== "all") {
      conditions.push("cc.class_code = ?");
      params.push(classCode);
    }

    if (subject && subject !== "all") {
      conditions.push("sub.subject_name = ?");
      params.push(subject);
    }

    if (status && status !== "all") {
      if (status === "NOT_CREATED") {
        conditions.push("se.id_session IS NULL");
      } else {
        conditions.push("se.status = ?");
        params.push(status);
      }
    }

    if (search) {
      conditions.push(`
        (
          cc.class_code LIKE ?
          OR sub.subject_name LIKE ?
          OR sub.subject_code LIKE ?
          OR cr.room_name LIKE ?
          OR cr.room_code LIKE ?
        )
      `);

      const keyword = `%${search}%`;
      params.push(keyword, keyword, keyword, keyword, keyword);
    }

    const whereClause = conditions.join(" AND ");

    const [sessions] = await db.query(
      `
      SELECT
        s.id_schedule,
        s.day_of_week,
        s.start_time,
        s.end_time,
        s.start_date,
        s.end_date,

        cc.id_course_class,
        cc.class_code,

        sub.id_subject,
        sub.subject_code,
        sub.subject_name,

        cr.id_room,
        cr.room_code,
        cr.room_name,

        se.id_session,
        se.session_date,
        se.session_number,
        se.status AS session_status,

        COUNT(DISTINCT e.id_student) AS total_students,

        COUNT(DISTINCT CASE
          WHEN a.status = 'PRESENT' THEN a.id_attendance
        END) AS present_students,

        COUNT(DISTINCT CASE
          WHEN a.status = 'LATE' THEN a.id_attendance
        END) AS late_students,

        COUNT(DISTINCT CASE
          WHEN a.status = 'ABSENT' THEN a.id_attendance
        END) AS absent_students,

        COUNT(DISTINCT CASE
          WHEN a.status IN ('PRESENT', 'LATE') THEN a.id_attendance
        END) AS attended_students

      FROM Schedule s

      INNER JOIN CourseClass cc
        ON s.id_course_class = cc.id_course_class

      INNER JOIN Subject sub
        ON cc.id_subject = sub.id_subject

      LEFT JOIN ClassRoom cr
        ON s.id_room = cr.id_room

      LEFT JOIN Session se
        ON se.id_schedule = s.id_schedule
       AND (
          ? = ''
          OR se.session_date = ?
       )

      LEFT JOIN Enrollment e
        ON e.id_course_class = cc.id_course_class
       AND e.status = 'STUDYING'

      LEFT JOIN Attendance a
        ON a.id_session = se.id_session
       AND a.id_student = e.id_student

      WHERE ${whereClause}

      GROUP BY
        s.id_schedule,
        s.day_of_week,
        s.start_time,
        s.end_time,
        s.start_date,
        s.end_date,
        cc.id_course_class,
        cc.class_code,
        sub.id_subject,
        sub.subject_code,
        sub.subject_name,
        cr.id_room,
        cr.room_code,
        cr.room_name,
        se.id_session,
        se.session_date,
        se.session_number,
        se.status

      ORDER BY
        COALESCE(se.session_date, ?) ASC,
        s.start_time ASC
      `,
      [date, date, ...params, date || new Date().toISOString().slice(0, 10)]
    );

    return res.status(200).json({
      sessions,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách buổi học giáo viên:", error);

    return res.status(500).json({
      message: "Lỗi lấy danh sách buổi học giáo viên",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| 15. API: Tạo buổi học từ lịch học
|--------------------------------------------------------------------------
| Method: POST
| URL: /api/teachers/sessions
|--------------------------------------------------------------------------
*/
router.post("/sessions", async (req, res) => {
  const { id_schedule, session_date, session_number } = req.body;

  if (!id_schedule || !session_date) {
    return res.status(400).json({
      message: "Thiếu id_schedule hoặc session_date",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [[schedule]] = await connection.query(
      `
      SELECT
        s.id_schedule,
        s.id_course_class,
        cc.class_code
      FROM Schedule s
      INNER JOIN CourseClass cc
        ON s.id_course_class = cc.id_course_class
      WHERE s.id_schedule = ?
      LIMIT 1
      `,
      [id_schedule]
    );

    if (!schedule) {
      await connection.rollback();

      return res.status(404).json({
        message: "Không tìm thấy lịch học",
      });
    }

    const [existingSessions] = await connection.query(
      `
      SELECT id_session
      FROM Session
      WHERE id_schedule = ?
        AND session_date = ?
      LIMIT 1
      `,
      [id_schedule, session_date]
    );

    if (existingSessions.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Buổi học này đã tồn tại",
        id_session: existingSessions[0].id_session,
      });
    }

    const [sessionResult] = await connection.query(
      `
      INSERT INTO Session (
        id_schedule,
        session_date,
        session_number,
        status
      )
      VALUES (?, ?, ?, 'NOT_STARTED')
      `,
      [id_schedule, session_date, session_number || 1]
    );

    const sessionId = sessionResult.insertId;

    await connection.query(
      `
      INSERT INTO Attendance (
        id_session,
        id_student,
        status,
        check_in_time,
        note
      )
      SELECT
        ? AS id_session,
        e.id_student,
        'ABSENT' AS status,
        NULL AS check_in_time,
        NULL AS note
      FROM Enrollment e
      WHERE e.id_course_class = ?
        AND e.status = 'STUDYING'
      `,
      [sessionId, schedule.id_course_class]
    );

    await connection.commit();

    return res.status(201).json({
      message: "Tạo buổi học thành công",
      id_session: sessionId,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi tạo buổi học:", error);

    return res.status(500).json({
      message: "Lỗi tạo buổi học",
      error: error.message,
      code: error.code,
    });
  } finally {
    connection.release();
  }
});

/*
|--------------------------------------------------------------------------
| 16. API: Lấy chi tiết buổi học
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/sessions/:sessionId
|--------------------------------------------------------------------------
*/
router.get("/sessions/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        message: "Thiếu mã buổi học",
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        se.id_session,
        se.id_schedule,
        se.session_date,
        se.session_number,
        se.status,

        s.day_of_week,
        s.start_time,
        s.end_time,
        s.start_date,
        s.end_date,

        cc.id_course_class,
        cc.class_code,
        cc.semester,
        cc.school_year,
        cc.group_number,
        cc.status AS course_status,

        sub.id_subject,
        sub.subject_code,
        sub.subject_name,
        sub.credits,

        t.id_teacher,
        t.full_name AS teacher_name,

        cr.id_room,
        cr.room_code,
        cr.room_name,
        cr.building,
        cr.floor

      FROM Session se

      INNER JOIN Schedule s
        ON se.id_schedule = s.id_schedule

      INNER JOIN CourseClass cc
        ON s.id_course_class = cc.id_course_class

      INNER JOIN Subject sub
        ON cc.id_subject = sub.id_subject

      INNER JOIN Teacher t
        ON cc.id_teacher = t.id_teacher

      LEFT JOIN ClassRoom cr
        ON s.id_room = cr.id_room

      WHERE se.id_session = ?

      LIMIT 1
      `,
      [sessionId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy buổi học",
      });
    }

    return res.status(200).json({
      session: rows[0],
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết buổi học:", error);

    return res.status(500).json({
      message: "Lỗi lấy chi tiết buổi học",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| 17. API: Cập nhật trạng thái buổi học
|--------------------------------------------------------------------------
| Method: PUT
| URL: /api/teachers/sessions/:sessionId/status
|--------------------------------------------------------------------------
*/
router.put("/sessions/:sessionId/status", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        message: "Thiếu mã buổi học",
      });
    }

    if (!validateSessionStatus(status)) {
      return res.status(400).json({
        message: "Trạng thái buổi học không hợp lệ",
      });
    }

    const [result] = await db.query(
      `
      UPDATE Session
      SET status = ?
      WHERE id_session = ?
      `,
      [status, sessionId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Không tìm thấy buổi học",
      });
    }

    return res.status(200).json({
      message: "Cập nhật trạng thái buổi học thành công",
    });
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái buổi học:", error);

    return res.status(500).json({
      message: "Lỗi cập nhật trạng thái buổi học",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| 18. API: Lấy danh sách điểm danh theo buổi học
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/sessions/:sessionId/attendance
|--------------------------------------------------------------------------
*/
router.get("/sessions/:sessionId/attendance", async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        message: "Thiếu mã buổi học",
      });
    }

    const [attendances] = await db.query(
      `
      SELECT
        a.id_attendance,
        a.id_session,
        a.id_student,
        a.status,
        a.check_in_time,
        a.confidence_score,
        a.face_image AS attendance_face_image,
        a.note,

        st.student_code,
        st.full_name,
        st.email,
        st.phone,
        st.avatar,
        st.class_name,
        st.faculty,
        st.course_year,

        MAX(fd.id_face) AS id_face,
        MAX(fd.face_image) AS face_image,
        MAX(fd.model_version) AS model_version

      FROM Attendance a

      INNER JOIN Student st
        ON a.id_student = st.id_student

      LEFT JOIN FaceData fd
        ON fd.id_student = st.id_student

      WHERE a.id_session = ?

      GROUP BY
        a.id_attendance,
        a.id_session,
        a.id_student,
        a.status,
        a.check_in_time,
        a.confidence_score,
        a.face_image,
        a.note,
        st.student_code,
        st.full_name,
        st.email,
        st.phone,
        st.avatar,
        st.class_name,
        st.faculty,
        st.course_year

      ORDER BY st.student_code ASC
      `,
      [sessionId]
    );

    return res.status(200).json({
      attendances,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách điểm danh:", error);

    return res.status(500).json({
      message: "Lỗi lấy danh sách điểm danh",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| 19. API: Cập nhật điểm danh 1 sinh viên
|--------------------------------------------------------------------------
| Method: PUT
| URL: /api/teachers/attendance/:attendanceId
|--------------------------------------------------------------------------
*/
router.put("/attendance/:attendanceId", async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { status, check_in_time, note } = req.body;

    if (!attendanceId) {
      return res.status(400).json({
        message: "Thiếu mã điểm danh",
      });
    }

    if (!validateAttendanceStatus(status)) {
      return res.status(400).json({
        message: "Trạng thái điểm danh không hợp lệ",
      });
    }

    const finalCheckInTime =
      status === "PRESENT" || status === "LATE"
        ? check_in_time || new Date()
        : null;

    const [result] = await db.query(
      `
      UPDATE Attendance
      SET
        status = ?,
        check_in_time = ?,
        note = ?
      WHERE id_attendance = ?
      `,
      [status, finalCheckInTime, note || null, attendanceId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Không tìm thấy bản ghi điểm danh",
      });
    }

    return res.status(200).json({
      message: "Cập nhật điểm danh thành công",
    });
  } catch (error) {
    console.error("Lỗi cập nhật điểm danh:", error);

    return res.status(500).json({
      message: "Lỗi cập nhật điểm danh",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| 20. API: Cập nhật điểm danh hàng loạt
|--------------------------------------------------------------------------
| Method: PUT
| URL: /api/teachers/sessions/:sessionId/attendance/bulk
|--------------------------------------------------------------------------
*/
router.put("/sessions/:sessionId/attendance/bulk", async (req, res) => {
  const { sessionId } = req.params;
  const { attendances = [] } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      message: "Thiếu mã buổi học",
    });
  }

  if (!Array.isArray(attendances)) {
    return res.status(400).json({
      message: "Dữ liệu điểm danh phải là mảng",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    for (const item of attendances) {
      const attendanceId = item.id_attendance || item.idAttendance;
      const studentId = item.id_student || item.idStudent;
      const status = item.status || "ABSENT";
      const note = item.note || null;

      if (!validateAttendanceStatus(status)) {
        await connection.rollback();

        return res.status(400).json({
          message: `Trạng thái điểm danh không hợp lệ: ${status}`,
        });
      }

      const checkInTime =
        status === "PRESENT" || status === "LATE"
          ? item.check_in_time || item.checkInTime || new Date()
          : null;

      if (attendanceId) {
        await connection.query(
          `
          UPDATE Attendance
          SET
            status = ?,
            check_in_time = ?,
            note = ?
          WHERE id_attendance = ?
            AND id_session = ?
          `,
          [status, checkInTime, note, attendanceId, sessionId]
        );
      } else if (studentId) {
        const [existing] = await connection.query(
          `
          SELECT id_attendance
          FROM Attendance
          WHERE id_session = ?
            AND id_student = ?
          LIMIT 1
          `,
          [sessionId, studentId]
        );

        if (existing.length > 0) {
          await connection.query(
            `
            UPDATE Attendance
            SET
              status = ?,
              check_in_time = ?,
              note = ?
            WHERE id_attendance = ?
            `,
            [status, checkInTime, note, existing[0].id_attendance]
          );
        } else {
          await connection.query(
            `
            INSERT INTO Attendance (
              id_session,
              id_student,
              status,
              check_in_time,
              note
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [sessionId, studentId, status, checkInTime, note]
          );
        }
      }
    }

    await connection.commit();

    return res.status(200).json({
      message: "Cập nhật điểm danh hàng loạt thành công",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi cập nhật điểm danh hàng loạt:", error);

    return res.status(500).json({
      message: "Lỗi cập nhật điểm danh hàng loạt",
      error: error.message,
      code: error.code,
    });
  } finally {
    connection.release();
  }
});

/*
|--------------------------------------------------------------------------
| 21. API: Báo cáo điểm danh theo buổi học
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/sessions/:sessionId/attendance/report
|--------------------------------------------------------------------------
*/
router.get("/sessions/:sessionId/attendance/report", async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        message: "Thiếu mã buổi học",
      });
    }

    const [[summary]] = await db.query(
      `
      SELECT
        COUNT(*) AS total,
        COUNT(CASE WHEN status = 'PRESENT' THEN 1 END) AS present,
        COUNT(CASE WHEN status = 'LATE' THEN 1 END) AS late,
        COUNT(CASE WHEN status = 'ABSENT' THEN 1 END) AS absent
      FROM Attendance
      WHERE id_session = ?
      `,
      [sessionId]
    );

    const [attendances] = await db.query(
      `
      SELECT
        a.id_attendance,
        a.id_session,
        a.id_student,
        a.status,
        a.check_in_time,
        a.note,

        st.student_code,
        st.full_name,
        st.email,
        st.class_name

      FROM Attendance a

      INNER JOIN Student st
        ON a.id_student = st.id_student

      WHERE a.id_session = ?

      ORDER BY st.student_code ASC
      `,
      [sessionId]
    );

    const total = Number(summary.total || 0);
    const attended = Number(summary.present || 0) + Number(summary.late || 0);

    return res.status(200).json({
      summary: {
        total,
        present: Number(summary.present || 0),
        late: Number(summary.late || 0),
        absent: Number(summary.absent || 0),
        attendancePercent: normalizePercent(
          total > 0 ? (attended / total) * 100 : 0
        ),
      },
      attendances,
    });
  } catch (error) {
    console.error("Lỗi lấy báo cáo điểm danh:", error);

    return res.status(500).json({
      message: "Lỗi lấy báo cáo điểm danh",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| 22. API: Lịch sử nhận diện theo buổi học
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/sessions/:sessionId/recognition-history
|--------------------------------------------------------------------------
| Note:
| - Bảng RecognitionHistory hiện tại không có id_session.
| - Vì vậy API này lấy lịch sử theo ngày của buổi học và camera/phòng liên quan.
|--------------------------------------------------------------------------
*/
router.get("/sessions/:sessionId/recognition-history", async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        message: "Thiếu mã buổi học",
      });
    }

    const [[session]] = await db.query(
      `
      SELECT
        se.id_session,
        se.session_date,
        s.id_room
      FROM Session se
      INNER JOIN Schedule s
        ON se.id_schedule = s.id_schedule
      WHERE se.id_session = ?
      LIMIT 1
      `,
      [sessionId]
    );

    if (!session) {
      return res.status(404).json({
        message: "Không tìm thấy buổi học",
      });
    }

    const [history] = await db.query(
      `
      SELECT
        rh.id_history,
        rh.id_student,
        rh.capture_time,
        rh.confidence,
        rh.camera_id,
        rh.result,
        rh.image_path,

        st.student_code,
        st.full_name,

        c.camera_name,
        c.camera_ip,
        c.location

      FROM RecognitionHistory rh

      LEFT JOIN Student st
        ON rh.id_student = st.id_student

      LEFT JOIN CameraDevice c
        ON rh.camera_id = c.id_camera

      WHERE DATE(rh.capture_time) = ?
        AND (
          c.id_room = ?
          OR ? IS NULL
        )

      ORDER BY rh.capture_time DESC
      `,
      [session.session_date, session.id_room, session.id_room]
    );

    return res.status(200).json({
      history,
    });
  } catch (error) {
    console.error("Lỗi lấy lịch sử nhận diện:", error);

    return res.status(500).json({
      message: "Lỗi lấy lịch sử nhận diện",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| 23. API: Lấy danh sách giáo viên
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers
|--------------------------------------------------------------------------
*/
router.get("/", async (req, res) => {
  try {
    const search = req.query.search || "";

    const [teachers] = await db.query(
      `
      SELECT
        t.id_teacher,
        t.teacher_code,
        t.full_name,
        t.gender,
        t.date_of_birth,
        t.phone,
        t.email,
        t.avatar,
        t.department_id,

        d.id_department,
        d.department_name,

        a.id_account,
        a.username,
        a.role,
        a.status AS account_status,

        t.created_at,
        t.updated_at,

        CASE
          WHEN a.status = 'ACTIVE' THEN 'Đang hoạt động'
          WHEN a.status = 'LOCKED' THEN 'Đã khóa'
          ELSE 'Chưa có tài khoản'
        END AS work_status,

        CASE
          WHEN a.status = 'ACTIVE' THEN 'active'
          WHEN a.status = 'LOCKED' THEN 'locked'
          ELSE 'inactive'
        END AS status_type

      FROM Teacher t

      LEFT JOIN Department d
        ON t.department_id = d.id_department

      LEFT JOIN Account a
        ON a.teacher_id = t.id_teacher

      WHERE
        t.full_name LIKE ?
        OR t.teacher_code LIKE ?
        OR t.email LIKE ?
        OR t.phone LIKE ?
        OR d.department_name LIKE ?

      ORDER BY t.id_teacher DESC
      `,
      [
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
      ]
    );

    return res.status(200).json(teachers);
  } catch (error) {
    console.error("Lỗi lấy danh sách giáo viên:", error);

    return res.status(500).json({
      message: "Lỗi lấy danh sách giáo viên",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| 24. API: Thêm giáo viên
|--------------------------------------------------------------------------
| Method: POST
| URL: /api/teachers
|--------------------------------------------------------------------------
*/
router.post("/", async (req, res) => {
  const {
    teacher_code,
    full_name,
    gender,
    date_of_birth,
    phone,
    email,
    avatar,
    password,
    department_id,
    account_status,
  } = req.body;

  if (!teacher_code || !full_name || !email || !phone || !password) {
    return res.status(400).json({
      message:
        "Vui lòng nhập đầy đủ mã giáo viên, họ tên, email, số điện thoại và mật khẩu",
    });
  }

  if (!department_id) {
    return res.status(400).json({
      message: "Vui lòng chọn khoa/bộ môn",
    });
  }

  if (!validateGender(gender)) {
    return res.status(400).json({
      message: "Giới tính không hợp lệ",
    });
  }

  if (!validateAccountStatus(account_status)) {
    return res.status(400).json({
      message: "Trạng thái tài khoản không hợp lệ",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [departments] = await connection.query(
      `
      SELECT id_department
      FROM Department
      WHERE id_department = ?
      LIMIT 1
      `,
      [Number(department_id)]
    );

    if (departments.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Khoa/bộ môn không tồn tại",
      });
    }

    const [existingTeachers] = await connection.query(
      `
      SELECT id_teacher
      FROM Teacher
      WHERE teacher_code = ? OR email = ?
      LIMIT 1
      `,
      [teacher_code.trim(), email.trim()]
    );

    if (existingTeachers.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Mã giáo viên hoặc email đã tồn tại",
      });
    }

    const [existingAccounts] = await connection.query(
      `
      SELECT id_account
      FROM Account
      WHERE username = ?
      LIMIT 1
      `,
      [email.trim()]
    );

    if (existingAccounts.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Tài khoản giáo viên đã tồn tại",
      });
    }

    const [teacherResult] = await connection.query(
      `
      INSERT INTO Teacher (
        teacher_code,
        full_name,
        gender,
        date_of_birth,
        phone,
        email,
        avatar,
        password,
        department_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        teacher_code.trim(),
        full_name.trim(),
        normalizeGender(gender),
        date_of_birth || null,
        phone.trim(),
        email.trim(),
        avatar || null,
        password,
        Number(department_id),
      ]
    );

    const teacherId = teacherResult.insertId;

    await connection.query(
      `
      INSERT INTO Account (
        username,
        password,
        role,
        teacher_id,
        student_id,
        status
      )
      VALUES (?, ?, 'TEACHER', ?, NULL, ?)
      `,
      [email.trim(), password, teacherId, account_status || "ACTIVE"]
    );

    await connection.commit();

    return res.status(201).json({
      message: "Thêm giáo viên thành công",
      id_teacher: teacherId,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi thêm giáo viên:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Mã giáo viên, email hoặc tài khoản đã tồn tại",
        error: error.message,
        code: error.code,
      });
    }

    if (error.code === "ER_DATA_TOO_LONG") {
      return res.status(400).json({
        message:
          "Dữ liệu quá dài. Có thể avatar dạng Base64 vượt quá giới hạn cột trong MySQL.",
        error: error.message,
        code: error.code,
      });
    }

    return res.status(500).json({
      message: "Lỗi thêm giáo viên",
      error: error.message,
      code: error.code,
    });
  } finally {
    connection.release();
  }
});

/*
|--------------------------------------------------------------------------
| 25. API: Lấy chi tiết giáo viên
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/:id
|--------------------------------------------------------------------------
| Note:
| - Route này phải đặt gần cuối file.
| - Không đặt trên /profile, /classes, /sessions, /statistics.
|--------------------------------------------------------------------------
*/
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [teachers] = await db.query(
      `
      SELECT
        t.id_teacher,
        t.teacher_code,
        t.full_name,
        t.gender,
        t.date_of_birth,
        t.phone,
        t.email,
        t.avatar,
        t.department_id,

        d.id_department,
        d.department_name,

        a.id_account,
        a.username,
        a.role,
        a.status AS account_status,

        t.created_at,
        t.updated_at,

        CASE
          WHEN a.status = 'ACTIVE' THEN 'Đang hoạt động'
          WHEN a.status = 'LOCKED' THEN 'Đã khóa'
          ELSE 'Chưa có tài khoản'
        END AS work_status,

        CASE
          WHEN a.status = 'ACTIVE' THEN 'active'
          WHEN a.status = 'LOCKED' THEN 'locked'
          ELSE 'inactive'
        END AS status_type

      FROM Teacher t

      LEFT JOIN Department d
        ON t.department_id = d.id_department

      LEFT JOIN Account a
        ON a.teacher_id = t.id_teacher

      WHERE t.id_teacher = ?
      `,
      [id]
    );

    if (teachers.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy giáo viên",
      });
    }

    return res.status(200).json(teachers[0]);
  } catch (error) {
    console.error("Lỗi lấy chi tiết giáo viên:", error);

    return res.status(500).json({
      message: "Lỗi lấy chi tiết giáo viên",
      error: error.message,
      code: error.code,
    });
  }
});

/*
|--------------------------------------------------------------------------
| 26. API: Cập nhật giáo viên
|--------------------------------------------------------------------------
| Method: PUT
| URL: /api/teachers/:id
|--------------------------------------------------------------------------
*/
router.put("/:id", async (req, res) => {
  const { id } = req.params;

  const {
    teacher_code,
    full_name,
    gender,
    date_of_birth,
    phone,
    email,
    avatar,
    password,
    department_id,
    account_status,
  } = req.body;

  if (!teacher_code || !full_name || !email || !phone) {
    return res.status(400).json({
      message:
        "Vui lòng nhập đầy đủ mã giáo viên, họ tên, email và số điện thoại",
    });
  }

  if (!department_id) {
    return res.status(400).json({
      message: "Vui lòng chọn khoa/bộ môn",
    });
  }

  if (!validateGender(gender)) {
    return res.status(400).json({
      message: "Giới tính không hợp lệ",
    });
  }

  if (!validateAccountStatus(account_status)) {
    return res.status(400).json({
      message: "Trạng thái tài khoản không hợp lệ",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [teachers] = await connection.query(
      `
      SELECT id_teacher
      FROM Teacher
      WHERE id_teacher = ?
      LIMIT 1
      `,
      [id]
    );

    if (teachers.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Không tìm thấy giáo viên",
      });
    }

    const [departments] = await connection.query(
      `
      SELECT id_department
      FROM Department
      WHERE id_department = ?
      LIMIT 1
      `,
      [Number(department_id)]
    );

    if (departments.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Khoa/bộ môn không tồn tại",
      });
    }

    const [duplicateTeachers] = await connection.query(
      `
      SELECT id_teacher
      FROM Teacher
      WHERE (teacher_code = ? OR email = ?)
        AND id_teacher <> ?
      LIMIT 1
      `,
      [teacher_code.trim(), email.trim(), id]
    );

    if (duplicateTeachers.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "Mã giáo viên hoặc email đã tồn tại",
      });
    }

    await connection.query(
      `
      UPDATE Teacher
      SET
        teacher_code = ?,
        full_name = ?,
        gender = ?,
        date_of_birth = ?,
        phone = ?,
        email = ?,
        avatar = ?,
        department_id = ?,
        updated_at = NOW()
      WHERE id_teacher = ?
      `,
      [
        teacher_code.trim(),
        full_name.trim(),
        normalizeGender(gender),
        date_of_birth || null,
        phone.trim(),
        email.trim(),
        avatar || null,
        Number(department_id),
        id,
      ]
    );

    const [accounts] = await connection.query(
      `
      SELECT id_account
      FROM Account
      WHERE teacher_id = ?
      LIMIT 1
      `,
      [id]
    );

    if (accounts.length === 0) {
      await connection.query(
        `
        INSERT INTO Account (
          username,
          password,
          role,
          teacher_id,
          student_id,
          status
        )
        VALUES (?, ?, 'TEACHER', ?, NULL, ?)
        `,
        [
          email.trim(),
          password && password.trim() !== "" ? password : "12345678",
          id,
          account_status || "ACTIVE",
        ]
      );
    } else if (password && password.trim() !== "") {
      await connection.query(
        `
        UPDATE Account
        SET
          username = ?,
          password = ?,
          status = ?
        WHERE teacher_id = ?
        `,
        [email.trim(), password, account_status || "ACTIVE", id]
      );

      await connection.query(
        `
        UPDATE Teacher
        SET password = ?
        WHERE id_teacher = ?
        `,
        [password, id]
      );
    } else {
      await connection.query(
        `
        UPDATE Account
        SET
          username = ?,
          status = ?
        WHERE teacher_id = ?
        `,
        [email.trim(), account_status || "ACTIVE", id]
      );
    }

    await connection.commit();

    return res.status(200).json({
      message: "Cập nhật giáo viên thành công",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi cập nhật giáo viên:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Mã giáo viên, email hoặc tài khoản đã tồn tại",
        error: error.message,
        code: error.code,
      });
    }

    if (error.code === "ER_DATA_TOO_LONG") {
      return res.status(400).json({
        message:
          "Dữ liệu quá dài. Có thể avatar dạng Base64 vượt quá giới hạn cột trong MySQL.",
        error: error.message,
        code: error.code,
      });
    }

    return res.status(500).json({
      message: "Lỗi cập nhật giáo viên",
      error: error.message,
      code: error.code,
    });
  } finally {
    connection.release();
  }
});

/*
|--------------------------------------------------------------------------
| 27. API: Xóa giáo viên
|--------------------------------------------------------------------------
| Method: DELETE
| URL: /api/teachers/:id
|--------------------------------------------------------------------------
*/
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [teachers] = await connection.query(
      `
      SELECT id_teacher
      FROM Teacher
      WHERE id_teacher = ?
      LIMIT 1
      `,
      [id]
    );

    if (teachers.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Không tìm thấy giáo viên",
      });
    }

    await connection.query(
      `
      DELETE FROM Account
      WHERE teacher_id = ?
      `,
      [id]
    );

    await connection.query(
      `
      DELETE FROM Teacher
      WHERE id_teacher = ?
      `,
      [id]
    );

    await connection.commit();

    return res.status(200).json({
      message: "Xóa giáo viên thành công",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lỗi xóa giáo viên:", error);

    return res.status(500).json({
      message:
        "Không thể xóa giáo viên. Có thể giáo viên đang được dùng trong lớp học phần hoặc dữ liệu liên quan khác.",
      error: error.message,
      code: error.code,
    });
  } finally {
    connection.release();
  }
});

export default router;