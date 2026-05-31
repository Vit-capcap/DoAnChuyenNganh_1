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