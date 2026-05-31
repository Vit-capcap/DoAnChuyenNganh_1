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

export async function getSchedules(filters = {}) {
  const params = new URLSearchParams();

  if (filters.search?.trim()) {
    params.append("search", filters.search.trim());
  }

  if (filters.id_course_class) {
    params.append("id_course_class", filters.id_course_class);
  }

  if (filters.id_teacher) {
    params.append("id_teacher", filters.id_teacher);
  }

  if (filters.id_room) {
    params.append("id_room", filters.id_room);
  }

  if (filters.day_of_week) {
    params.append("day_of_week", filters.day_of_week);
  }

  const res = await fetch(`${API_URL}/schedules?${params.toString()}`);

  return handleResponse(res, "Không thể tải lịch học");
}

export async function getScheduleOptions() {
  const res = await fetch(`${API_URL}/schedules/options`);

  return handleResponse(res, "Không thể tải dữ liệu form lịch học");
}

export async function createSchedule(payload) {
  const res = await fetch(`${API_URL}/schedules`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res, "Thêm lịch học thất bại");
}

export async function updateSchedule(idSchedule, payload) {
  const res = await fetch(`${API_URL}/schedules/${idSchedule}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res, "Cập nhật lịch học thất bại");
}

export async function deleteSchedule(idSchedule) {
  const res = await fetch(`${API_URL}/schedules/${idSchedule}`, {
    method: "DELETE",
  });

  return handleResponse(res, "Xóa lịch học thất bại");
}