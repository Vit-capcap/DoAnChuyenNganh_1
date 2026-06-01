const API_URL = "http://localhost:3060/api";

/*
|--------------------------------------------------------------------------
| Hàm xử lý response chung
|--------------------------------------------------------------------------
*/
async function handleResponse(res, defaultMessage) {
  const text = await res.text();

  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      "Backend không trả về JSON. Có thể sai API hoặc server đang trả HTML."
    );
  }

  if (!res.ok) {
    throw new Error(data?.message || defaultMessage);
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| API: Đăng nhập
|--------------------------------------------------------------------------
| Method: POST
| URL: /api/auth/login
|--------------------------------------------------------------------------
*/
export async function loginAccount(payload) {
  if (!payload) {
    throw new Error("Thiếu dữ liệu đăng nhập");
  }

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res, "Đăng nhập thất bại");
}