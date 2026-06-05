const API_URL = "http://localhost:3060/api";

/* =========================================================
   FILE: teacherApi.js
   ---------------------------------------------------------
   Chức năng:
   - Tập trung toàn bộ API liên quan đến giáo viên
   - Kết nối frontend React với backend Express
   - Dùng cho Admin và Teacher module

   Nhóm API:
   1. Helper dùng chung
   2. Admin quản lý giáo viên
   3. Dashboard giáo viên
   4. Lịch dạy giáo viên
   5. Lớp học phần của giáo viên
   6. Buổi học / Session
   7. Điểm danh
   8. Thống kê
   9. Lịch sử nhận diện khuôn mặt
   10. Thông báo
   11. Hồ sơ cá nhân
   12. Đổi mật khẩu
========================================================= */


/* =========================================================
   1. HELPER DÙNG CHUNG
========================================================= */

/*
|--------------------------------------------------------------------------
| handleResponse()
|--------------------------------------------------------------------------
| Chức năng:
| - Đọc dữ liệu backend trả về.
| - Kiểm tra backend có trả JSON không.
| - Nếu backend trả HTML do sai route/sai port thì báo rõ URL lỗi.
| - Nếu API lỗi thì lấy message từ backend để hiển thị ra giao diện.
|--------------------------------------------------------------------------
*/
async function handleResponse(res, defaultMessage) {
  const text = await res.text();

  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    console.error("Backend không trả JSON:", {
      url: res.url,
      status: res.status,
      body: text.slice(0, 300),
    });

    throw new Error(
      `Backend không trả về JSON. URL: ${res.url} | Status: ${res.status}`
    );
  }

  if (!res.ok) {
    throw new Error(data?.message || defaultMessage);
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| buildQueryString()
|--------------------------------------------------------------------------
| Chức năng:
| - Tạo query string từ object filters.
| - Bỏ qua giá trị rỗng, null, undefined.
| - Bỏ qua giá trị "all" vì frontend thường dùng "all" cho tất cả.
|--------------------------------------------------------------------------
*/
function buildQueryString(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== "all"
    ) {
      params.append(key, value);
    }
  });

  const queryString = params.toString();

  return queryString ? `?${queryString}` : "";
}

/*
|--------------------------------------------------------------------------
| requestJson()
|--------------------------------------------------------------------------
| Chức năng:
| - Gọi API có body JSON.
| - Dùng cho POST, PUT, PATCH.
|--------------------------------------------------------------------------
*/
async function requestJson(url, method, payload, defaultMessage) {
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload || {}),
  });

  return handleResponse(res, defaultMessage);
}

/*
|--------------------------------------------------------------------------
| validateId()
|--------------------------------------------------------------------------
| Chức năng:
| - Kiểm tra id bắt buộc trước khi gọi API.
|--------------------------------------------------------------------------
*/
function validateId(id, message) {
  if (!id) {
    throw new Error(message);
  }
}


/* =========================================================
   2. API QUẢN LÝ GIÁO VIÊN - ADMIN DÙNG
   ---------------------------------------------------------
   Dùng cho:
   - AdminTeachersPage
   - AdminAddTeacherPage
   - AdminEditTeacherPage
========================================================= */

/*
|--------------------------------------------------------------------------
| 2.1. Lấy danh sách giáo viên
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers
|--------------------------------------------------------------------------
*/
export async function getTeachers(search = "") {
  const queryString = buildQueryString({ search });

  const res = await fetch(`${API_URL}/teachers${queryString}`);

  return handleResponse(res, "Không thể tải danh sách giáo viên");
}

/*
|--------------------------------------------------------------------------
| 2.2. Lấy chi tiết giáo viên
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/:teacherId
|--------------------------------------------------------------------------
*/
export async function getTeacherById(teacherId) {
  validateId(teacherId, "Thiếu mã giáo viên");

  const res = await fetch(`${API_URL}/teachers/${teacherId}`);

  return handleResponse(res, "Không thể tải thông tin giáo viên");
}

/*
|--------------------------------------------------------------------------
| 2.3. Thêm giáo viên
|--------------------------------------------------------------------------
| Method: POST
| URL: /api/teachers
|--------------------------------------------------------------------------
*/
export async function createTeacher(payload) {
  if (!payload) {
    throw new Error("Thiếu dữ liệu giáo viên cần thêm");
  }

  return requestJson(
    `${API_URL}/teachers`,
    "POST",
    payload,
    "Không thể thêm giáo viên"
  );
}

