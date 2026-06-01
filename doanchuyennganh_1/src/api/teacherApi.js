const API_URL = "http://localhost:3060/api";

/*
|--------------------------------------------------------------------------
| FILE: teacherApi.js
|--------------------------------------------------------------------------
| Chức năng:
| - Tập trung toàn bộ API liên quan đến giáo viên
| - Kết nối frontend React với backend Express
| - Dùng cho các trang:
|   + TeacherDashboard
|   + TeacherSchedule
|   + TeacherClasses
|   + TeacherClassDetail
|   + TeacherSessions
|   + TeacherAttendance
|   + TeacherProfile
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| 0. Hàm xử lý response chung
|--------------------------------------------------------------------------
| Vai trò:
| - Đọc dữ liệu backend trả về
| - Kiểm tra backend có trả JSON không
| - Nếu backend trả HTML, sai route, sai port thì báo rõ URL lỗi
| - Nếu API lỗi thì lấy message từ backend để hiển thị ra giao diện
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
| 1. API QUẢN LÝ GIÁO VIÊN - ADMIN DÙNG
|--------------------------------------------------------------------------
| Các API này dùng cho trang admin quản lý giáo viên:
| - Danh sách giáo viên
| - Chi tiết giáo viên
| - Thêm giáo viên
| - Cập nhật giáo viên
| - Xóa giáo viên
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| 1.1. Lấy danh sách giáo viên
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers
|--------------------------------------------------------------------------
*/
export async function getTeachers(search = "") {
  const params = new URLSearchParams();

  if (search) {
    params.append("search", search);
  }

  const queryString = params.toString();

  const res = await fetch(
    `${API_URL}/teachers${queryString ? `?${queryString}` : ""}`
  );

  return handleResponse(res, "Không thể tải danh sách giáo viên");
}

/*
|--------------------------------------------------------------------------
| 1.2. Lấy chi tiết giáo viên
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/:teacherId
|--------------------------------------------------------------------------
*/
export async function getTeacherById(teacherId) {
  if (!teacherId) {
    throw new Error("Thiếu mã giáo viên");
  }

  const res = await fetch(`${API_URL}/teachers/${teacherId}`);

  return handleResponse(res, "Không thể tải thông tin giáo viên");
}

