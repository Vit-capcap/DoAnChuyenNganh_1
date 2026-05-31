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

export async function getAccountOptions() {
  const res = await fetch(`${API_URL}/accounts/options`);
  return handleResponse(res, "Không thể tải dữ liệu người dùng");
}

export async function getAccounts(filters = {}) {
  const params = new URLSearchParams();

  if (filters.search?.trim()) {
    params.append("search", filters.search.trim());
  }

  if (filters.role) {
    params.append("role", filters.role);
  }

  if (filters.status) {
    params.append("status", filters.status);
  }

  params.append("page", String(filters.page || 1));
  params.append("limit", String(filters.limit || 10));

  const res = await fetch(`${API_URL}/accounts?${params.toString()}`);
  return handleResponse(res, "Không thể tải danh sách tài khoản");
}

export async function createAccount(payload) {
  const res = await fetch(`${API_URL}/accounts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res, "Thêm tài khoản thất bại");
}

export async function updateAccount(idAccount, payload) {
  const res = await fetch(`${API_URL}/accounts/${idAccount}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res, "Cập nhật tài khoản thất bại");
}

export async function updateAccountStatus(idAccount, status) {
  const res = await fetch(`${API_URL}/accounts/${idAccount}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  return handleResponse(res, "Cập nhật trạng thái thất bại");
}

export async function deleteAccountById(idAccount) {
  const res = await fetch(`${API_URL}/accounts/${idAccount}`, {
    method: "DELETE",
  });

  return handleResponse(res, "Xóa tài khoản thất bại");
}