/*
|--------------------------------------------------------------------------
| 2.4. Cập nhật giáo viên
|--------------------------------------------------------------------------
| Method: PUT
| URL: /api/teachers/:teacherId
|--------------------------------------------------------------------------
*/
export async function updateTeacher(teacherId, payload) {
  validateId(teacherId, "Thiếu mã giáo viên cần cập nhật");

  if (!payload) {
    throw new Error("Thiếu dữ liệu giáo viên cần cập nhật");
  }

  return requestJson(
    `${API_URL}/teachers/${teacherId}`,
    "PUT",
    payload,
    "Không thể cập nhật giáo viên"
  );
}

/*
|--------------------------------------------------------------------------
| 2.5. Xóa giáo viên
|--------------------------------------------------------------------------
| Method: DELETE
| URL: /api/teachers/:teacherId
|--------------------------------------------------------------------------
*/
export async function deleteTeacher(teacherId) {
  validateId(teacherId, "Thiếu mã giáo viên cần xóa");

  const res = await fetch(`${API_URL}/teachers/${teacherId}`, {
    method: "DELETE",
  });

  return handleResponse(res, "Không thể xóa giáo viên");
}


/* =========================================================
   3. API DASHBOARD GIÁO VIÊN
   ---------------------------------------------------------
   Dùng cho:
   - TeacherDashboard.jsx
========================================================= */

/*
|--------------------------------------------------------------------------
| 3.1. Lấy dữ liệu dashboard giáo viên
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/dashboard/:teacherId
|--------------------------------------------------------------------------
*/
export async function getTeacherDashboard(teacherId) {
  validateId(teacherId, "Thiếu mã giáo viên để tải dashboard");

  const res = await fetch(`${API_URL}/teachers/dashboard/${teacherId}`);

  return handleResponse(res, "Không thể tải dashboard giáo viên");
}


/* =========================================================
   4. API LỊCH DẠY GIÁO VIÊN
   ---------------------------------------------------------
   Dùng cho:
   - TeacherSchedule.jsx
   - TeacherClasses.jsx
   - TeacherSessions.jsx
   - TeacherAttendance.jsx
========================================================= */

/*
|--------------------------------------------------------------------------
| 4.1. Lấy lịch dạy của giáo viên
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/schedule/:teacherId
|
| filters:
| - view
| - subject
| - classCode
|--------------------------------------------------------------------------
*/
export async function getTeacherSchedule(teacherId, filters = {}) {
  validateId(teacherId, "Thiếu mã giáo viên để tải lịch dạy");

  const queryString = buildQueryString({
    view: filters.view,
    subject: filters.subject,
    classCode: filters.classCode,
  });

  const res = await fetch(
    `${API_URL}/teachers/schedule/${teacherId}${queryString}`
  );

  return handleResponse(res, "Không thể tải lịch dạy giáo viên");
}


/* =========================================================
   5. API LỚP HỌC PHẦN CỦA GIÁO VIÊN
   ---------------------------------------------------------
   Dùng cho:
   - TeacherClasses.jsx
   - TeacherClassDetail.jsx
========================================================= */

/*
|--------------------------------------------------------------------------
| 5.1. Lấy danh sách lớp học phần của giáo viên
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/classes/teacher/:teacherId
|
| filters:
| - search
| - semester
| - status
|--------------------------------------------------------------------------
*/
export async function getTeacherClasses(teacherId, filters = {}) {
  validateId(teacherId, "Thiếu mã giáo viên để tải danh sách lớp học");

  const queryString = buildQueryString({
    search: filters.search,
    semester: filters.semester,
    status: filters.status,
  });

  const res = await fetch(
    `${API_URL}/teachers/classes/teacher/${teacherId}${queryString}`
  );

  return handleResponse(res, "Không thể tải danh sách lớp học của giáo viên");
}

/*
|--------------------------------------------------------------------------
| 5.2. Lấy chi tiết lớp học phần
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/classes/:courseClassId
|--------------------------------------------------------------------------
*/
export async function getTeacherClassDetail(courseClassId) {
  validateId(courseClassId, "Thiếu mã lớp học phần để tải chi tiết lớp");

  const res = await fetch(`${API_URL}/teachers/classes/${courseClassId}`);

  return handleResponse(res, "Không thể tải chi tiết lớp học");
}

