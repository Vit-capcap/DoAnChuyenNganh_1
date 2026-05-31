import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/admin/Sidebar";
import Header from "../components/admin/Header";

const API_URL = "http://localhost:3060/api";

export default function AdminAddTeacherPage() {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);

  const [formData, setFormData] = useState({
    teacher_code: "",
    full_name: "",
    gender: "",
    date_of_birth: "",
    phone: "",
    email: "",
    avatar: "",
    password: "",
    confirm_password: "",
    department_id: "",
    account_status: "ACTIVE",
  });

  const [avatarPreview, setAvatarPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

useEffect(() => {
  let isMounted = true;

  const loadDepartments = async () => {
    try {
      const res = await fetch('http://localhost:3060/api/departments');

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Server không trả về JSON:", text);
        throw new Error("API departments không trả về JSON. Kiểm tra lại route backend.");
      }

      if (!res.ok) {
        throw new Error(data.message || "Không thể lấy danh sách khoa");
      }

      if (!Array.isArray(data)) {
        throw new Error("Dữ liệu khoa/bộ môn không hợp lệ");
      }

      if (isMounted) {
        setDepartments(data);
      }
    } catch (error) {
      console.error("Lỗi lấy khoa:", error);

      if (isMounted) {
        setMessage(error.message || "Không thể tải danh sách khoa/bộ môn");
      }
    }
  };

  loadDepartments();

  return () => {
    isMounted = false;
  };
}, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleStatus = () => {
    setFormData((prev) => ({
      ...prev,
      account_status: prev.account_status === "ACTIVE" ? "LOCKED" : "ACTIVE",
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

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
    if (!formData.teacher_code.trim()) {
      setMessage("Vui lòng nhập mã giáo viên");
      return false;
    }

    if (!formData.full_name.trim()) {
      setMessage("Vui lòng nhập họ tên giáo viên");
      return false;
    }

    if (!formData.email.trim()) {
      setMessage("Vui lòng nhập email");
      return false;
    }

    if (!formData.phone.trim()) {
      setMessage("Vui lòng nhập số điện thoại");
      return false;
    }

    if (!formData.department_id) {
      setMessage("Vui lòng chọn khoa/bộ môn");
      return false;
    }

    if (!formData.password.trim()) {
      setMessage("Vui lòng nhập mật khẩu");
      return false;
    }

    if (formData.password !== formData.confirm_password) {
      setMessage("Mật khẩu xác nhận không khớp");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        teacher_code: formData.teacher_code,
        full_name: formData.full_name,
        gender: formData.gender || null,
        date_of_birth: formData.date_of_birth || null,
        phone: formData.phone,
        email: formData.email,
        avatar: formData.avatar || null,
        password: formData.password,
        department_id: Number(formData.department_id),
        account_status: formData.account_status,
      };

      const res = await fetch(`${API_URL}/teachers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Thêm giáo viên thất bại");
      }

      alert("Thêm giáo viên thành công");
      navigate("/teachers");
    } catch (error) {
      console.error("Lỗi thêm giáo viên:", error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/teachers");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex">
      <Sidebar activePage="teachers" />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="hover:text-blue-600 transition font-medium"
              >
                Trang chủ
              </button>

              <span className="material-symbols-outlined text-[16px]">
                chevron_right
              </span>

              <button
                type="button"
                onClick={() => navigate("/teachers")}
                className="hover:text-blue-600 transition font-medium"
              >
                Giáo viên
              </button>

              <span className="material-symbols-outlined text-[16px]">
                chevron_right
              </span>

              <span className="font-semibold text-gray-900">
                Thêm giáo viên
              </span>
            </div>

            <h2 className="text-3xl font-bold text-gray-900">
              Thêm giáo viên mới
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Nhập thông tin để tạo hồ sơ giáo viên và tài khoản đăng nhập.
            </p>
          </div>

          {message && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 flex flex-col gap-6">
                <Section title="Thông tin cá nhân" icon="badge">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Mã giáo viên *"
                      name="teacher_code"
                      value={formData.teacher_code}
                      onChange={handleChange}
                      placeholder="Ví dụ: GV001"
                    />

                    <Input
                      label="Họ và tên *"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Nhập họ và tên"
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
                      label="Ngày sinh"
                      name="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                    />

                    <Input
                      label="Email *"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@truong.edu.vn"
                    />

                    <Input
                      label="Số điện thoại *"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="09xx xxx xxx"
                    />
                  </div>
                </Section>

                <Section title="Thông tin công tác" icon="work">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* <Select
                      label="Khoa / Bộ môn *"
                      name="department_id"
                      value={formData.department_id}
                      onChange={handleChange}
                      options={[
                        { value: "", label: "Chọn khoa/bộ môn" },
                        ...departments.map((item) => ({
                          value: item.id_department,
                          label: item.department_name,
                        })),
                      ]}
                    /> */}
                    <Select
  label="Khoa / Bộ môn *"
  name="department_id"
  value={formData.department_id}
  onChange={handleChange}
  options={[
    { value: "", label: "Chọn khoa/bộ môn" },
    ...departments.map((item) => ({
      value: item.id_department,
      label: item.department_name,
    })),
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
                </Section>
              </div>

              <div className="xl:col-span-1 flex flex-col gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center">
                  <label className="w-32 h-32 rounded-full border-2 border-dashed border-blue-300 bg-blue-50 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 transition mb-4 group overflow-hidden">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-blue-600 text-3xl mb-1 group-hover:scale-110 transition">
                          add_a_photo
                        </span>
                        <span className="text-xs font-semibold text-blue-600">
                          Tải ảnh lên
                        </span>
                      </>
                    )}

                    <input
                      className="hidden"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </label>

                  <h4 className="text-sm font-bold text-gray-900">
                    Ảnh đại diện FaceID
                  </h4>

                  <p className="text-xs text-gray-500 mt-1 max-w-[220px]">
                    Ảnh sẽ được gửi vào trường avatar của bảng Teacher.
                  </p>
                </div>

                <Section title="Tài khoản hệ thống" icon="shield_person">
                  <div className="space-y-4">
                    <Input
                      label="Tên đăng nhập"
                      value={formData.email}
                      disabled
                      placeholder="Tự động lấy từ email"
                    />

                    <Input
                      label="Mật khẩu *"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Nhập mật khẩu"
                    />

                    <Input
                      label="Xác nhận mật khẩu *"
                      name="confirm_password"
                      type="password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      placeholder="Nhập lại mật khẩu"
                    />

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <span className="text-sm font-semibold text-gray-900 block">
                          Cho phép đăng nhập
                        </span>

                        <span className="text-xs text-gray-500">
                          {formData.account_status === "ACTIVE"
                            ? "Tài khoản đang hoạt động"
                            : "Tài khoản đang bị khóa"}
                        </span>
                      </div>

                      <Toggle
                        checked={formData.account_status === "ACTIVE"}
                        onChange={handleToggleStatus}
                      />
                    </div>
                  </div>
                </Section>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-100"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 shadow-sm disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">
                  save
                </span>

                {loading ? "Đang lưu..." : "Lưu giáo viên"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
        <span className="material-symbols-outlined text-blue-600 bg-blue-50 p-2 rounded-xl">
          {icon}
        </span>

        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
      </div>

      {children}
    </div>
  );
}

function Input({
  label,
  name,
  type = "text",
  placeholder = "",
  value = "",
  disabled = false,
  onChange,
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-700 mb-1 block">
        {label}
      </label>

      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={onChange}
        className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 ${
          disabled
            ? "bg-gray-100 border border-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-gray-50 border border-gray-200 text-gray-900"
        }`}
      />
    </div>
  );
}

function Select({ label, name, value, onChange, options }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-700 mb-1 block">
        {label}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
      >
        {options.map((item, index) => (
          <option key={index} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
      />

      <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
    </label>
  );
}