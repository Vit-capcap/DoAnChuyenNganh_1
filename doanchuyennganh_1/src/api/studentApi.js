// const API_URL = "http://localhost:3060/api";

// async function handleResponse(res, defaultMessage) {
//   const text = await res.text();

//   let data;

//   try {
//     data = text ? JSON.parse(text) : [];
//   } catch {
//     throw new Error(
//       "Backend không trả về JSON. Có thể sai API hoặc server đang trả HTML."
//     );
//   }

//   if (!res.ok) {
//     throw new Error(data.message || defaultMessage);
//   }

//   return data;
// }

// export async function getStudents() {
//   const res = await fetch(`${API_URL}/students`);

//   return handleResponse(res, "Không thể tải danh sách sinh viên");
// }

const API_URL = "http://localhost:3060/api";

async function handleResponse(res, defaultMessage) {
 // const contentType = res.headers.get("content-type") || "";
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
      // throw new Error( "Không thể kết nối đến backend. Hãy kiểm tra server Node.js đã chạy ở port 3060 chưa." );
    }

    throw error;
  }
}

/* =========================
   STUDENT API
========================= */

// Lấy danh sách sinh viên
export async function getStudents() {
  return request("/students", {}, "Không thể tải danh sách sinh viên");
}

// Lấy chi tiết sinh viên theo ID
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

// Thêm sinh viên
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

// Cập nhật sinh viên
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

// Xóa sinh viên
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

/* =========================
   DEPARTMENT API
========================= */

// Lấy danh sách khoa / bộ môn
export async function getDepartments() {
  return request("/departments", {}, "Không thể tải danh sách khoa");
}

/* =========================
   TEACHER API
========================= */

// Lấy danh sách giáo viên
export async function getTeachers() {
  return request("/teachers", {}, "Không thể tải danh sách giáo viên");
}

/* =========================
   CLASSROOM API
========================= */

// Lấy danh sách phòng học
export async function getClassRooms() {
  return request("/rooms", {}, "Không thể tải danh sách phòng học");
}

/* =========================
   SUBJECT API
========================= */

// Lấy danh sách môn học
export async function getSubjects() {
  return request("/subjects", {}, "Không thể tải danh sách môn học");
}

/* =========================
   DASHBOARD API
========================= */

// Lấy dữ liệu dashboard admin
export async function getAdminDashboard() {
  return request(
    "/admin/dashboard",
    {},
    "Không thể tải dữ liệu dashboard"
  );
}

/* =========================
   STUDENT SELF-SERVICE API
   (Dùng cho phân hệ Học sinh)
========================= */

/**
 * Lấy thông tin cá nhân của học sinh đang đăng nhập.
 * Truyền student_id qua query (giải pháp tạm - chưa có JWT).
 * @param {number} studentId - id_student từ user object sau login
 */
export async function getMyStudentProfile(studentId) {
  if (!studentId) {
    throw new Error("Thiếu student_id. Vui lòng đăng nhập lại.");
  }
  return request(
    `/student/profile?student_id=${studentId}`,
    {},
    "Không thể tải thông tin cá nhân"
  );
}

/**
 * Lấy lịch học của học sinh đang đăng nhập.
 * @param {number} studentId - id_student từ user object sau login
 * @param {Object} filters - { semester, school_year, status }
 */
export async function getMyStudentSchedule(studentId, filters = {}) {
  if (!studentId) {
    throw new Error("Thiếu student_id. Vui lòng đăng nhập lại.");
  }

  const params = new URLSearchParams({ student_id: studentId });

  if (filters.semester) params.append("semester", filters.semester);
  if (filters.school_year) params.append("school_year", filters.school_year);
  if (filters.status) params.append("status", filters.status);

  return request(
    `/student/schedule?${params.toString()}`,
    {},
    "Không thể tải lịch học"
  );
}