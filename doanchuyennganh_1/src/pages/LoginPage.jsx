import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginAccount } from "../api/authApi";

const ROLE_OPTIONS = [
  {
    value: "ADMIN",
    label: "Quản trị viên",
    icon: "admin_panel_settings",
    description: "Quản lý toàn bộ hệ thống",
  },
  {
    value: "TEACHER",
    label: "Giảng viên",
    icon: "school",
    description: "Quản lý lớp học và điểm danh",
  },
  {
    value: "STUDENT",
    label: "Sinh viên",
    icon: "person",
    description: "Theo dõi lịch học và điểm danh",
  },
];

function getRedirectPath(role) {
  const normalizedRole = String(role || "").toUpperCase();

  if (normalizedRole === "ADMIN") return "/dashboard";
  if (normalizedRole === "TEACHER") return "/teacher/dashboard";
  if (normalizedRole === "STUDENT") return "/student/dashboard";

  return "/login";
}

function getFriendlyErrorMessage(error) {
  const message = String(error?.message || "").trim();

  if (!message) {
    return "Đăng nhập thất bại. Vui lòng thử lại.";
  }

  if (message.includes("Failed to fetch")) {
    return "Không kết nối được backend. Hãy kiểm tra server Node.js đã chạy ở port 3060 chưa.";
  }

  if (message.includes("Backend không trả về JSON")) {
    return "Backend không trả về JSON. Có thể sai API /api/auth/login hoặc server đang trả HTML.";
  }

  if (
    message.includes("Tài khoản không tồn tại") ||
    message.includes("vai trò") ||
    message.includes("Tài khoản hoặc vai trò không đúng")
  ) {
    return "Tài khoản không tồn tại hoặc bạn chọn sai vai trò đăng nhập.";
  }

  if (message.includes("Mật khẩu không đúng")) {
    return "Mật khẩu không đúng. Vui lòng kiểm tra lại.";
  }

  if (message.includes("Tài khoản đã bị khóa")) {
    return "Tài khoản này đã bị khóa. Vui lòng liên hệ quản trị viên.";
  }

  if (message.includes("teacher_id")) {
    return "Tài khoản giáo viên chưa liên kết với giáo viên. Hãy kiểm tra cột teacher_id trong bảng Account.";
  }

  if (message.includes("student_id")) {
    return "Tài khoản sinh viên chưa liên kết với sinh viên. Hãy kiểm tra cột student_id trong bảng Account.";
  }

  return message;
}

function saveLoginData(user, remember) {
  const role = String(user?.role || "").toUpperCase();

  const teacherId = user?.teacher_id || user?.id_teacher || null;
  const studentId = user?.student_id || user?.id_student || null;

  const accountData = {
    ...user,
    role,
    teacher_id: teacherId,
    student_id: studentId,
  };

  // Keep legacy key for routes/components that still read "user".
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("account", JSON.stringify(accountData));
  localStorage.setItem("role", role);

  if (teacherId) {
    localStorage.setItem("teacherId", String(teacherId));
  } else {
    localStorage.removeItem("teacherId");
  }

  if (studentId) {
    localStorage.setItem("studentId", String(studentId));
  } else {
    localStorage.removeItem("studentId");
  }

  if (remember) {
    localStorage.setItem("rememberedUsername", user?.username || "");
    localStorage.setItem("rememberedRole", role);
  } else {
    localStorage.removeItem("rememberedUsername");
    localStorage.removeItem("rememberedRole");
  }
}

function clearOldLoginData() {
  localStorage.removeItem("user");
  localStorage.removeItem("account");
  localStorage.removeItem("role");
  localStorage.removeItem("teacherId");
  localStorage.removeItem("studentId");
}

