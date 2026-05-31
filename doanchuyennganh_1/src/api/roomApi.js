const API_URL = "http://localhost:3060/api";

async function handleResponse(res, defaultMessage) {
  const text = await res.text();

  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      "Backend không trả về JSON. Có thể sai API hoặc server đang trả về HTML."
    );
  }

  if (!res.ok) {
    throw new Error(data.message || defaultMessage);
  }

  return data;
}

export async function getRooms(filters = {}) {
  const params = new URLSearchParams();

  if (filters.search?.trim()) {
    params.append("search", filters.search.trim());
  }

  if (filters.building) {
    params.append("building", filters.building);
  }

  if (filters.room_status) {
    params.append("room_status", filters.room_status);
  }

  if (filters.camera_status) {
    params.append("camera_status", filters.camera_status);
  }

  const res = await fetch(`${API_URL}/rooms?${params.toString()}`);

  return handleResponse(res, "Không thể tải danh sách phòng học");
}

export async function createRoom(payload) {
  const res = await fetch(`${API_URL}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res, "Thêm phòng học thất bại");
}

export async function updateRoom(idRoom, payload) {
  const res = await fetch(`${API_URL}/rooms/${idRoom}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res, "Cập nhật phòng học thất bại");
}

export async function deleteRoom(idRoom) {
  const res = await fetch(`${API_URL}/rooms/${idRoom}`, {
    method: "DELETE",
  });

  return handleResponse(res, "Xóa phòng học thất bại");
}