/*
|--------------------------------------------------------------------------
| 1.3. Thêm giáo viên
|--------------------------------------------------------------------------
| Method: POST
| URL: /api/teachers
|--------------------------------------------------------------------------
*/
export async function createTeacher(payload) {
  if (!payload) {
    throw new Error("Thiếu dữ liệu giáo viên cần thêm");
  }

  const res = await fetch(`${API_URL}/teachers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res, "Không thể thêm giáo viên");
}

/*
|--------------------------------------------------------------------------
| 1.4. Cập nhật giáo viên
|--------------------------------------------------------------------------
| Method: PUT
| URL: /api/teachers/:teacherId
|--------------------------------------------------------------------------
*/
export async function updateTeacher(teacherId, payload) {
  if (!teacherId) {
    throw new Error("Thiếu mã giáo viên cần cập nhật");
  }

  if (!payload) {
    throw new Error("Thiếu dữ liệu giáo viên cần cập nhật");
  }

  const res = await fetch(`${API_URL}/teachers/${teacherId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res, "Không thể cập nhật giáo viên");
}

/*
|--------------------------------------------------------------------------
| 1.5. Xóa giáo viên
|--------------------------------------------------------------------------
| Method: DELETE
| URL: /api/teachers/:teacherId
|--------------------------------------------------------------------------
*/
export async function deleteTeacher(teacherId) {
  if (!teacherId) {
    throw new Error("Thiếu mã giáo viên cần xóa");
  }

  const res = await fetch(`${API_URL}/teachers/${teacherId}`, {
    method: "DELETE",
  });

  return handleResponse(res, "Không thể xóa giáo viên");
}

/*
|--------------------------------------------------------------------------
| 2. API DASHBOARD GIÁO VIÊN
|--------------------------------------------------------------------------
| Dùng cho trang:
| - TeacherDashboard.jsx
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| 2.1. Lấy dữ liệu dashboard giáo viên
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/dashboard/:teacherId
|--------------------------------------------------------------------------
*/
export async function getTeacherDashboard(teacherId) {
  if (!teacherId) {
    throw new Error("Thiếu mã giáo viên để tải dashboard");
  }

  const res = await fetch(`${API_URL}/teachers/dashboard/${teacherId}`);

  return handleResponse(res, "Không thể tải dashboard giáo viên");
}

/*
|--------------------------------------------------------------------------
| 3. API LỊCH DẠY GIÁO VIÊN
|--------------------------------------------------------------------------
| Dùng cho các trang:
| - TeacherSchedule.jsx
| - TeacherClasses.jsx
| - TeacherSessions.jsx
| - TeacherAttendance.jsx khi cần tự lấy buổi học
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| 3.1. Lấy lịch dạy của giáo viên
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/schedule/:teacherId
|--------------------------------------------------------------------------
| filters có thể gồm:
| - view: day | week | month
| - subject: tên môn học
| - classCode: mã lớp học phần
|--------------------------------------------------------------------------
*/
export async function getTeacherSchedule(teacherId, filters = {}) {
  if (!teacherId) {
    throw new Error("Thiếu mã giáo viên để tải lịch dạy");
  }

  const params = new URLSearchParams();

  if (filters.view) {
    params.append("view", filters.view);
  }

  if (filters.subject) {
    params.append("subject", filters.subject);
  }

  if (filters.classCode) {
    params.append("classCode", filters.classCode);
  }

  const queryString = params.toString();

  const res = await fetch(
    `${API_URL}/teachers/schedule/${teacherId}${
      queryString ? `?${queryString}` : ""
    }`
  );

  return handleResponse(res, "Không thể tải lịch dạy giáo viên");
}

/*
|--------------------------------------------------------------------------
| 4. API LỚP HỌC PHẦN CỦA GIÁO VIÊN
|--------------------------------------------------------------------------
| Dùng cho các trang:
| - TeacherClasses.jsx
| - TeacherClassDetail.jsx
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| 4.1. Lấy chi tiết lớp học phần
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/classes/:courseClassId
|--------------------------------------------------------------------------
*/
export async function getTeacherClassDetail(courseClassId) {
  if (!courseClassId) {
    throw new Error("Thiếu mã lớp học phần để tải chi tiết lớp");
  }

  const res = await fetch(`${API_URL}/teachers/classes/${courseClassId}`);

  return handleResponse(res, "Không thể tải chi tiết lớp học");
}

/*
|--------------------------------------------------------------------------
| 4.2. Lấy danh sách sinh viên trong lớp học phần
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/classes/:courseClassId/students
|--------------------------------------------------------------------------
*/
export async function getTeacherClassStudents(courseClassId, search = "") {
  if (!courseClassId) {
    throw new Error("Thiếu mã lớp học phần để tải danh sách sinh viên");
  }

  const params = new URLSearchParams();

  if (search) {
    params.append("search", search);
  }

  const queryString = params.toString();

  const res = await fetch(
    `${API_URL}/teachers/classes/${courseClassId}/students${
      queryString ? `?${queryString}` : ""
    }`
  );

  return handleResponse(res, "Không thể tải danh sách sinh viên của lớp");
}

/*
|--------------------------------------------------------------------------
| 4.3. Lấy lịch học của một lớp học phần
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/classes/:courseClassId/schedules
|--------------------------------------------------------------------------
*/
export async function getTeacherClassSchedules(courseClassId) {
  if (!courseClassId) {
    throw new Error("Thiếu mã lớp học phần để tải lịch học");
  }

  const res = await fetch(
    `${API_URL}/teachers/classes/${courseClassId}/schedules`
  );

  return handleResponse(res, "Không thể tải lịch học của lớp");
}

/*
|--------------------------------------------------------------------------
| 4.4. Lấy danh sách buổi học của lớp học phần
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/classes/:courseClassId/sessions
|--------------------------------------------------------------------------
*/
export async function getTeacherClassSessions(courseClassId) {
  if (!courseClassId) {
    throw new Error("Thiếu mã lớp học phần để tải danh sách buổi học");
  }

  const res = await fetch(
    `${API_URL}/teachers/classes/${courseClassId}/sessions`
  );

  return handleResponse(res, "Không thể tải danh sách buổi học");
}

/*
|--------------------------------------------------------------------------
| 5. API BUỔI HỌC - SESSION
|--------------------------------------------------------------------------
| Dùng cho các trang:
| - TeacherSessions.jsx
| - TeacherAttendance.jsx
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| 5.1. Tạo buổi học từ lịch học
|--------------------------------------------------------------------------
| Method: POST
| URL: /api/teachers/sessions
|--------------------------------------------------------------------------
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

  const res = await fetch(`${API_URL}/teachers/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res, "Không thể tạo buổi học");
}

/*
|--------------------------------------------------------------------------
| 5.2. Lấy chi tiết buổi học
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/sessions/:sessionId
|--------------------------------------------------------------------------
*/
export async function getTeacherSessionById(sessionId) {
  if (!sessionId) {
    throw new Error("Thiếu mã buổi học");
  }

  const res = await fetch(`${API_URL}/teachers/sessions/${sessionId}`);

  return handleResponse(res, "Không thể tải chi tiết buổi học");
}

/*
|--------------------------------------------------------------------------
| 5.3. Cập nhật trạng thái buổi học
|--------------------------------------------------------------------------
| Method: PUT
| URL: /api/teachers/sessions/:sessionId/status
|--------------------------------------------------------------------------
| status:
| - NOT_STARTED
| - ONGOING
| - FINISHED
|--------------------------------------------------------------------------
*/
export async function updateTeacherSessionStatus(sessionId, status) {
  if (!sessionId) {
    throw new Error("Thiếu mã buổi học cần cập nhật");
  }

  if (!status) {
    throw new Error("Thiếu trạng thái buổi học cần cập nhật");
  }

  const res = await fetch(`${API_URL}/teachers/sessions/${sessionId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  return handleResponse(res, "Không thể cập nhật trạng thái buổi học");
}

/*
|--------------------------------------------------------------------------
| 6. API ĐIỂM DANH
|--------------------------------------------------------------------------
| Dùng cho:
| - TeacherAttendance.jsx
| - TeacherAttendanceReport.jsx
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| 6.1. Lấy danh sách điểm danh theo buổi học
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/sessions/:sessionId/attendance
|--------------------------------------------------------------------------
*/
export async function getTeacherSessionAttendance(sessionId) {
  if (!sessionId) {
    throw new Error("Thiếu mã buổi học để tải danh sách điểm danh");
  }

  const res = await fetch(
    `${API_URL}/teachers/sessions/${sessionId}/attendance`
  );

  return handleResponse(res, "Không thể tải danh sách điểm danh");
}

/*
|--------------------------------------------------------------------------
| 6.2. Cập nhật điểm danh cho một sinh viên
|--------------------------------------------------------------------------
| Method: PUT
| URL: /api/teachers/attendance/:attendanceId
|--------------------------------------------------------------------------
| payload:
| {
|   status,
|   check_in_time,
|   note
| }
|--------------------------------------------------------------------------
*/
export async function updateTeacherAttendance(attendanceId, payload) {
  if (!attendanceId) {
    throw new Error("Thiếu mã điểm danh cần cập nhật");
  }

  if (!payload) {
    throw new Error("Thiếu dữ liệu điểm danh cần cập nhật");
  }

  const res = await fetch(`${API_URL}/teachers/attendance/${attendanceId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res, "Không thể cập nhật điểm danh");
}

/*
|--------------------------------------------------------------------------
| 6.3. Cập nhật điểm danh hàng loạt
|--------------------------------------------------------------------------
| Method: PUT
| URL: /api/teachers/sessions/:sessionId/attendance/bulk
|--------------------------------------------------------------------------
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
  if (!sessionId) {
    throw new Error("Thiếu mã buổi học cần cập nhật điểm danh");
  }

  if (!payload) {
    throw new Error("Thiếu dữ liệu điểm danh hàng loạt");
  }

  const res = await fetch(
    `${API_URL}/teachers/sessions/${sessionId}/attendance/bulk`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  return handleResponse(res, "Không thể cập nhật điểm danh hàng loạt");
}

/*
|--------------------------------------------------------------------------
| 6.4. Lấy báo cáo điểm danh theo buổi học
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/sessions/:sessionId/attendance/report
|--------------------------------------------------------------------------
*/
export async function getTeacherAttendanceReport(sessionId) {
  if (!sessionId) {
    throw new Error("Thiếu mã buổi học để tải báo cáo điểm danh");
  }

  const res = await fetch(
    `${API_URL}/teachers/sessions/${sessionId}/attendance/report`
  );

  return handleResponse(res, "Không thể tải báo cáo điểm danh");
}

/*
|--------------------------------------------------------------------------
| 7. API LỊCH SỬ NHẬN DIỆN KHUÔN MẶT
|--------------------------------------------------------------------------
| Dùng cho:
| - Trang lịch sử nhận diện
| - TeacherAttendanceReport.jsx
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| 7.1. Lấy lịch sử nhận diện khuôn mặt theo buổi học
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/sessions/:sessionId/recognition-history
|--------------------------------------------------------------------------
*/
export async function getTeacherRecognitionHistory(sessionId) {
  if (!sessionId) {
    throw new Error("Thiếu mã buổi học để tải lịch sử nhận diện");
  }

  const res = await fetch(
    `${API_URL}/teachers/sessions/${sessionId}/recognition-history`
  );

  return handleResponse(res, "Không thể tải lịch sử nhận diện khuôn mặt");
}

/*
|--------------------------------------------------------------------------
| 8. API THÔNG BÁO GIÁO VIÊN
|--------------------------------------------------------------------------
| Dùng cho:
| - Header
| - TeacherNotifications.jsx
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| 8.1. Lấy thông báo của giáo viên
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/:teacherId/notifications
|--------------------------------------------------------------------------
*/
export async function getTeacherNotifications(teacherId) {
  if (!teacherId) {
    throw new Error("Thiếu mã giáo viên để tải thông báo");
  }

  const res = await fetch(`${API_URL}/teachers/${teacherId}/notifications`);

  return handleResponse(res, "Không thể tải thông báo giáo viên");
}

/*
|--------------------------------------------------------------------------
| 8.2. Đánh dấu thông báo đã đọc
|--------------------------------------------------------------------------
| Method: PUT
| URL: /api/teachers/notifications/:notificationId/read
|--------------------------------------------------------------------------
*/
export async function markTeacherNotificationAsRead(notificationId) {
  if (!notificationId) {
    throw new Error("Thiếu mã thông báo cần cập nhật");
  }

  const res = await fetch(
    `${API_URL}/teachers/notifications/${notificationId}/read`,
    {
      method: "PUT",
    }
  );

  return handleResponse(res, "Không thể đánh dấu thông báo đã đọc");
}

/*
|--------------------------------------------------------------------------
| 9. API THÔNG TIN CÁ NHÂN GIÁO VIÊN
|--------------------------------------------------------------------------
| Dùng cho:
| - TeacherProfile.jsx
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| 9.1. Lấy thông tin cá nhân giáo viên
|--------------------------------------------------------------------------
| Method: GET
| URL: /api/teachers/profile/:teacherId
|--------------------------------------------------------------------------
*/
export async function getTeacherProfile(teacherId) {
  if (!teacherId) {
    throw new Error("Thiếu mã giáo viên để tải thông tin cá nhân");
  }

  const res = await fetch(`${API_URL}/teachers/profile/${teacherId}`);

  return handleResponse(res, "Không thể tải thông tin cá nhân giáo viên");
}

/*
|--------------------------------------------------------------------------
| 9.2. Cập nhật thông tin cá nhân giáo viên
|--------------------------------------------------------------------------
| Method: PUT
| URL: /api/teachers/profile/:teacherId
|--------------------------------------------------------------------------
*/
export async function updateTeacherProfile(teacherId, payload) {
  if (!teacherId) {
    throw new Error("Thiếu mã giáo viên cần cập nhật thông tin");
  }

  if (!payload) {
    throw new Error("Thiếu dữ liệu thông tin cá nhân cần cập nhật");
  }

  const res = await fetch(`${API_URL}/teachers/profile/${teacherId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res, "Không thể cập nhật thông tin cá nhân giáo viên");
}

/*
|--------------------------------------------------------------------------
| 10. API ĐỔI MẬT KHẨU GIÁO VIÊN
|--------------------------------------------------------------------------
| Dùng cho:
| - TeacherChangePassword.jsx
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| 10.1. Đổi mật khẩu giáo viên
|--------------------------------------------------------------------------
| Method: PUT
| URL: /api/teachers/:teacherId/change-password
|--------------------------------------------------------------------------
| payload:
| {
|   oldPassword,
|   newPassword
| }
|--------------------------------------------------------------------------
*/
export async function changeTeacherPassword(teacherId, payload) {
  if (!teacherId) {
    throw new Error("Thiếu mã giáo viên cần đổi mật khẩu");
  }

  if (!payload) {
    throw new Error("Thiếu dữ liệu đổi mật khẩu");
  }

  const res = await fetch(`${API_URL}/teachers/${teacherId}/change-password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res, "Không thể đổi mật khẩu giáo viên");
}

export async function getTeacherStatistics(teacherId, filters = {}) {
  if (!teacherId) {
    throw new Error("Thiếu mã giáo viên để tải thống kê");
  }

  const params = new URLSearchParams();

  if (filters.courseClassId && filters.courseClassId !== "all") {
    params.append("courseClassId", filters.courseClassId);
  }

  const queryString = params.toString();

  const res = await fetch(
    `${API_URL}/teachers/statistics/${teacherId}${
      queryString ? `?${queryString}` : ""
    }`
  );

  return handleResponse(res, "Không thể tải thống kê điểm danh");
}
export async function getTeacherClasses(teacherId, filters = {}) {
  if (!teacherId) {
    throw new Error("Thiếu mã giáo viên để tải danh sách lớp học");
  }

  const params = new URLSearchParams();

  if (filters.search) {
    params.append("search", filters.search);
  }

  if (filters.semester && filters.semester !== "all") {
    params.append("semester", filters.semester);
  }

  if (filters.status && filters.status !== "all") {
    params.append("status", filters.status);
  }

  const queryString = params.toString();

  const res = await fetch(
    `${API_URL}/teachers/classes/teacher/${teacherId}${
      queryString ? `?${queryString}` : ""
    }`
  );

  return handleResponse(res, "Không thể tải danh sách lớp học của giáo viên");
}

export async function getTeacherSessions(teacherId, filters = {}) {
  if (!teacherId) {
    throw new Error("Thiếu mã giáo viên để tải danh sách buổi học");
  }

  const params = new URLSearchParams();

  if (filters.date) {
    params.append("date", filters.date);
  }

  if (filters.classCode && filters.classCode !== "all") {
    params.append("classCode", filters.classCode);
  }

  if (filters.subject && filters.subject !== "all") {
    params.append("subject", filters.subject);
  }

  if (filters.status && filters.status !== "all") {
    params.append("status", filters.status);
  }

  if (filters.search) {
    params.append("search", filters.search);
  }

  const queryString = params.toString();

  const res = await fetch(
    `${API_URL}/teachers/sessions/teacher/${teacherId}${
      queryString ? `?${queryString}` : ""
    }`
  );

  return handleResponse(res, "Không thể tải danh sách buổi học giáo viên");
}