/*
|--------------------------------------------------------------------------
| 5.3. Lấy danh sách sinh viên trong lớp học phần
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/classes/:courseClassId/students
|--------------------------------------------------------------------------
*/
export async function getTeacherClassStudents(courseClassId, search = "") {
  validateId(courseClassId, "Thiếu mã lớp học phần để tải danh sách sinh viên");

  const queryString = buildQueryString({ search });

  const res = await fetch(
    `${API_URL}/teachers/classes/${courseClassId}/students${queryString}`
  );

  return handleResponse(res, "Không thể tải danh sách sinh viên của lớp");
}

/*
|--------------------------------------------------------------------------
| 5.4. Lấy lịch học của một lớp học phần
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/classes/:courseClassId/schedules
|--------------------------------------------------------------------------
*/
export async function getTeacherClassSchedules(courseClassId) {
  validateId(courseClassId, "Thiếu mã lớp học phần để tải lịch học");

  const res = await fetch(
    `${API_URL}/teachers/classes/${courseClassId}/schedules`
  );

  return handleResponse(res, "Không thể tải lịch học của lớp");
}

/*
|--------------------------------------------------------------------------
| 5.5. Lấy danh sách buổi học của lớp học phần
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/classes/:courseClassId/sessions
|--------------------------------------------------------------------------
*/
export async function getTeacherClassSessions(courseClassId) {
  validateId(courseClassId, "Thiếu mã lớp học phần để tải danh sách buổi học");

  const res = await fetch(
    `${API_URL}/teachers/classes/${courseClassId}/sessions`
  );

  return handleResponse(res, "Không thể tải danh sách buổi học");
}


/* =========================================================
   6. API BUỔI HỌC - SESSION
   ---------------------------------------------------------
   Dùng cho:
   - TeacherSessions.jsx
   - TeacherAttendance.jsx
========================================================= */

/*
|--------------------------------------------------------------------------
| 6.1. Lấy danh sách buổi học của giáo viên
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/sessions/teacher/:teacherId
|
| filters:
| - date
| - classCode
| - subject
| - status
| - search
|--------------------------------------------------------------------------
*/
export async function getTeacherSessions(teacherId, filters = {}) {
  validateId(teacherId, "Thiếu mã giáo viên để tải danh sách buổi học");

  const queryString = buildQueryString({
    date: filters.date,
    classCode: filters.classCode,
    subject: filters.subject,
    status: filters.status,
    search: filters.search,
  });

  const res = await fetch(
    `${API_URL}/teachers/sessions/teacher/${teacherId}${queryString}`
  );

  return handleResponse(res, "Không thể tải danh sách buổi học giáo viên");
}

/*
|--------------------------------------------------------------------------
| 6.2. Tạo buổi học từ lịch học
|--------------------------------------------------------------------------
| Method: POST
| URL: /api/teachers/sessions
|
| payload:
| {
|   id_schedule,
|   session_date,
|   session_number
| }
|--------------------------------------------------------------------------
*/
export async function createTeacherSession(payload) {
  if (!payload) {
    throw new Error("Thiếu dữ liệu buổi học cần tạo");
  }

  return requestJson(
    `${API_URL}/teachers/sessions`,
    "POST",
    payload,
    "Không thể tạo buổi học"
  );
}

/*
|--------------------------------------------------------------------------
| 6.3. Lấy chi tiết buổi học
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/sessions/:sessionId
|--------------------------------------------------------------------------
*/
export async function getTeacherSessionById(sessionId) {
  validateId(sessionId, "Thiếu mã buổi học");

  const res = await fetch(`${API_URL}/teachers/sessions/${sessionId}`);

  return handleResponse(res, "Không thể tải chi tiết buổi học");
}

/*
|--------------------------------------------------------------------------
| 6.4. Cập nhật trạng thái buổi học
|--------------------------------------------------------------------------
| Method: PUT
| URL: /api/teachers/sessions/:sessionId/status
|
| status:
| - NOT_STARTED
| - ONGOING
| - FINISHED
|--------------------------------------------------------------------------
*/
export async function updateTeacherSessionStatus(sessionId, status) {
  validateId(sessionId, "Thiếu mã buổi học cần cập nhật");

  if (!status) {
    throw new Error("Thiếu trạng thái buổi học cần cập nhật");
  }

  return requestJson(
    `${API_URL}/teachers/sessions/${sessionId}/status`,
    "PUT",
    { status },
    "Không thể cập nhật trạng thái buổi học"
  );
}


