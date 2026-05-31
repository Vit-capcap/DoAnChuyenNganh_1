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

export async function getReportOptions() {
  const res = await fetch(`${API_URL}/reports/options`);
  return handleResponse(res, "Không thể tải bộ lọc báo cáo");
}

export async function getReportData(filters = {}) {
  const params = new URLSearchParams();

  params.append("period", filters.period || "month");

  if (filters.from_date) {
    params.append("from_date", filters.from_date);
  }

  if (filters.to_date) {
    params.append("to_date", filters.to_date);
  }

  if (filters.class_name) {
    params.append("class_name", filters.class_name);
  }

  if (filters.id_subject) {
    params.append("id_subject", filters.id_subject);
  }

  const res = await fetch(`${API_URL}/reports?${params.toString()}`);
  return handleResponse(res, "Không thể tải dữ liệu báo cáo");
}