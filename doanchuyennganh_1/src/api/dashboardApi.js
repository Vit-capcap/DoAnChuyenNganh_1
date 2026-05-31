const API_URL = "http://localhost:3060/api";

async function handleResponse(res, defaultMessage) {
  const text = await res.text();

  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    console.error("Backend không trả JSON:", text);

    throw new Error(
      "Backend không trả về JSON. Có thể sai API, sai port hoặc route backend chưa được khai báo."
    );
  }

  if (!res.ok) {
    throw new Error(data?.message || defaultMessage);
  }

  return data;
}

export async function getAdminDashboard() {
  const res = await fetch(`${API_URL}/admin/dashboard`);
  return handleResponse(res, "Không thể tải dashboard");
}