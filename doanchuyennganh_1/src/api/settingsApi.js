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

export async function getSettings() {
  const res = await fetch(`${API_URL}/settings`);
  return handleResponse(res, "Không thể tải cài đặt hệ thống");
}

export async function getSettingLogs() {
  const res = await fetch(`${API_URL}/settings/logs`);
  return handleResponse(res, "Không thể tải lịch sử hệ thống");
}

export async function updateSettings(payload) {
  const res = await fetch(`${API_URL}/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res, "Lưu cài đặt thất bại");
}

export async function resetSettings() {
  const res = await fetch(`${API_URL}/settings/reset`, {
    method: "POST",
  });

  return handleResponse(res, "Đặt lại cài đặt thất bại");
}

export async function backupSettingsDatabase() {
  const res = await fetch(`${API_URL}/settings/backup`, {
    method: "POST",
  });

  return handleResponse(res, "Backup database thất bại");
}