/* =========================================================
   7. API ĐIỂM DANH
   ---------------------------------------------------------
   Dùng cho:
   - TeacherAttendance.jsx
   - TeacherAttendanceReport.jsx
========================================================= */

/*
|--------------------------------------------------------------------------
| 7.1. Lấy danh sách điểm danh theo buổi học
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/sessions/:sessionId/attendance
|--------------------------------------------------------------------------
*/
export async function getTeacherSessionAttendance(sessionId) {
  validateId(sessionId, "Thiếu mã buổi học để tải danh sách điểm danh");

  const res = await fetch(
    `${API_URL}/teachers/sessions/${sessionId}/attendance`
  );

  return handleResponse(res, "Không thể tải danh sách điểm danh");
}

/*
|--------------------------------------------------------------------------
| 7.2. Cập nhật điểm danh cho một sinh viên
|--------------------------------------------------------------------------
| Method: PUT
| URL: /api/teachers/attendance/:attendanceId
|
| payload:
| {
|   status,
|   check_in_time,
|   note
| }
|--------------------------------------------------------------------------
*/
export async function updateTeacherAttendance(attendanceId, payload) {
  validateId(attendanceId, "Thiếu mã điểm danh cần cập nhật");

  if (!payload) {
    throw new Error("Thiếu dữ liệu điểm danh cần cập nhật");
  }

  return requestJson(
    `${API_URL}/teachers/attendance/${attendanceId}`,
    "PUT",
    payload,
    "Không thể cập nhật điểm danh"
  );
}

/*
|--------------------------------------------------------------------------
| 7.3. Cập nhật điểm danh hàng loạt
|--------------------------------------------------------------------------
| Method: PUT
| URL: /api/teachers/sessions/:sessionId/attendance/bulk
|
| payload:
| {
|   attendances: [
|     {
|       id_attendance,
|       id_student,
|       status,
|       check_in_time,
|       note
|     }
|   ]
| }
|--------------------------------------------------------------------------
*/
export async function updateTeacherAttendanceBulk(sessionId, payload) {
  validateId(sessionId, "Thiếu mã buổi học cần cập nhật điểm danh");

  if (!payload) {
    throw new Error("Thiếu dữ liệu điểm danh hàng loạt");
  }

  return requestJson(
    `${API_URL}/teachers/sessions/${sessionId}/attendance/bulk`,
    "PUT",
    payload,
    "Không thể cập nhật điểm danh hàng loạt"
  );
}

/*
|--------------------------------------------------------------------------
| 7.4. Lấy báo cáo điểm danh theo buổi học
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/sessions/:sessionId/attendance/report
|--------------------------------------------------------------------------
*/
export async function getTeacherAttendanceReport(sessionId) {
  validateId(sessionId, "Thiếu mã buổi học để tải báo cáo điểm danh");

  const res = await fetch(
    `${API_URL}/teachers/sessions/${sessionId}/attendance/report`
  );

  return handleResponse(res, "Không thể tải báo cáo điểm danh");
}


/* =========================================================
   8. API THỐNG KÊ GIÁO VIÊN
   ---------------------------------------------------------
   Dùng cho:
   - TeacherStatistics.jsx
========================================================= */

/*
|--------------------------------------------------------------------------
| 8.1. Lấy thống kê điểm danh của giáo viên
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/statistics/:teacherId
|
| filters:
| - courseClassId
|--------------------------------------------------------------------------
*/
export async function getTeacherStatistics(teacherId, filters = {}) {
  validateId(teacherId, "Thiếu mã giáo viên để tải thống kê");

  const queryString = buildQueryString({
    courseClassId: filters.courseClassId,
  });

  const res = await fetch(
    `${API_URL}/teachers/statistics/${teacherId}${queryString}`
  );

  return handleResponse(res, "Không thể tải thống kê điểm danh");
}


/* =========================================================
   9. API LỊCH SỬ NHẬN DIỆN KHUÔN MẶT
   ---------------------------------------------------------
   Dùng cho:
   - TeacherAttendanceReport.jsx
   - Trang lịch sử nhận diện
========================================================= */

