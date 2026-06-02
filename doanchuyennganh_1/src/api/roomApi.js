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

/*
|--------------------------------------------------------------------------
| API quản lý phòng học
|--------------------------------------------------------------------------
*/

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

  const queryString = params.toString();
  const url = queryString ? `${API_URL}/rooms?${queryString}` : `${API_URL}/rooms`;

  const res = await fetch(url);

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

/*
|--------------------------------------------------------------------------
| API dùng cho trang camera phòng học
|--------------------------------------------------------------------------
*/

/**
 * Kiểm tra phòng có tồn tại không
 * Backend cần có:
 * GET /api/camera/room/check?roomName=A101
 */
export async function checkCameraRoom(roomName) {
  const res = await fetch(
    `${API_URL}/camera/room/check?roomName=${encodeURIComponent(roomName)}`
  );

  return handleResponse(res, "Không thể kiểm tra thông tin phòng");
}

/**
 * Kiểm tra phòng hôm nay có lịch học không
 * Backend cần có:
 * GET /api/camera/room/today-session?id_room=1
 */
export async function getTodayRoomSession(idRoom) {
  const res = await fetch(
    `${API_URL}/camera/room/today-session?id_room=${encodeURIComponent(idRoom)}`
  );

  return handleResponse(res, "Không thể kiểm tra lịch học hôm nay của phòng");
}