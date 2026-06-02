// const API_URL = "http://localhost:3060/api";

// async function handleResponse(res, defaultMessage) {
//   const text = await res.text();

//   let data;

//   try {
//     data = text ? JSON.parse(text) : null;
//   } catch {
//     throw new Error(
// <<<<<<< HEAD
//       "Backend không trả về JSON. Có thể sai API hoặc server đang trả HTML."
// =======
//       "Backend không trả về JSON. Có thể sai API /api/cameras hoặc server đang trả HTML."
// >>>>>>> origin/main
//     );
//   }

//   if (!res.ok) {
//     throw new Error(data?.message || defaultMessage);
//   }

//   return data;
// }

// export function normalizeList(data, key) {
//   if (Array.isArray(data)) return data;
//   if (Array.isArray(data?.[key])) return data[key];
//   return [];
// }

// <<<<<<< HEAD
// /*
// |--------------------------------------------------------------------------
// | API quản lý camera
// |--------------------------------------------------------------------------
// */

// =======
// >>>>>>> origin/main
// export async function getCameraOptions() {
//   const res = await fetch(`${API_URL}/cameras/options`);
//   return handleResponse(res, "Không thể tải danh sách phòng học");
// }

// export async function getCameras(filters = {}, signal) {
//   const params = new URLSearchParams();

//   if (filters.search?.trim()) {
//     params.append("search", filters.search.trim());
//   }

//   if (filters.status) {
//     params.append("status", filters.status);
//   }

//   if (filters.id_room) {
//     params.append("id_room", filters.id_room);
//   }

//   const query = params.toString();
//   const url = query ? `${API_URL}/cameras?${query}` : `${API_URL}/cameras`;

//   const res = await fetch(url, { signal });
//   return handleResponse(res, "Không thể tải danh sách camera");
// }

// export async function createCamera(payload) {
//   const res = await fetch(`${API_URL}/cameras`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(payload),
//   });

//   return handleResponse(res, "Thêm camera thất bại");
// }

// export async function updateCamera(idCamera, payload) {
//   const res = await fetch(`${API_URL}/cameras/${idCamera}`, {
//     method: "PUT",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(payload),
//   });

//   return handleResponse(res, "Cập nhật camera thất bại");
// }

// export async function updateCameraStatus(idCamera, status) {
//   const res = await fetch(`${API_URL}/cameras/${idCamera}/status`, {
//     method: "PATCH",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ status }),
//   });

//   return handleResponse(res, "Đổi trạng thái camera thất bại");
// }

// export async function deleteCameraById(idCamera) {
//   const res = await fetch(`${API_URL}/cameras/${idCamera}`, {
//     method: "DELETE",
//   });

//   return handleResponse(res, "Xóa camera thất bại");
// <<<<<<< HEAD
// }

// /*
// |--------------------------------------------------------------------------
// | API cho trang CameraRoomPage
// |--------------------------------------------------------------------------
// | Dùng cho màn hình nhập phòng -> kiểm tra lịch học -> bật camera
// |--------------------------------------------------------------------------
// */

// /**
//  * Kiểm tra phòng có tồn tại không.
//  * Backend cần có:
//  * GET /api/camera/room/check?roomName=A101
//  */
// export async function checkCameraRoom(roomName) {
//   const res = await fetch(
//     `${API_URL}/camera/room/check?roomName=${encodeURIComponent(roomName)}`
//   );

//   return handleResponse(res, "Không thể kiểm tra thông tin phòng");
// }

// /**
//  * Kiểm tra hôm nay phòng đó có lịch học không.
//  * Backend cần có:
//  * GET /api/camera/room/today-session?id_room=1
//  */
// export async function getTodayRoomSession(idRoom) {
//   const res = await fetch(
//     `${API_URL}/camera/room/today-session?id_room=${encodeURIComponent(idRoom)}`
//   );

//   return handleResponse(res, "Không thể kiểm tra lịch học hôm nay của phòng");
// }