/*
|--------------------------------------------------------------------------
| 9.1. Lấy lịch sử nhận diện khuôn mặt theo buổi học
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/sessions/:sessionId/recognition-history
|--------------------------------------------------------------------------
*/
export async function getTeacherRecognitionHistory(sessionId) {
  validateId(sessionId, "Thiếu mã buổi học để tải lịch sử nhận diện");

  const res = await fetch(
    `${API_URL}/teachers/sessions/${sessionId}/recognition-history`
  );

  return handleResponse(res, "Không thể tải lịch sử nhận diện khuôn mặt");
}


/* =========================================================
   10. API THÔNG BÁO GIÁO VIÊN
   ---------------------------------------------------------
   Dùng cho:
   - Header
   - TeacherNotifications.jsx
========================================================= */

/*
|--------------------------------------------------------------------------
| 10.1. Lấy thông báo của giáo viên
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/:teacherId/notifications
|--------------------------------------------------------------------------
*/
export async function getTeacherNotifications(teacherId) {
  validateId(teacherId, "Thiếu mã giáo viên để tải thông báo");

  const res = await fetch(`${API_URL}/teachers/${teacherId}/notifications`);

  return handleResponse(res, "Không thể tải thông báo giáo viên");
}

/*
|--------------------------------------------------------------------------
| 10.2. Đánh dấu thông báo đã đọc
|--------------------------------------------------------------------------
| Method: PUT
| URL: /api/teachers/notifications/:notificationId/read
|--------------------------------------------------------------------------
*/
export async function markTeacherNotificationAsRead(notificationId) {
  validateId(notificationId, "Thiếu mã thông báo cần cập nhật");

  const res = await fetch(
    `${API_URL}/teachers/notifications/${notificationId}/read`,
    {
      method: "PUT",
    }
  );

  return handleResponse(res, "Không thể đánh dấu thông báo đã đọc");
}


/* =========================================================
   11. API THÔNG TIN CÁ NHÂN GIÁO VIÊN
   ---------------------------------------------------------
   Dùng cho:
   - TeacherProfile.jsx
========================================================= */

/*
|--------------------------------------------------------------------------
| 11.1. Lấy thông tin cá nhân giáo viên
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/profile/:teacherId
|--------------------------------------------------------------------------
*/
export async function getTeacherProfile(teacherId) {
  validateId(teacherId, "Thiếu mã giáo viên để tải thông tin cá nhân");

  const res = await fetch(`${API_URL}/teachers/profile/${teacherId}`);

  return handleResponse(res, "Không thể tải thông tin cá nhân giáo viên");
}

/*
|--------------------------------------------------------------------------
| 11.2. Cập nhật thông tin cá nhân giáo viên
|--------------------------------------------------------------------------
| Method: PUT
| URL: /api/teachers/profile/:teacherId
|--------------------------------------------------------------------------
*/
export async function updateTeacherProfile(teacherId, payload) {
  validateId(teacherId, "Thiếu mã giáo viên cần cập nhật thông tin");

  if (!payload) {
    throw new Error("Thiếu dữ liệu thông tin cá nhân cần cập nhật");
  }

  return requestJson(
    `${API_URL}/teachers/profile/${teacherId}`,
    "PUT",
    payload,
    "Không thể cập nhật thông tin cá nhân giáo viên"
  );
}


/* =========================================================
   12. API ĐỔI MẬT KHẨU GIÁO VIÊN
   ---------------------------------------------------------
   Dùng cho:
   - TeacherChangePassword.jsx
========================================================= */

/*
|--------------------------------------------------------------------------
| 12.1. Đổi mật khẩu giáo viên
|--------------------------------------------------------------------------
| Method: PUT
| URL: /api/teachers/:teacherId/change-password
|
| payload:
| {
|   oldPassword,
|   newPassword
| }
|--------------------------------------------------------------------------
*/
export async function changeTeacherPassword(teacherId, payload) {
  validateId(teacherId, "Thiếu mã giáo viên cần đổi mật khẩu");

  if (!payload) {
    throw new Error("Thiếu dữ liệu đổi mật khẩu");
  }

  return requestJson(
    `${API_URL}/teachers/${teacherId}/change-password`,
    "PUT",
    payload,
    "Không thể đổi mật khẩu giáo viên"
  );
}