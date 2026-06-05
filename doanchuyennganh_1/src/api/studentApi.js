const API_URL = "http://localhost:3060/api";

/* =========================================================
   1. HÀM XỬ LÝ RESPONSE CHUNG
   ---------------------------------------------------------
   - Đọc response từ backend.
   - Ép dữ liệu trả về sang JSON.
   - Nếu backend trả HTML hoặc sai route thì báo lỗi rõ ràng.
   - Nếu status không OK thì lấy message từ backend hoặc dùng message mặc định.
========================================================= */
async function handleResponse(res, defaultMessage) {
  const text = await res.text();

  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      "Backend không trả về JSON. Có thể sai API, sai route hoặc server đang trả HTML."
    );
  }

  if (!res.ok) {
    throw new Error(data?.message || defaultMessage);
  }

  return data;
}

/* =========================================================
   2. HÀM REQUEST CHUNG
   ---------------------------------------------------------
   - Dùng chung cho toàn bộ API trong file.
   - Tự động gắn API_URL.
   - Tự động thêm Content-Type: application/json.
   - Bắt lỗi mất kết nối backend.
========================================================= */
async function request(endpoint, options = {}, defaultMessage = "Có lỗi xảy ra") {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    return await handleResponse(res, defaultMessage);
  } catch (error) {
    if (error.name === "TypeError") {
      throw new Error(
        "Không thể kết nối đến backend. Hãy kiểm tra server Node.js đã chạy ở port 3060 chưa.",
        {
          cause: error,
        }
      );
    }

    throw error;
  }
}

/* =========================================================
   3. API QUẢN LÝ SINH VIÊN - ADMIN
   ---------------------------------------------------------
   Các hàm này dùng cho trang Admin quản lý sinh viên:
   - Danh sách sinh viên
   - Chi tiết sinh viên
   - Thêm, sửa, xóa sinh viên
========================================================= */

/*
  Lấy danh sách sinh viên.
  Có thể truyền search để tìm theo tên, mã sinh viên, email...
  API gọi: GET /api/students?search=...
*/
export async function getStudents(search = "") {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";

  return request(
    `/students${query}`,
    {},
    "Không thể tải danh sách sinh viên"
  );
}

/*
  Lấy thông tin cơ bản của 1 sinh viên theo id.
  API gọi: GET /api/students/:id
*/
export async function getStudentById(id) {
  if (!id) {
    throw new Error("Thiếu ID sinh viên");
  }

  return request(`/students/${id}`, {}, "Không thể tải thông tin sinh viên");
}

/*
  Lấy chi tiết sinh viên gồm:
  - Thông tin cá nhân
  - Thống kê
  - Lịch sử điểm danh
  API gọi: GET /api/students/:id/detail
*/
export async function getStudentDetail(id) {
  if (!id) {
    throw new Error("Thiếu ID sinh viên");
  }

  return request(
    `/students/${id}/detail`,
    {},
    "Không thể tải chi tiết sinh viên"
  );
}

/*
  Thêm sinh viên mới.
  API gọi: POST /api/students
*/
export async function createStudent(studentData) {
  return request(
    "/students",
    {
      method: "POST",
      body: JSON.stringify(studentData),
    },
    "Không thể thêm sinh viên"
  );
}

