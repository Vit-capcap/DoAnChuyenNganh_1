const API_URL = "http://localhost:3060/api";

async function handleResponse(res, defaultMessage) {
  const text = await res.text();

  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      "Backend không trả về JSON. Có thể sai API hoặc server đang trả HTML."
    );
  }

  if (!res.ok) {
    throw new Error(data.message || defaultMessage);
  }

  return data;
}

export async function getAttendanceOptions() {
  const res = await fetch(`${API_URL}/attendance/options`);
  return handleResponse(res, "Không thể tải dữ liệu bộ lọc");
}

export async function getAttendances(filters = {}) {
  const params = new URLSearchParams();

  if (filters.search?.trim()) {
    params.append("search", filters.search.trim());
  }

  if (filters.class_name) {
    params.append("class_name", filters.class_name);
  }

  if (filters.id_subject) {
    params.append("id_subject", filters.id_subject);
  }

  if (filters.status) {
    params.append("status", filters.status);
  }

  if (filters.date) {
    params.append("date", filters.date);
  }

  params.append("page", String(filters.page || 1));
  params.append("limit", String(filters.limit || 10));

  const res = await fetch(`${API_URL}/attendance?${params.toString()}`);
  return handleResponse(res, "Không thể tải danh sách điểm danh");
}

export async function searchAttendanceStudents(search = "") {
  const res = await fetch(
    `${API_URL}/attendance/search-students/list?search=${encodeURIComponent(
      search
    )}`
  );

  return handleResponse(res, "Không thể tìm sinh viên");
}

export async function createManualAttendance(payload) {
  const res = await fetch(`${API_URL}/attendance`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res, "Điểm danh thủ công thất bại");
}

export async function updateAttendance(idAttendance, payload) {
  const res = await fetch(`${API_URL}/attendance/${idAttendance}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res, "Cập nhật điểm danh thất bại");
}

export async function deleteAttendanceById(idAttendance) {
  const res = await fetch(`${API_URL}/attendance/${idAttendance}`, {
    method: "DELETE",
  });

  return handleResponse(res, "Xóa điểm danh thất bại");
}