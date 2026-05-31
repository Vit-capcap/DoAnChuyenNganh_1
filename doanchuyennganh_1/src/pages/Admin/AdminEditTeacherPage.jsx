import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Sidebar from "../components/admin/Sidebar";
import Header from "../components/admin/Header";

const API_URL = "http://localhost:3060/api";

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

export default function AdminEditTeacherPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  const [avatarPreview, setAvatarPreview] = useState("");

  const [formData, setFormData] = useState({
    id_teacher: "",
    teacher_code: "",
    full_name: "",
    gender: "",
    date_of_birth: "",
    phone: "",
    email: "",
    avatar: "",
    department_id: "",
    department_name: "",
    work_status: "Đang công tác",
    account_status: "ACTIVE",
    password: "",
    confirm_password: "",
    created_at: "",
    updated_at: "",
  });

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setMessage("");

        const [teacherRes, departmentRes] = await Promise.all([
          fetch(`${API_URL}/teachers/${id}`),
          fetch(`${API_URL}/departments`),
        ]);

        const teacherData = await teacherRes.json();
        const departmentData = await departmentRes.json();

        if (!teacherRes.ok) {
          throw new Error(
            teacherData.message || "Không thể tải thông tin giáo viên"
          );
        }

        if (!departmentRes.ok) {
          throw new Error(
            departmentData.message || "Không thể tải danh sách khoa/bộ môn"
          );
        }

        if (isMounted) {
          const formattedTeacher = {
            id_teacher: teacherData.id_teacher || "",
            teacher_code: teacherData.teacher_code || "",
            full_name: teacherData.full_name || "",
            gender: teacherData.gender || "",
            date_of_birth: formatDateInput(teacherData.date_of_birth),
            phone: teacherData.phone || "",
            email: teacherData.email || "",
            avatar: teacherData.avatar || "",
            department_id: teacherData.department_id || "",
            department_name: teacherData.department_name || "",
            work_status: teacherData.work_status || "Đang công tác",
            account_status: teacherData.account_status || "ACTIVE",
            password: "",
            confirm_password: "",
            created_at: teacherData.created_at || "",
            updated_at: teacherData.updated_at || "",
          };

          setFormData(formattedTeacher);
          setAvatarPreview(teacherData.avatar || "");
          setDepartments(Array.isArray(departmentData) ? departmentData : []);
        }
      } catch (error) {
        console.error("Lỗi load dữ liệu:", error);

        if (isMounted) {
          setMessage(error.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const getAvatarSrc = () => {
    if (avatarPreview) return avatarPreview;

    return "https://ui-avatars.com/api/?name=Teacher&background=2563eb&color=ffffff";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const nextData = {
        ...prev,
        [name]: value,
      };

      if (name === "department_id") {
        const selectedDepartment = departments.find(
          (item) => String(item.id_department) === String(value)
        );

        nextData.department_name = selectedDepartment?.department_name || "";
      }

      return nextData;
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];

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

    if (formData.password && formData.password !== formData.confirm_password) {
      setMessage("Mật khẩu xác nhận không khớp");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = {
        teacher_code: formData.teacher_code,
        full_name: formData.full_name,
        gender: formData.gender || null,
        date_of_birth: formData.date_of_birth || null,
        phone: formData.phone,
        email: formData.email,
        avatar: formData.avatar || null,
        department_id: Number(formData.department_id),
        account_status: formData.account_status || "ACTIVE",
        password: formData.password || "",
      };

      const res = await fetch(`${API_URL}/teachers/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Cập nhật giáo viên thất bại");
      }

      alert("Cập nhật giáo viên thành công");
      navigate("/teachers");
    } catch (error) {
      console.error("Lỗi cập nhật giáo viên:", error);
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    window.location.reload();
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Bạn có chắc chắn muốn xóa giáo viên này không?"
    );

    if (!confirmDelete) return;

    try {
      setDeleting(true);

      const res = await fetch(`${API_URL}/teachers/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Xóa giáo viên thất bại");
      }

      alert("Xóa giáo viên thành công");
      navigate("/teachers");
    } catch (error) {
      console.error("Lỗi xóa giáo viên:", error);
      setMessage(error.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex">
        <Sidebar activePage="teachers" />

        <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
          <Header />

          <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
            <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm text-sm font-semibold text-gray-600">
              Đang tải thông tin giáo viên...
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex">
      <Sidebar activePage="teachers" />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 p-4 md:p-6">
          <div className="mb-8">
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
                Quản lý giáo viên
              </button>

              <span className="material-symbols-outlined text-[16px]">
                chevron_right
              </span>

              <span className="font-semibold text-gray-900">Chỉnh sửa</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Chỉnh sửa giáo viên
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Cập nhật thông tin giáo viên theo dữ liệu trong MySQL.
                </p>
              </div>

              <div className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">
                  update
                </span>
                Cập nhật lần cuối: {formatDateTime(formData.updated_at)}
              </div>
            </div>
          </div>

          {message && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <img
                      alt={formData.full_name || "Giáo viên"}
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow-sm"
                      src={getAvatarSrc()}
                    />

                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition border-2 border-white cursor-pointer">
                      <span className="material-symbols-outlined text-[20px]">
                        photo_camera
                      </span>

                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </label>

                    <div className="absolute -inset-2 border border-cyan-300/40 rounded-full animate-pulse pointer-events-none" />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 text-center">
                    {formData.full_name || "Chưa có tên"}
                  </h3>

                  <p className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mt-2">
                    {formData.teacher_code || "Chưa có mã"}
                  </p>

                  <div className="w-full mt-6 pt-6 border-t border-gray-200 space-y-4">
                    <InfoRow
                      label="Trạng thái"
                      value={formData.work_status || "Đang công tác"}
                    />

                    <InfoRow
                      label="Khoa"
                      value={formData.department_name || "Chưa chọn khoa"}
                    />

                    <InfoRow
                      label="Email"
                      value={formData.email || "Chưa có email"}
                    />

                    <InfoRow
                      label="Số điện thoại"
                      value={formData.phone || "Chưa có số điện thoại"}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600">
                    manage_accounts
                  </span>
                  Thông tin hệ thống
                </h4>

                <div className="space-y-3">
                  <InfoBox label="ID giáo viên" value={formData.teacher_code} />
                  <InfoBox
                    label="Ngày tạo"
                    value={formatDateTime(formData.created_at)}
                  />
                  <InfoBox
                    label="Ngày cập nhật"
                    value={formatDateTime(formData.updated_at)}
                  />
                  <InfoBox
                    label="Tài khoản"
                    value={formData.account_status}
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
                  Thông tin cá nhân
                </h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Mã giáo viên *"
                      name="teacher_code"
                      value={formData.teacher_code}
                      onChange={handleChange}
                       disabled={true}
                    />

                    <Input
                      label="Họ và tên *"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                    />

                    <Input
                      label="Ngày sinh"
                      name="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                    />

                    <Select
                      label="Giới tính"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      options={[
                        { value: "", label: "Chọn giới tính" },
                        { value: "Nam", label: "Nam" },
                        { value: "Nữ", label: "Nữ" },
                        { value: "Khác", label: "Khác" },
                      ]}
                    />

                    <Input
                      label="Email liên hệ *"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      icon="mail"
                    />

                    <Input
                      label="Số điện thoại *"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      icon="call"
                    />

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

                    <Input
                      label="Mật khẩu mới"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Bỏ trống nếu không đổi mật khẩu"
                    />

                    <Input
                      label="Xác nhận mật khẩu mới"
                      name="confirm_password"
                      type="password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      placeholder="Nhập lại mật khẩu mới"
                    />
                  </div>

                  <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    <div className="flex items-start gap-4">
                      <div className="bg-white p-3 rounded-xl shadow-sm">
                        <span className="material-symbols-outlined text-blue-600 text-[32px]">
                          face_retouching_natural
                        </span>
                      </div>

                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900">
                          Dữ liệu khuôn mặt AI
                        </h4>

                        <p className="text-sm text-gray-500 mt-1 mb-4">
                          Ảnh đại diện hiện tại được lưu trong trường avatar của
                          bảng Teacher. Nếu cần cập nhật ảnh, bấm biểu tượng máy
                          ảnh ở thẻ bên trái.
                        </p>

                        <div className="flex flex-wrap gap-3">
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 bg-white px-3 py-2 rounded-xl border border-blue-100">
                            <span className="material-symbols-outlined text-[16px]">
                              check_circle
                            </span>
                            {formData.avatar
                              ? "Đã có ảnh đại diện"
                              : "Chưa có ảnh đại diện"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => navigate("/teachers")}
                      className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100"
                    >
                      Hủy
                    </button>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Đặt lại
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-3 bg-blue-600 rounded-xl text-sm font-semibold text-white hover:bg-blue-700 shadow-sm flex items-center justify-center gap-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        save
                      </span>
                      {saving ? "Đang cập nhật..." : "Cập nhật giáo viên"}
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
                <h3 className="text-xl font-bold text-red-600 mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined">warning</span>
                  Vùng nguy hiểm
                </h3>

                <p className="text-sm text-gray-600 mb-4">
                  Xóa giáo viên sẽ xóa tài khoản đăng nhập liên quan đến giáo
                  viên này. Hãy kiểm tra kỹ trước khi thực hiện.
                </p>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 shadow-sm disabled:bg-red-300 disabled:cursor-not-allowed"
                >
                  {deleting ? "Đang xóa..." : "Xóa giáo viên"}
                </button>
              </div>
            </div>
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
  disabled = false,
  icon,
  placeholder = "",
  onChange,
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">
        {label}
      </label>

      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </span>
        )}

        <input
          name={name}
          type={type}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={onChange}
          className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 ${
            icon ? "pl-10" : ""
          } ${
            disabled
              ? "bg-gray-100 border border-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-gray-50 border border-gray-200 text-gray-900"
          }`}
        />
      </div>
    </div>
  );
}

function Select({ label, name, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">
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

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-sm text-gray-500">{label}</span>

      <span className="text-sm font-semibold text-gray-900 text-right break-all">
        {value || "Chưa có dữ liệu"}
      </span>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
      <p className="text-xs text-gray-500">{label}</p>

      <p className="text-sm font-semibold text-gray-900 mt-1 break-all">
        {value || "Chưa có dữ liệu"}
      </p>
    </div>
  );
}