import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/student/Sidebar";
import Header from "../components/student/Header";
import StudentChangePasswordPanel from "./StudentChangePasswordPanel";

import {
  getMyStudentProfile,
  updateMyStudentProfile,
} from "../../api/studentApi";

const BACKEND_URL = "http://localhost:3060";

function resolveImageUrl(path) {
  if (!path) return "";
  const value = String(path);

  if (value.startsWith("data:image")) return value;
  if (value.startsWith("http")) return value;
  if (value.startsWith("/")) return `${BACKEND_URL}${value}`;

  return `${BACKEND_URL}/${value}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";

  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatDateInput(dateStr) {
  if (!dateStr) return "";

  try {
    return new Date(dateStr).toISOString().slice(0, 10);
  } catch {
    return String(dateStr).slice(0, 10);
  }
}

function formatGender(gender) {
  if (!gender) return "—";
  if (gender === "Male") return "Nam";
  if (gender === "Female") return "Nữ";
  if (gender === "Other") return "Khác";

  return gender;
}

function getStudentId() {
  try {
    const account = JSON.parse(localStorage.getItem("account") || "{}");
    const student = JSON.parse(localStorage.getItem("student") || "{}");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return (
      account?.student_id ||
      account?.id_student ||
      student?.id_student ||
      user?.student_id ||
      user?.id_student ||
      localStorage.getItem("studentId") ||
      null
    );
  } catch {
    return localStorage.getItem("studentId") || null;
  }
}

function getAvatarSource(profile) {
  return (
    resolveImageUrl(profile?.avatar) ||
    resolveImageUrl(profile?.student_avatar) ||
    resolveImageUrl(profile?.face_image) ||
    ""
  );
}

function getInitials(name) {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

function InfoField({ label, value, subValue, icon }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-200 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-900 dark:hover:bg-slate-900">
      <p className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <div className="flex items-start gap-3">
        {icon && (
          <span className="material-symbols-outlined mt-0.5 text-[22px] text-blue-600 dark:text-blue-400">
            {icon}
          </span>
        )}

        <div className="min-w-0">
          <p className="break-words text-sm font-bold text-slate-800 dark:text-slate-100">
            {value || "—"}
          </p>

          {subValue && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {subValue}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, icon, children, action }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
            <span className="material-symbols-outlined text-[24px]">
              {icon}
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {title}
          </h3>
        </div>

        {action}
      </div>

      <div className="p-6">{children}</div>
    </div>
  );
}

function StatusBadge({ active }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
        <span className="material-symbols-outlined text-[16px]">
          check_circle
        </span>
        Đã đăng ký
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
      <span className="material-symbols-outlined text-[16px]">warning</span>
      Chưa đăng ký
    </span>
  );
}

function FormInput({ label, value, onChange, icon, type = "text" }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </label>

      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">
            {icon}
          </span>
        )}

        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-2xl border border-slate-200 bg-white py-3 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-950 ${
            icon ? "pl-12" : "pl-4"
          }`}
        />
      </div>
    </div>
  );
}