// /**
//  * Kiểm tra camera của phòng.
//  * Backend nên có:
//  * GET /api/camera/room/device?id_room=1
//  */
// export async function getRoomCameraDevice(idRoom) {
//   const res = await fetch(
//     `${API_URL}/camera/room/device?id_room=${encodeURIComponent(idRoom)}`
//   );

//   return handleResponse(res, "Không thể kiểm tra thiết bị camera của phòng");
// =======
// >>>>>>> origin/main
// }

const API_URL = "http://localhost:3060/api";

async function handleResponse(res, defaultMessage) {
  const text = await res.text();

  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      "Backend không trả về JSON. Có thể sai API /api/cameras hoặc server đang trả HTML."
    );
  }

  if (!res.ok) {
    throw new Error(data?.message || defaultMessage);
  }

  return data;
}

export function normalizeList(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  return [];
}

/*
|--------------------------------------------------------------------------
| API quản lý camera
|--------------------------------------------------------------------------
*/

export async function getCameraOptions() {
  const res = await fetch(`${API_URL}/cameras/options`);
  return handleResponse(res, "Không thể tải danh sách phòng học");
}

export async function getCameras(filters = {}, signal) {
  const params = new URLSearchParams();

  if (filters.search?.trim()) {
    params.append("search", filters.search.trim());
  }

  if (filters.status) {
    params.append("status", filters.status);
  }

  if (filters.id_room) {
    params.append("id_room", filters.id_room);
  }

  const query = params.toString();
  const url = query ? `${API_URL}/cameras?${query}` : `${API_URL}/cameras`;

  const res = await fetch(url, { signal });
  return handleResponse(res, "Không thể tải danh sách camera");
}

export async function createCamera(payload) {
  const res = await fetch(`${API_URL}/cameras`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res, "Thêm camera thất bại");
}

export async function updateCamera(idCamera, payload) {
  const res = await fetch(`${API_URL}/cameras/${idCamera}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res, "Cập nhật camera thất bại");
}

export async function updateCameraStatus(idCamera, status) {
  const res = await fetch(`${API_URL}/cameras/${idCamera}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  return handleResponse(res, "Đổi trạng thái camera thất bại");
}

export async function deleteCameraById(idCamera) {
  const res = await fetch(`${API_URL}/cameras/${idCamera}`, {
    method: "DELETE",
  });

  return handleResponse(res, "Xóa camera thất bại");
}

/*
|--------------------------------------------------------------------------
| API cho trang CameraRoomPage
|--------------------------------------------------------------------------
| Dùng cho màn hình nhập phòng -> kiểm tra lịch học -> bật camera
|--------------------------------------------------------------------------
*/

/**
 * Kiểm tra phòng có tồn tại không.
 * Backend:
 * GET /api/cameras/room/check?roomName=A101
 */
export async function checkCameraRoom(roomName) {
  const res = await fetch(
    `${API_URL}/cameras/room/check?roomName=${encodeURIComponent(roomName)}`
  );

  return handleResponse(res, "Không thể kiểm tra thông tin phòng");
}

/**
 * Kiểm tra hôm nay phòng đó có lịch học không.
 * Backend:
 * GET /api/cameras/room/today-session?id_room=1
 */
export async function getTodayRoomSession(idRoom) {
  const res = await fetch(
    `${API_URL}/cameras/room/today-session?id_room=${encodeURIComponent(idRoom)}`
  );

  return handleResponse(res, "Không thể kiểm tra lịch học hôm nay của phòng");
}

/**
 * Kiểm tra camera của phòng.
 * Backend:
 * GET /api/cameras/room/device?id_room=1
 */
export async function getRoomCameraDevice(idRoom) {
  const res = await fetch(
    `${API_URL}/cameras/room/device?id_room=${encodeURIComponent(idRoom)}`
  );

  return handleResponse(res, "Không thể kiểm tra thiết bị camera của phòng");
}