/*
  Cập nhật thông tin sinh viên theo id.
  API gọi: PUT /api/students/:id
*/
export async function updateStudent(id, studentData) {
  if (!id) {
    throw new Error("Thiếu ID sinh viên cần cập nhật");
  }

  return request(
    `/students/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(studentData),
    },
    "Không thể cập nhật sinh viên"
  );
}

/*
  Xóa sinh viên theo id.
  API gọi: DELETE /api/students/:id
*/
export async function deleteStudent(id) {
  if (!id) {
    throw new Error("Thiếu ID sinh viên cần xóa");
  }

  return request(
    `/students/${id}`,
    {
      method: "DELETE",
    },
    "Không thể xóa sinh viên"
  );
}

/* =========================================================
   4. API DASHBOARD SINH VIÊN
   ---------------------------------------------------------
   Dùng cho trang Student Dashboard.
========================================================= */

/*
  Lấy dữ liệu dashboard của sinh viên:
  - Thông tin sinh viên
  - Lịch hôm nay
  - Thống kê điểm danh
  - Thông báo gần đây
  API gọi: GET /api/students/:studentId/dashboard
*/
export async function getStudentDashboard(studentId) {
  if (!studentId) {
    throw new Error("Thiếu studentId khi tải dashboard sinh viên");
  }

  return request(
    `/students/${studentId}/dashboard`,
    {},
    "Không thể tải dashboard sinh viên"
  );
}

/* =========================================================
   5. API HỒ SƠ CÁ NHÂN SINH VIÊN
   ---------------------------------------------------------
   Dùng cho trang Student Profile.
========================================================= */

/*
  Lấy hồ sơ cá nhân sinh viên đang đăng nhập.
  API gọi: GET /api/students/:studentId
*/
export async function getMyStudentProfile(studentId) {
  if (!studentId) {
    throw new Error("Thiếu studentId khi tải hồ sơ sinh viên");
  }

  return request(
    `/students/${studentId}`,
    {},
    "Không thể tải hồ sơ sinh viên"
  );
}

/*
  Cập nhật hồ sơ cá nhân sinh viên.
  Các trường thường dùng:
  - full_name
  - phone
  - date_of_birth
  - gender
  API gọi: PUT /api/students/:studentId/profile
*/
export async function updateMyStudentProfile(studentId, profileData) {
  if (!studentId) {
    throw new Error("Thiếu studentId khi cập nhật hồ sơ sinh viên");
  }

  return request(
    `/students/${studentId}/profile`,
    {
      method: "PUT",
      body: JSON.stringify(profileData),
    },
    "Không thể cập nhật hồ sơ sinh viên"
  );
}

/*
  Đổi mật khẩu tài khoản sinh viên.
  Dữ liệu gửi lên thường gồm:
  - oldPassword
  - newPassword
  API gọi: PUT /api/students/:studentId/change-password
*/
export async function changeStudentPassword(studentId, passwordData) {
  if (!studentId) {
    throw new Error("Thiếu studentId khi đổi mật khẩu");
  }

  return request(
    `/students/${studentId}/change-password`,
    {
      method: "PUT",
      body: JSON.stringify(passwordData),
    },
    "Không thể đổi mật khẩu sinh viên"
  );
}

/* =========================================================
   6. API LỊCH HỌC SINH VIÊN
   ---------------------------------------------------------
   Dùng cho trang StudentSchedule.
========================================================= */

/*
  Lấy lịch học cá nhân của sinh viên.
  Có thể lọc theo:
  - semester
  - schoolYear

  API gọi:
  GET /api/students/:studentId/schedule
  GET /api/students/:studentId/schedule?semester=...&schoolYear=...
*/
export async function getMyStudentSchedule(studentId, filters = {}) {
  if (!studentId) {
    throw new Error("Thiếu studentId khi tải lịch học sinh viên");
  }

  const params = new URLSearchParams();

  if (filters.semester) {
    params.append("semester", filters.semester);
  }

  if (filters.schoolYear) {
    params.append("schoolYear", filters.schoolYear);
  }

  const query = params.toString();

  return request(
    `/students/${studentId}/schedule${query ? `?${query}` : ""}`,
    {},
    "Không thể tải lịch học sinh viên"
  );
}

/* =========================================================
   7. API LỊCH SỬ ĐIỂM DANH SINH VIÊN
   ---------------------------------------------------------
   Dùng cho trang AttendanceHistoryPage.
========================================================= */

/*
  Lấy lịch sử điểm danh cá nhân của sinh viên.
  Có thể lọc theo:
  - status: PRESENT, LATE, ABSENT
  - startDate
  - endDate

  API gọi:
  GET /api/students/:studentId/attendance-history
  GET /api/students/:studentId/attendance-history?status=...&startDate=...&endDate=...
*/
export async function getMyStudentAttendanceHistory(studentId, filters = {}) {
  if (!studentId) {
    throw new Error("Thiếu studentId khi tải lịch sử điểm danh");
  }

  const params = new URLSearchParams();

  if (filters.status) {
    params.append("status", filters.status);
  }

  if (filters.startDate) {
    params.append("startDate", filters.startDate);
  }

  if (filters.endDate) {
    params.append("endDate", filters.endDate);
  }

  const query = params.toString();

  return request(
    `/students/${studentId}/attendance-history${query ? `?${query}` : ""}`,
    {},
    "Không thể tải lịch sử điểm danh"
  );
}

/* =========================================================
   8. API KHOA / BỘ MÔN
   ---------------------------------------------------------
   Dùng khi thêm/sửa giáo viên, sinh viên, môn học.
========================================================= */

/*
  Lấy danh sách khoa/bộ môn.
  API gọi: GET /api/departments
*/
export async function getDepartments() {
  return request("/departments", {}, "Không thể tải danh sách khoa");
}

/* =========================================================
   9. API GIÁO VIÊN
   ---------------------------------------------------------
   Dùng khi cần danh sách giáo viên để gán lớp/môn.
========================================================= */

/*
  Lấy danh sách giáo viên.
  API gọi: GET /api/teachers
*/
export async function getTeachers() {
  return request("/teachers", {}, "Không thể tải danh sách giáo viên");
}

/* =========================================================
   10. API PHÒNG HỌC
   ---------------------------------------------------------
   Dùng khi tạo lịch học, lớp học phần.
========================================================= */

/*
  Lấy danh sách phòng học.
  API gọi: GET /api/rooms
*/
export async function getClassRooms() {
  return request("/rooms", {}, "Không thể tải danh sách phòng học");
}

/* =========================================================
   11. API MÔN HỌC
   ---------------------------------------------------------
   Dùng khi tạo lớp học phần, lịch học.
========================================================= */

/*
  Lấy danh sách môn học.
  API gọi: GET /api/subjects
*/
export async function getSubjects() {
  return request("/subjects", {}, "Không thể tải danh sách môn học");
}

/* =========================================================
   12. API DASHBOARD ADMIN
   ---------------------------------------------------------
   Dùng cho trang AdminDashboard.
========================================================= */

/*
  Lấy dữ liệu dashboard admin:
  - Tổng sinh viên
  - Tổng giáo viên
  - Tổng phòng học
  - Tổng môn học
  - Tỷ lệ điểm danh
  API gọi: GET /api/admin/dashboard
*/
export async function getAdminDashboard() {
  return request(
    "/admin/dashboard",
    {},
    "Không thể tải dữ liệu dashboard"
  );
}