function FormSelect({ label, value, onChange, icon }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </label>

      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">
            {icon}
          </span>
        )}

        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-2xl border border-slate-200 bg-white py-3 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-950 ${
            icon ? "pl-12" : "pl-4"
          }`}
        >
          <option value="">Chọn giới tính</option>
          <option value="Male">Nam</option>
          <option value="Female">Nữ</option>
          <option value="Other">Khác</option>
        </select>
      </div>
    </div>
  );
}

function ProfileSummaryCard({ profile }) {
  const hasFace = Boolean(profile?.id_face || profile?.face_image);
  const avatarSrc = getAvatarSource(profile);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="relative h-[160px] bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500">
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="relative -mt-[70px] flex flex-col items-center px-6 pb-6 text-center">
        <div className="relative mb-5">
          <div className="flex h-[130px] w-[130px] items-center justify-center overflow-hidden rounded-full border-[6px] border-white bg-blue-50 text-3xl font-bold text-blue-700 shadow-xl dark:border-slate-900 dark:bg-blue-950 dark:text-blue-300">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={profile?.full_name || "Student profile"}
                className="h-full w-full object-cover"
              />
            ) : (
              getInitials(profile?.full_name)
            )}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          {profile?.full_name || "—"}
        </h2>

        <p className="mb-5 mt-1 text-sm font-bold tracking-[0.18em] text-blue-700 dark:text-blue-300">
          MSSV: {profile?.student_code || "—"}
        </p>

        <div className="mb-6 flex flex-wrap justify-center gap-3">
          <span className="rounded-full bg-blue-50 px-4 py-1.5 text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {profile?.faculty || "—"}
          </span>

          <span className="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {profile?.class_name || "—"}
          </span>
        </div>

        <div className="mb-3 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-slate-500 dark:text-slate-400">
              person
            </span>

            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Tài khoản
            </span>
          </div>

          <span className="max-w-[170px] truncate text-sm font-bold text-slate-800 dark:text-slate-100">
            {profile?.username || "—"}
          </span>
        </div>

        <div className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">
              face
            </span>

            <span className="font-bold text-slate-700 dark:text-slate-200">
              Face ID
            </span>
          </div>

          <StatusBadge active={hasFace} />
        </div>
      </div>
    </div>
  );
}

function EditProfilePanel({
  form,
  saving,
  onChange,
  onCancel,
  onSubmit,
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Chỉnh sửa thông tin cá nhân
          </h3>

          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Chỉ cho phép cập nhật họ tên, số điện thoại, ngày sinh và giới tính.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
          Đóng
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormInput
          label="Họ và tên"
          value={form.full_name}
          onChange={(value) => onChange("full_name", value)}
          icon="badge"
        />

        <FormInput
          label="Số điện thoại"
          value={form.phone}
          onChange={(value) => onChange("phone", value)}
          icon="smartphone"
        />

        <FormInput
          label="Ngày sinh"
          type="date"
          value={form.date_of_birth}
          onChange={(value) => onChange("date_of_birth", value)}
          icon="cake"
        />

        <FormSelect
          label="Giới tính"
          value={form.gender}
          onChange={(value) => onChange("gender", value)}
          icon="wc"
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
          Hủy
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[20px]">save</span>
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </div>
  );
}

export default function StudentProfile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [mode, setMode] = useState("view");
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    date_of_birth: "",
    gender: "",
  });

  const fetchProfile = useCallback(async (sid) => {
    await Promise.resolve();

    if (!sid) {
      setProfile(null);
      setMessage(
        "Chưa có studentId. Vui lòng đăng nhập bằng tài khoản sinh viên."
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await getMyStudentProfile(sid);
      const data = res?.success ? res.data || {} : res || {};

      setProfile(data);
      setEditForm({
        full_name: data.full_name || "",
        phone: data.phone || "",
        date_of_birth: formatDateInput(data.date_of_birth),
        gender: data.gender || "",
      });
    } catch (error) {
      console.error("Lỗi tải thông tin cá nhân sinh viên:", error);
      setMessage(error.message || "Không thể tải thông tin cá nhân.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initProfile = async () => {
      await Promise.resolve();

      const sid = getStudentId();

      if (!isMounted) return;

      if (!sid) {
        setMessage(
          "Chưa có studentId. Vui lòng đăng nhập bằng tài khoản sinh viên."
        );
        setLoading(false);
        return;
      }

      setStudentId(sid);
      fetchProfile(sid);
    };

    initProfile();

    return () => {
      isMounted = false;
    };
  }, [fetchProfile]);

  const personalInfo = useMemo(
    () => [
      {
        label: "Họ và tên đầy đủ",
        value: profile?.full_name,
        icon: "badge",
      },
      {
        label: "Ngày sinh",
        value: formatDate(profile?.date_of_birth),
        icon: "cake",
      },
      {
        label: "Giới tính",
        value: formatGender(profile?.gender),
        icon: "wc",
      },
      {
        label: "Email",
        value: profile?.email,
        icon: "mail",
      },
      {
        label: "Số điện thoại",
        value: profile?.phone,
        icon: "smartphone",
      },
      {
        label: "Khoa",
        value: profile?.faculty,
        icon: "school",
      },
      {
        label: "Lớp",
        value: profile?.class_name,
        icon: "groups",
      },
      {
        label: "Khóa học",
        value: profile?.course_year,
        icon: "calendar_month",
      },
      {
        label: "Trạng thái sinh viên",
        value:
          profile?.student_status === "ACTIVE" || profile?.status === "ACTIVE"
            ? "Đang học"
            : profile?.student_status || profile?.status || "—",
        icon: "verified",
      },
      {
        label: "Ngày tạo hồ sơ",
        value: formatDate(profile?.created_at),
        icon: "event_available",
      },
    ],
    [profile]
  );

  const updateEditField = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const openEditMode = () => {
    setSuccessMessage("");
    setMessage("");
    setEditForm({
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
      date_of_birth: formatDateInput(profile?.date_of_birth),
      gender: profile?.gender || "",
    });
    setMode("edit");
  };

  const handleUpdateProfile = async () => {
    if (!studentId) {
      setMessage("Không tìm thấy studentId. Vui lòng đăng nhập lại.");
      return;
    }

    if (!editForm.full_name.trim()) {
      setMessage("Vui lòng nhập họ tên.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setSuccessMessage("");

      await updateMyStudentProfile(studentId, {
        full_name: editForm.full_name.trim(),
        phone: editForm.phone.trim(),
        date_of_birth: editForm.date_of_birth || null,
        gender: editForm.gender || null,
      });

      setSuccessMessage("Cập nhật thông tin cá nhân thành công.");
      setMode("view");
      await fetchProfile(studentId);
    } catch (error) {
      console.error("Lỗi cập nhật thông tin sinh viên:", error);
      setMessage(error.message || "Không thể cập nhật thông tin cá nhân.");
    } finally {
      setSaving(false);
    }
  };

  const openPasswordMode = () => {
    setSuccessMessage("");
    setMessage("");
    setMode("password");
  };

  const handlePasswordSuccess = (text) => {
    setSuccessMessage(text || "Đổi mật khẩu thành công.");
    setMode("view");
  };

  const handlePanelError = (text) => {
    setSuccessMessage("");
    setMessage(text || "");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
        <Sidebar activePage="profile" />

        <div className="flex min-h-screen flex-1 flex-col md:ml-[280px]">
          <Header student={profile || {}} />

          <main className="flex-1 p-4 md:p-6">
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Đang tải thông tin cá nhân sinh viên...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar activePage="profile" />

      <div className="flex min-h-screen flex-1 flex-col md:ml-[280px]">
        <Header student={profile || {}} />

        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 text-white shadow-lg shadow-blue-100 dark:shadow-none">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm text-blue-100">
                  <span className="material-symbols-outlined text-[18px]">
                    account_circle
                  </span>
                  Hồ sơ sinh viên
                </div>

                <h2 className="text-3xl font-bold tracking-tight">
                  Thông tin cá nhân
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-blue-100">
                  Quản lý hồ sơ học tập, tài khoản, mật khẩu và dữ liệu nhận
                  diện khuôn mặt của sinh viên.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/student/dashboard")}
                  className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/25"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    dashboard
                  </span>
                  Trang chủ
                </button>

                <button
                  type="button"
                  onClick={openEditMode}
                  className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/25"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    edit
                  </span>
                  Chỉnh sửa
                </button>

                <button
                  type="button"
                  onClick={openPasswordMode}
                  className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    key
                  </span>
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          </div>

          {message && (
            <div className="mb-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              <span className="material-symbols-outlined text-[20px]">
                error
              </span>
              <span>{message}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              <span className="material-symbols-outlined text-[20px]">
                check_circle
              </span>
              <span>{successMessage}</span>
            </div>
          )}

          <div className="mx-auto max-w-[1500px]">
            {mode === "edit" && (
              <div className="mb-6">
                <EditProfilePanel
                  form={editForm}
                  saving={saving}
                  onChange={updateEditField}
                  onCancel={() => setMode("view")}
                  onSubmit={handleUpdateProfile}
                />
              </div>
            )}

            {mode === "password" && (
              <div className="mb-6">
                <StudentChangePasswordPanel
                  studentId={studentId}
                  onCancel={() => setMode("view")}
                  onSuccess={handlePasswordSuccess}
                  onError={handlePanelError}
                />
              </div>
            )}

            <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
                  Hồ sơ của tôi
                </h1>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Xem thông tin cá nhân, trạng thái tài khoản và dữ liệu nhận
                  diện khuôn mặt.
                </p>
              </div>

              <button
                type="button"
                onClick={() => studentId && fetchProfile(studentId)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <span className="material-symbols-outlined text-[20px]">
                  refresh
                </span>
                Tải lại
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div className="xl:col-span-4">
                <ProfileSummaryCard profile={profile} />
              </div>

              <div className="flex flex-col gap-6 xl:col-span-8">
                <SectionCard
                  title="Thông tin cá nhân"
                  icon="badge"
                  action={
                    <button
                      type="button"
                      onClick={openEditMode}
                      className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        edit
                      </span>
                      Sửa
                    </button>
                  }
                >
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {personalInfo.map((item) => (
                      <InfoField
                        key={item.label}
                        label={item.label}
                        value={item.value}
                        subValue={item.subValue}
                        icon={item.icon}
                      />
                    ))}
                  </div>
                </SectionCard>

                <SectionCard
                  title="Bảo mật tài khoản"
                  icon="security"
                  action={
                    <button
                      type="button"
                      onClick={openPasswordMode}
                      className="inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        key
                      </span>
                      Đổi mật khẩu
                    </button>
                  }
                >
                  <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                    <div>
                      <p className="mb-1 text-lg font-bold text-slate-800 dark:text-slate-100">
                        Mật khẩu &amp; xác thực
                      </p>

                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Trạng thái tài khoản:{" "}
                        <span
                          className={
                            profile?.account_status === "ACTIVE"
                              ? "font-bold text-emerald-600 dark:text-emerald-300"
                              : "font-bold text-red-600 dark:text-red-300"
                          }
                        >
                          {profile?.account_status === "ACTIVE"
                            ? "Hoạt động"
                            : profile?.account_status || "—"}
                        </span>
                      </p>
                    </div>

                    <div className="flex w-fit items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
                      <span className="material-symbols-outlined text-[20px]">
                        verified_user
                      </span>
                      Protected
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}