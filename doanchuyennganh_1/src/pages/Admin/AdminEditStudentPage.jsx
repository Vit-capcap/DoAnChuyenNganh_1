import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Sidebar from "../components/admin/Sidebar";
import Header from "../components/admin/Header";

const API_URL = "http://localhost:3060/api";

const initialForm = {
  id_student: "",
  student_code: "",
  full_name: "",
  gender: "",
  date_of_birth: "",
  phone: "",
  email: "",
  avatar: "",
  faculty: "",
  class_name: "",
  course_year: "",
  status: "ACTIVE",
  account_status: "ACTIVE",
  id_face: "",
  face_image: "",
  model_version: "",
  face_created_at: "",
  created_at: "",
  updated_at: "",
};

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

function formatDateInput(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function formatDateTime(value) {
  if (!value) return "Chưa có dữ liệu";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa có dữ liệu";
  }

  return date.toLocaleString("vi-VN");
}

function getAvatarSrc(formData, avatarPreview) {
  if (avatarPreview) return avatarPreview;
  if (formData.avatar) return formData.avatar;
  if (formData.face_image) return formData.face_image;

  const name = encodeURIComponent(formData.full_name || "Student");
  return `https://ui-avatars.com/api/?name=${name}&background=2563eb&color=ffffff`;
}

function getStatusBadge(status) {
  if (status === "ACTIVE") {
    return {
      text: "Đang học",
      className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    };
  }

  return {
    text: "Ngừng học",
    className: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
  };
}

function getAccountBadge(status) {
  if (status === "ACTIVE") {
    return {
      text: "Tài khoản hoạt động",
      className: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
    };
  }

  if (status === "LOCKED") {
    return {
      text: "Tài khoản đã khóa",
      className: "bg-red-50 text-red-700 ring-1 ring-red-100",
    };
  }

  return {
    text: "Chưa rõ tài khoản",
    className: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  };
}

