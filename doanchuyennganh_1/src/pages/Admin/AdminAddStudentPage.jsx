import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/admin/Sidebar";
import Header from "../components/admin/Header";

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

export default function AdminAddStudentPage() {
  
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [accountActive, setAccountActive] = useState(true);

  const [formData, setFormData] = useState({
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
    username: "",
    password: "",
    confirm_password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "student_code") {
      setFormData((prev) => ({
        ...prev,
        student_code: value,
        username: value,
      }));
    }
  };

  const handleSubmit = async (e, goFaceRegister = false) => {
    e.preventDefault();

    if (!formData.student_code || !formData.full_name) {
      alert("Vui lòng nhập mã sinh viên và họ tên");
      return;
    }

    if (!formData.username || !formData.password) {
      alert("Vui lòng nhập tài khoản và mật khẩu");
      return;
    }

    if (formData.password !== formData.confirm_password) {
      alert("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:3060/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          account_status: accountActive ? "ACTIVE" : "LOCKED",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Thêm sinh viên thất bại");
        return;
      }

      alert("Thêm sinh viên thành công");

      if (goFaceRegister) {
        navigate(`/face-register/${data.id_student}`);
      } else {
        navigate("/students");
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex">
      <Sidebar activePage="students" />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 p-4 md:p-6 pb-32">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">

              <button
                onClick={() => navigate("/dashboard")}
                className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border-0 gap-2 transition"
              >
                <span className="hover:text-blue-600 transition font-medium">
                  Trang chủ
                </span>
              </button>

              <span className="material-symbols-outlined text-[16px]">
                chevron_right
              </span>

              <button
                onClick={() => navigate("/students")}
                className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border-0 gap-2 transition"
              >
                <span className="hover:text-blue-600 transition font-medium">
                  Học sinh - sinh viên
                </span>
              </button>

              <span className="material-symbols-outlined text-[16px]">
                chevron_right
              </span>

              <span className="font-semibold text-gray-900">
                Thêm học sinh - sinh viên
              </span>
            </div>

            <h2 className="text-3xl font-bold text-gray-900">
              Thêm học sinh - sinh viên
            </h2>
          </div>

          <form
            onSubmit={(e) => handleSubmit(e, false)}
            className="flex flex-col gap-6 max-w-7xl mx-auto"
          >
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 flex flex-col gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
                    Thông tin cá nhân
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Link ảnh đại diện"
                      name="avatar"
                      value={formData.avatar}
                      onChange={handleChange}
                      placeholder="VD: /uploads/students/avatar.jpg"
                    />

                    <Input
                      label="Mã sinh viên *"
                      name="student_code"
                      value={formData.student_code}
                      onChange={handleChange}
                      placeholder="Nhập mã sinh viên"
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
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="example@student.edu.vn"
                    />

                    <Input
                      label="Số điện thoại"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
                    Thông tin học tập
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Khoa *"
                      name="faculty"
                      value={formData.faculty}
                      onChange={handleChange}
                      placeholder="VD: CNTT"
                    />

                    <Input
                      label="Lớp *"
                      name="class_name"
                      value={formData.class_name}
                      onChange={handleChange}
                      placeholder="VD: D20CQCN01"
                    />

                    <Input
                      label="Khóa học"
                      name="course_year"
                      value={formData.course_year}
                      onChange={handleChange}
                      placeholder="VD: K65"
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
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
                    Thông tin tài khoản
                  </h3>

                  <div className="flex flex-col gap-4">
                    <Input
                      label="Tên đăng nhập *"
                      name="username"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Thường là mã sinh viên"
                    />

                    <Input
                      label="Mật khẩu *"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                    />

                    <Input
                      label="Xác nhận mật khẩu *"
                      name="confirm_password"
                      type="password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      placeholder="••••••••"
                    />

                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <span className="text-sm font-semibold text-gray-900 block">
                          Trạng thái tài khoản
                        </span>
                        <span className="text-sm text-gray-500">
                          Kích hoạt để cho phép đăng nhập
                        </span>
                      </div>

                      <Toggle
                        checked={accountActive}
                        onChange={(e) => setAccountActive(e.target.checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 relative overflow-hidden">
                  <div className="relative z-10 flex items-center justify-between mb-6 border-b border-gray-200 pb-3">
                    <h3 className="text-xl font-bold text-gray-900">
                      Dữ liệu khuôn mặt
                    </h3>

                    <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                      AI Ready
                    </span>
                  </div>

                  <div className="relative z-10 flex flex-col items-center justify-center py-10 border-2 border-dashed border-cyan-300 rounded-2xl bg-blue-50/40 mb-4">
                    <span className="material-symbols-outlined text-5xl text-cyan-400 mb-3">
                      face_retouching_natural
                    </span>

                    <p className="text-sm text-center text-gray-500 px-4">
                      Sau khi lưu sinh viên, hệ thống có thể chuyển sang đăng ký
                      dữ liệu khuôn mặt.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    className="relative z-10 w-full bg-gray-900 text-white text-sm font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">
                      camera_alt
                    </span>
                    Lưu và đăng ký khuôn mặt
                  </button>
                  
                </div>
              </div>
            </div>

            <div className="fixed bottom-0 right-0 w-full md:w-[calc(100%-280px)] bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 flex flex-col sm:flex-row justify-end items-center gap-3 shadow-lg z-40">
              <button
                type="button"
                onClick={() => navigate("/students")}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:border-blue-600 hover:text-blue-600 transition"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-50 text-blue-600 text-sm font-semibold hover:bg-blue-100 transition flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">face</span>
                Lưu và tiếp tục đăng ký khuôn mặt
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition shadow-sm disabled:opacity-60"
              >
                {loading ? "Đang lưu..." : "Lưu sinh viên"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

function Input({ label, name, type = "text", placeholder = "", value, onChange }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-700 mb-1 block">
        {label}
      </label>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
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
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}