export default function LoginPage() {
  const navigate = useNavigate();

  const rememberedUsername = localStorage.getItem("rememberedUsername") || "";
  const rememberedRole = localStorage.getItem("rememberedRole") || "TEACHER";

  const [form, setForm] = useState({
    username: rememberedUsername,
    password: "",
    role: rememberedRole,
  });

  const [remember, setRemember] = useState(Boolean(rememberedUsername));
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [loading, setLoading] = useState(false);

  const selectedRole = useMemo(() => {
    return ROLE_OPTIONS.find((item) => item.value === form.role);
  }, [form.role]);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (message) {
      setMessage("");
    }
  };

  const fillDemoAdmin = () => {
    setForm({
      username: "admin",
      password: "admin123",
      role: "ADMIN",
    });

    setMessage("");
  };

  const fillDemoTeacher = () => {
    setForm({
      username: "kietlt@vku.udn.vn",
      password: "12345678",
      role: "TEACHER",
    });

    setMessage("");
  };

  const fillDemoStudent = () => {
    setForm({
      username: "hoangnq.23it@vku.udn.vn",
      password: "123456",
      role: "STUDENT",
    });

    setMessage("");
  };

  const validateForm = () => {
    const username = form.username.trim();
    const password = form.password.trim();
    const role = String(form.role || "").toUpperCase();

    if (!role) {
      return "Vui lòng chọn vai trò đăng nhập.";
    }

    if (!username) {
      return "Vui lòng nhập tài khoản.";
    }

    if (!password) {
      return "Vui lòng nhập mật khẩu.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validateMessage = validateForm();

    if (validateMessage) {
      setMessageType("error");
      setMessage(validateMessage);
      return;
    }

    const username = form.username.trim();
    const password = form.password.trim();
    const role = String(form.role || "").toUpperCase();

    try {
      setLoading(true);
      setMessage("");

      clearOldLoginData();

      const data = await loginAccount({
        username,
        password,
        role,
      });

      const user = data?.user;

      if (!user) {
        throw new Error("Backend chưa trả về thông tin người dùng.");
      }

      if (!user.role) {
        throw new Error("Backend chưa trả về vai trò tài khoản.");
      }

      const userRole = String(user.role).toUpperCase();

      if (userRole !== role) {
        throw new Error(
          "Vai trò trả về từ backend không khớp với vai trò đã chọn."
        );
      }

      if (userRole === "TEACHER" && !user.teacher_id && !user.id_teacher) {
        throw new Error(
          "Tài khoản giáo viên chưa có teacher_id. Hãy kiểm tra bảng Account hoặc API đăng nhập."
        );
      }

      if (userRole === "STUDENT" && !user.student_id && !user.id_student) {
        throw new Error(
          "Tài khoản sinh viên chưa có student_id. Hãy kiểm tra bảng Account hoặc API đăng nhập."
        );
      }

      saveLoginData(user, remember);

      setMessageType("success");
      setMessage("Đăng nhập thành công. Đang chuyển trang...");

      navigate(getRedirectPath(userRole), {
        replace: true,
      });
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);

      clearOldLoginData();

      setMessageType("error");
      setMessage(getFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 px-4 py-8 font-sans text-slate-900">
      <div className="absolute left-[-10%] top-[-20%] h-[520px] w-[520px] rounded-full bg-blue-500/10 blur-[110px]" />
      <div className="absolute bottom-[-25%] right-[-10%] h-[720px] w-[720px] rounded-full bg-indigo-400/10 blur-[130px]" />
      <div className="absolute right-[12%] top-[18%] h-[260px] w-[260px] rounded-full bg-sky-400/10 blur-[90px]" />

      <main className="relative z-10 grid min-h-[680px] w-full max-w-[1180px] overflow-hidden rounded-[32px] border border-white/70 bg-white/85 shadow-2xl shadow-blue-500/10 backdrop-blur-xl lg:grid-cols-2">
        <section className="relative hidden overflow-hidden border-r border-slate-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.14),transparent_35%)]" />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/25">
                <span className="material-symbols-outlined text-[28px]">
                  face
                </span>
              </div>

              <div>
                <h1 className="bg-gradient-to-r from-blue-700 to-sky-500 bg-clip-text text-2xl font-extrabold text-transparent">
                  Face Attendance
                </h1>
                <p className="text-sm font-semibold text-slate-500">
                  AI Attendance Management System
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-1 items-center justify-center py-10">
            <div className="relative w-full max-w-[390px]">
              <div className="absolute -left-6 -top-6 h-28 w-28 rounded-3xl bg-blue-500/10 blur-2xl" />
              <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-3xl bg-sky-500/10 blur-2xl" />

              <div className="relative overflow-hidden rounded-[32px] border border-white bg-white shadow-2xl shadow-blue-500/10">
                <div className="bg-gradient-to-r from-blue-600 to-sky-500 p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-100">Realtime AI</p>
                      <h2 className="mt-1 text-xl font-bold">
                        Nhận diện khuôn mặt
                      </h2>
                    </div>

                    <span className="material-symbols-outlined text-[42px]">
                      center_focus_strong
                    </span>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <span className="material-symbols-outlined">
                          verified
                        </span>
                      </div>

                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Điểm danh tự động
                        </p>
                        <p className="text-xs text-slate-500">
                          Theo dõi có mặt, vắng, đi trễ
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <span className="material-symbols-outlined">
                          dashboard
                        </span>
                      </div>

                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Dashboard quản trị
                        </p>
                        <p className="text-xs text-slate-500">
                          Thống kê lớp học, giáo viên, sinh viên
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                        <span className="material-symbols-outlined">
                          manage_accounts
                        </span>
                      </div>

                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Phân quyền tài khoản
                        </p>
                        <p className="text-xs text-slate-500">
                          Admin, giảng viên và sinh viên
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Hệ thống điểm danh khuôn mặt AI
            </h2>

            <p className="mt-3 max-w-md text-base leading-relaxed text-slate-500">
              Đăng nhập để quản lý lớp học, lịch dạy, điểm danh, nhận diện và
              thống kê chuyên cần theo thời gian thực.
            </p>
          </div>
        </section>

        <section className="flex flex-col justify-center bg-white p-6 sm:p-10 lg:p-14">
          <div className="mb-9 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 text-white">
                <span className="material-symbols-outlined">face</span>
              </div>

              <div>
                <h1 className="text-2xl font-extrabold text-blue-700">
                  Face Attendance
                </h1>
                <p className="text-sm font-semibold text-slate-500">
                  AI Attendance System
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">
              <span className="material-symbols-outlined text-[16px]">
                lock
              </span>
              Đăng nhập hệ thống
            </div>

            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Chào mừng trở lại
            </h2>

            <p className="mt-3 text-base leading-relaxed text-slate-500">
              Vui lòng đăng nhập bằng tài khoản đã được cấp để truy cập đúng
              giao diện theo vai trò.
            </p>
          </div>

          {message && (
            <div
              className={`mb-5 flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                messageType === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {messageType === "success" ? "check_circle" : "error"}
              </span>
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="role"
                className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500"
              >
                Vai trò đăng nhập
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {ROLE_OPTIONS.map((role) => {
                  const active = form.role === role.value;

                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => updateField("role", role.value)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-blue-300 bg-blue-50 shadow-sm"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${
                          active
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <span className="material-symbols-outlined">
                          {role.icon}
                        </span>
                      </div>

                      <p
                        className={`text-sm font-bold ${
                          active ? "text-blue-700" : "text-slate-800"
                        }`}
                      >
                        {role.label}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {role.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500"
              >
                Tài khoản
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <span className="material-symbols-outlined">person</span>
                </div>

                <input
                  id="username"
                  type="text"
                  value={form.username}
                  onChange={(event) =>
                    updateField("username", event.target.value)
                  }
                  placeholder={
                    selectedRole?.value === "ADMIN"
                      ? "admin"
                      : selectedRole?.value === "TEACHER"
                      ? "Email, mã giáo viên hoặc username"
                      : "Email, mã sinh viên hoặc username"
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500"
              >
                Mật khẩu
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <span className="material-symbols-outlined">lock</span>
                </div>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) =>
                    updateField("password", event.target.value)
                  }
                  placeholder="Nhập mật khẩu"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-blue-600"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-500">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                />
                Ghi nhớ tài khoản
              </label>

              <button
                type="button"
                onClick={() => {
                  setMessageType("error");
                  setMessage(
                    "Chức năng quên mật khẩu chưa được cấu hình. Vui lòng liên hệ quản trị viên."
                  );
                }}
                className="text-left text-sm font-bold text-blue-600 hover:text-blue-700"
              >
                Quên mật khẩu?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-5 py-4 text-sm font-extrabold uppercase tracking-widest text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  Đăng nhập
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-bold text-slate-700">
              Tài khoản demo nhanh
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                Demo admin
              </button>

              <button
                type="button"
                onClick={fillDemoTeacher}
                className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
              >
                Demo giảng viên
              </button>

              <button
                type="button"
                onClick={fillDemoStudent}
                className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
              >
                Demo sinh viên
              </button>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Admin: admin / admin123. Giảng viên:
              kietlt@vku.udn.vn / 123456. Sinh viên: hoangnq.23it@vku.udn.vn / 123456.
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              Cần hỗ trợ tài khoản?{" "}
              <span className="font-bold text-blue-600">
                Liên hệ quản trị viên hệ thống
              </span>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}