export default function AdminEditStudentPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState(initialForm);
  const [originalData, setOriginalData] = useState(initialForm);
  const [avatarPreview, setAvatarPreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadStudent = async () => {
      try {
        const res = await fetch(`${API_URL}/students/${id}`, {
          signal: controller.signal,
        });

        const data = await handleResponse(
          res,
          "Không thể tải thông tin sinh viên"
        );

        const formattedData = {
          id_student: data.id_student || "",
          student_code: data.student_code || "",
          full_name: data.full_name || "",
          gender: data.gender || "",
          date_of_birth: formatDateInput(data.date_of_birth),
          phone: data.phone || "",
          email: data.email || "",
          avatar: data.avatar || "",
          faculty: data.faculty || "",
          class_name: data.class_name || "",
          course_year: data.course_year || "",
          status: data.status || "ACTIVE",
          account_status: data.account_status || "ACTIVE",
          id_face: data.id_face || "",
          face_image: data.face_image || "",
          model_version: data.model_version || "",
          face_created_at: data.face_created_at || "",
          created_at: data.created_at || "",
          updated_at: data.updated_at || "",
        };

        setFormData(formattedData);
        setOriginalData(formattedData);
        setAvatarPreview("");
        setMessage("");
      } catch (error) {
        if (error.name === "AbortError") return;

        console.error("Lỗi tải sinh viên:", error);
        setMessage(error.message || "Không thể tải thông tin sinh viên");
      } finally {
        setLoading(false);
      }
    };

    loadStudent();

    return () => {
      controller.abort();
    };
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Vui lòng chọn file hình ảnh hợp lệ");
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setMessage("Ảnh không được vượt quá 5MB");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setAvatarPreview(reader.result);

      setFormData((prev) => ({
        ...prev,
        avatar: reader.result,
      }));
    };

    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    if (!formData.student_code.trim()) {
      setMessage("Vui lòng nhập mã sinh viên");
      return false;
    }

    if (!formData.full_name.trim()) {
      setMessage("Vui lòng nhập họ tên sinh viên");
      return false;
    }

    if (formData.email && !formData.email.includes("@")) {
      setMessage("Email không hợp lệ");
      return false;
    }

    return true;
  };

  const buildPayload = () => {
    return {
      student_code: formData.student_code.trim(),
      full_name: formData.full_name.trim(),
      gender: formData.gender || null,
      date_of_birth: formData.date_of_birth || null,
      phone: formData.phone || null,
      email: formData.email || null,
      avatar: formData.avatar || null,
      faculty: formData.faculty || null,
      class_name: formData.class_name || null,
      course_year: formData.course_year || null,
      status: formData.status || "ACTIVE",
      account_status: formData.account_status || "ACTIVE",
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!validateForm()) return;

    try {
      setSaving(true);

      const res = await fetch(`${API_URL}/students/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildPayload()),
      });

      await handleResponse(res, "Cập nhật sinh viên thất bại");

      alert("Cập nhật sinh viên thành công");
      navigate(`/studentdetail/${id}`);
    } catch (error) {
      console.error("Lỗi cập nhật sinh viên:", error);
      setMessage(error.message || "Cập nhật sinh viên thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(originalData);
    setAvatarPreview("");
    setMessage("");
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa sinh viên ${formData.student_code} - ${formData.full_name} không?`
    );

    if (!confirmDelete) return;

    try {
      setDeleting(true);
      setMessage("");

      const res = await fetch(`${API_URL}/students/${id}`, {
        method: "DELETE",
      });

      await handleResponse(res, "Xóa sinh viên thất bại");

      alert("Xóa sinh viên thành công");
      navigate("/students");
    } catch (error) {
      console.error("Lỗi xóa sinh viên:", error);
      setMessage(error.message || "Xóa sinh viên thất bại");
    } finally {
      setDeleting(false);
    }
  };

  const studentStatusBadge = getStatusBadge(formData.status);
  const accountBadge = getAccountBadge(formData.account_status);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-700 flex">
        <Sidebar activePage="students" />

        <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
          <Header />

          <main className="flex-1 p-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm flex flex-col items-center justify-center min-h-[320px]">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />

              <p className="text-sm font-semibold text-slate-600">
                Đang tải thông tin sinh viên...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar activePage="students" />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 text-white shadow-lg shadow-blue-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 text-blue-100 text-sm mb-2">
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="hover:text-white transition font-semibold"
                  >
                    Trang chủ
                  </button>

                  <span className="material-symbols-outlined text-[16px]">
                    chevron_right
                  </span>

                  <button
                    type="button"
                    onClick={() => navigate("/students")}
                    className="hover:text-white transition font-semibold"
                  >
                    Học sinh - sinh viên
                  </button>

                  <span className="material-symbols-outlined text-[16px]">
                    chevron_right
                  </span>

                  <span className="font-semibold text-white">Chỉnh sửa</span>
                </div>

                <h2 className="text-3xl font-bold tracking-tight">
                  Chỉnh sửa học sinh - sinh viên
                </h2>

                <p className="text-sm text-blue-100 mt-2 max-w-2xl">
                  Cập nhật thông tin cá nhân, tài khoản và dữ liệu nhận diện cho{" "}
                  <span className="font-bold text-white">
                    {formData.student_code || "sinh viên"}
                  </span>
                  .
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/studentdetail/${id}`)}
                  className="bg-white/15 hover:bg-white/25 text-white px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-semibold transition border border-white/20"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_back
                  </span>
                  Quay lại chi tiết
                </button>

                <div className="bg-white/15 text-white px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-semibold border border-white/20">
                  <span className="material-symbols-outlined text-[18px]">
                    history
                  </span>
                  {formatDateTime(formData.updated_at)}
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 flex items-start gap-2">
              <span className="material-symbols-outlined text-[20px]">
                error
              </span>
              <span>{message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <aside className="space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      Sinh trắc học
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      Ảnh đại diện và dữ liệu FaceID
                    </p>
                  </div>

                  <span className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <span className="material-symbols-outlined">face</span>
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <label className="relative w-40 h-40 mb-5 group cursor-pointer block">
                    <img
                      alt="Student Avatar"
                      className="w-full h-full object-cover rounded-3xl border-4 border-white shadow-sm bg-slate-100"
                      src={getAvatarSrc(formData, avatarPreview)}
                    />

                    <div className="absolute -bottom-2 -right-2 w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg">
                      <span className="material-symbols-outlined text-[22px]">
                        photo_camera
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-slate-950/60 rounded-3xl opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2 text-white">
                      <span className="material-symbols-outlined text-3xl">
                        upload
                      </span>
                      <span className="text-sm font-bold">Cập nhật ảnh</span>
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>

                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold mb-4 ${
                      formData.id_face
                        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                        : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {formData.id_face ? "check_circle" : "info"}
                    </span>

                    {formData.id_face
                      ? "Đã đăng ký FaceID"
                      : "Chưa đăng ký FaceID"}
                  </div>

                  <p className="text-center text-sm text-slate-500 mb-6 leading-6">
                    {formData.id_face
                      ? `Model: ${
                          formData.model_version || "Chưa có phiên bản"
                        }. Ngày tạo: ${formatDateTime(formData.face_created_at)}`
                      : "Sinh viên này chưa có dữ liệu khuôn mặt trong bảng FaceData."}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      alert(
                        "Chức năng quét lại khuôn mặt cần kết nối module camera/AI riêng."
                      )
                    }
                    className="w-full py-3 px-4 rounded-2xl border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 font-bold transition flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      refresh
                    </span>
                    Quét lại khuôn mặt
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      Thông tin hệ thống
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      Dữ liệu định danh trong hệ thống
                    </p>
                  </div>

                  <span className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <span className="material-symbols-outlined">
                      database
                    </span>
                  </span>
                </div>

                <div className="space-y-3">
                  <InfoBox label="ID sinh viên" value={formData.id_student} />
                  <InfoBox label="Mã sinh viên" value={formData.student_code} />
                  <InfoBox
                    label="Ngày tạo"
                    value={formatDateTime(formData.created_at)}
                  />
                  <InfoBox
                    label="Ngày cập nhật"
                    value={formatDateTime(formData.updated_at)}
                  />

                  <div className="flex flex-wrap gap-2 pt-1">
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${studentStatusBadge.className}`}
                    >
                      {studentStatusBadge.text}
                    </span>

                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${accountBadge.className}`}
                    >
                      {accountBadge.text}
                    </span>
                  </div>
                </div>
              </div>
            </aside>

            <section className="xl:col-span-2 space-y-6">
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200"
              >
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      Thông tin cá nhân
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      Các trường có dấu * là bắt buộc.
                    </p>
                  </div>

                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                    ID: {formData.id_student || "-"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input
                    label="Họ và tên"
                    required
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Nhập họ tên sinh viên"
                    icon="person"
                  />

                  <Input
                    label="Mã số sinh viên"
                    required
                    name="student_code"
                    value={formData.student_code}
                    onChange={handleChange}
                    disabled
                    icon="badge"
                  />

                  <Input
                    label="Ngày sinh"
                    name="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    icon="calendar_today"
                  />

                  <Select
                    label="Giới tính"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    options={[
                      { value: "", label: "Chọn giới tính" },
                      { value: "Male", label: "Nam" },
                      { value: "Female", label: "Nữ" },
                      { value: "Other", label: "Khác" },
                    ]}
                  />

                  <Input
                    label="Khoa"
                    name="faculty"
                    value={formData.faculty}
                    onChange={handleChange}
                    placeholder="Ví dụ: Công nghệ thông tin"
                    icon="school"
                  />

                  <Input
                    label="Lớp"
                    name="class_name"
                    value={formData.class_name}
                    onChange={handleChange}
                    placeholder="Ví dụ: CNTT-K60"
                    icon="class"
                  />

                  <Input
                    label="Khóa học"
                    name="course_year"
                    value={formData.course_year}
                    onChange={handleChange}
                    placeholder="Ví dụ: K60"
                    icon="calendar_month"
                  />

                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@university.edu.vn"
                    icon="mail"
                  />

                  <Input
                    label="Số điện thoại"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="09xx xxx xxx"
                    icon="phone_iphone"
                  />

                  <Select
                    label="Trạng thái học tập"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    options={[
                      { value: "ACTIVE", label: "Đang học" },
                      { value: "INACTIVE", label: "Ngừng học" },
                    ]}
                  />

                  <Select
                    label="Trạng thái tài khoản"
                    name="account_status"
                    value={formData.account_status}
                    onChange={handleChange}
                    options={[
                      { value: "ACTIVE", label: "Đang hoạt động" },
                      { value: "LOCKED", label: "Đã khóa" },
                    ]}
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => navigate(`/studentdetail/${id}`)}
                    className="px-6 py-3 rounded-2xl text-slate-600 hover:bg-slate-100 text-sm font-bold transition"
                  >
                    Hủy
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-6 py-3 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 text-sm font-bold transition"
                  >
                    Đặt lại
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold shadow-sm disabled:bg-blue-300 disabled:cursor-not-allowed transition inline-flex items-center justify-center gap-2"
                  >
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        saving ? "animate-spin" : ""
                      }`}
                    >
                      {saving ? "progress_activity" : "save"}
                    </span>
                    {saving ? "Đang cập nhật..." : "Cập nhật sinh viên"}
                  </button>
                </div>
              </form>

              <div className="border border-red-100 rounded-3xl p-6 bg-red-50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-red-600 flex items-center gap-2">
                      <span className="material-symbols-outlined">
                        warning
                      </span>
                      Khu vực nguy hiểm
                    </h3>

                    <p className="text-sm text-slate-600 mt-2 leading-6">
                      Hành động này sẽ xóa sinh viên khỏi hệ thống. Nếu sinh
                      viên đang có dữ liệu điểm danh, ghi danh hoặc dữ liệu liên
                      quan, backend có thể chặn thao tác xóa.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="shrink-0 px-6 py-3 rounded-2xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 shadow-sm disabled:bg-red-300 disabled:cursor-not-allowed transition inline-flex items-center justify-center gap-2"
                  >
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        deleting ? "animate-spin" : ""
                      }`}
                    >
                      {deleting ? "progress_activity" : "delete"}
                    </span>
                    {deleting ? "Đang xóa..." : "Xóa sinh viên"}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function Input({
  label,
  name,
  type = "text",
  value = "",
  onChange,
  placeholder = "",
  disabled = false,
  required = false,
  icon,
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
        {label} {required && <span className="text-red-600">*</span>}
      </label>

      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[20px]">
            {icon}
          </span>
        )}

        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full rounded-2xl border py-3 px-4 text-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-50 ${
            icon ? "pl-12" : ""
          } ${
            disabled
              ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed"
              : "bg-slate-50 border-slate-200 text-slate-900"
          }`}
        />
      </div>
    </div>
  );
}

function Select({ label, name, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
        {label}
      </label>

      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl py-3 px-4 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none appearance-none transition"
        >
          {options.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          expand_more
        </span>
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
      <p className="text-xs font-bold text-slate-400 uppercase">{label}</p>

      <p className="text-sm font-black text-slate-900 mt-1 break-all">
        {value || "Chưa có dữ liệu"}
      </p>
    </div>
  );
}