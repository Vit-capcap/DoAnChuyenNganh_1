import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/teacher/Sidebar";
import Header from "../components/teacher/Header";
import TeacherChangePasswordPanel from "./TeacherChangePasswordPanel";

import {
  getTeacherDashboard,
  getTeacherProfile,
  updateTeacherProfile,
} from "../../api/teacherApi";

function getTeacherId() {
  try {
    const account = JSON.parse(localStorage.getItem("account") || "{}");
    const teacher = JSON.parse(localStorage.getItem("teacher") || "{}");

    return (
      account?.teacher_id ||
      account?.id_teacher ||
      account?.teacherId ||
      teacher?.id_teacher ||
      teacher?.teacher_id ||
      localStorage.getItem("teacherId") ||
      null
    );
  } catch {
    return localStorage.getItem("teacherId") || null;
  }
}

function getTeacherInfo() {
  try {
    const account = JSON.parse(localStorage.getItem("account") || "{}");
    const teacher = JSON.parse(localStorage.getItem("teacher") || "{}");

    return {
      ...account,
      ...teacher,
      full_name:
        teacher?.full_name ||
        account?.teacher_name ||
        account?.full_name ||
        "Giảng viên",
      email: teacher?.email || account?.teacher_email || account?.email || "",
      avatar: teacher?.avatar || account?.teacher_avatar || account?.avatar || "",
    };
  } catch {
    return {
      full_name: "Giảng viên",
      email: "",
      avatar: "",
    };
  }
}

function normalizeGender(gender) {
  if (gender === "Male") return "Nam";
  if (gender === "Female") return "Nữ";
  if (gender === "Other") return "Khác";

  return gender || "";
}

function genderToApi(gender) {
  if (gender === "Nam") return "Male";
  if (gender === "Nữ") return "Female";
  if (gender === "Khác") return "Other";

  return gender || null;
}

function toDateInput(value) {
  if (!value) return "";

  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function normalizeProfile(data = {}) {
  const raw =
    data?.teacher ||
    data?.profile ||
    data?.data?.teacher ||
    data?.data ||
    data ||
    {};

  return {
    id_teacher: raw.id_teacher || raw.idTeacher || raw.teacher_id || "",
    teacher_code: raw.teacher_code || raw.teacherCode || "N/A",
    full_name: raw.full_name || raw.teacher_name || raw.fullName || "",
    gender: normalizeGender(raw.gender),
    date_of_birth: toDateInput(raw.date_of_birth || raw.dateOfBirth),
    phone: raw.phone || "",
    email: raw.email || raw.teacher_email || "",
    avatar: raw.avatar || raw.teacher_avatar || "",
    department_id: raw.department_id || raw.departmentId || "",
    department_name:
      raw.department_name || raw.departmentName || "Chưa có khoa",
    account_status: raw.account_status || raw.status || "ACTIVE",
    work_status:
      raw.work_status ||
      (raw.account_status === "LOCKED" ? "Đã khóa" : "Đang công tác"),
    position: raw.position || raw.title || "Giảng viên",
    office: raw.office || raw.address || raw.work_address || "",
    personal_email: raw.personal_email || raw.personalEmail || "",
  };
}

function normalizeStats(data = {}) {
  const stats = data?.stats || data?.data?.stats || data || {};

  return {
    totalClasses: Number(stats.totalClasses || stats.total_classes || 0),
    totalSubjects: Number(stats.totalSubjects || stats.total_subjects || 0),
    completedToday: Number(stats.completedToday || stats.completed_today || 0),
    totalAttendance: Number(
      stats.totalAttendance ||
        stats.total_attendance ||
        stats.completedSessions ||
        0
    ),
  };
}

function getInitials(name = "?") {
  return String(name)
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

function saveTeacherToLocalStorage(profile) {
  const current = JSON.parse(localStorage.getItem("teacher") || "{}");

  const nextTeacher = {
    ...current,
    id_teacher: profile.id_teacher,
    teacher_code: profile.teacher_code,
    full_name: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    avatar: profile.avatar,
    gender: genderToApi(profile.gender),
    date_of_birth: profile.date_of_birth,
    department_id: profile.department_id,
    department_name: profile.department_name,
  };

  localStorage.setItem("teacher", JSON.stringify(nextTeacher));
}

function ProfileHero({ profile, stats, isEditing, onAvatarChange }) {
  const avatar = profile.avatar;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 p-6 text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-white/10" />

        <div className="relative flex flex-col items-center text-center">
          <div className="relative">
            {avatar ? (
              <img
                src={avatar}
                alt={profile.full_name}
                className="h-32 w-32 rounded-3xl border-4 border-white/80 object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-3xl border-4 border-white/80 bg-white/20 text-4xl font-black text-white shadow-lg">
                {getInitials(profile.full_name)}
              </div>
            )}

            {isEditing && (
              <label className="absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl border-2 border-white bg-white text-blue-700 shadow-md transition hover:bg-blue-50">
                <span className="material-symbols-outlined text-[20px]">
                  photo_camera
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onAvatarChange}
                />
              </label>
            )}
          </div>

          <h2 className="mt-5 text-2xl font-black tracking-tight">
            {profile.full_name || "Giảng viên"}
          </h2>

          <p className="mt-1 text-sm font-semibold text-blue-100">
            {profile.position || "Giảng viên"}
          </p>

          <div className="mt-5 grid w-full grid-cols-1 gap-3">
            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-100">
                Mã giáo viên
              </p>
              <p className="mt-1 font-bold">{profile.teacher_code}</p>
            </div>

            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-100">
                Khoa/Bộ môn
              </p>
              <p className="mt-1 font-bold">{profile.department_name}</p>
            </div>

            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-100">
                Trạng thái
              </p>
              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                  profile.account_status === "LOCKED"
                    ? "bg-red-100 text-red-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {profile.account_status === "LOCKED"
                  ? "Đã khóa"
                  : "Đang hoạt động"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center">
          <span className="material-symbols-outlined text-[30px] text-blue-600">
            class
          </span>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {stats.totalClasses}
          </p>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Lớp đang dạy
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center">
          <span className="material-symbols-outlined text-[30px] text-indigo-600">
            menu_book
          </span>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {stats.totalSubjects}
          </p>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Môn phụ trách
          </p>
        </div>

        <div className="col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center">
          <span className="material-symbols-outlined text-[30px] text-emerald-600">
            verified
          </span>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {stats.totalAttendance}
          </p>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Bản ghi điểm danh
          </p>
        </div>
      </div>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  icon,
  disabled = false,
  readOnly = false,
  placeholder = "",
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
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
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder}
          className={`w-full rounded-2xl border px-4 py-3 text-sm font-semibold outline-none transition ${
            icon ? "pl-12" : ""
          } ${
            disabled || readOnly
              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
              : "border-slate-200 bg-white text-slate-800 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          }`}
        />

        {(disabled || readOnly) && (
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
            lock
          </span>
        )}
      </div>
    </div>
  );
}

function FormSelect({ label, value, onChange, disabled }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </label>

      <div className="relative">
        <select
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className={`w-full appearance-none rounded-2xl border px-4 py-3 text-sm font-semibold outline-none transition ${
            disabled
              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
              : "border-slate-200 bg-white text-slate-800 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          }`}
        >
          <option value="">Chọn giới tính</option>
          <option value="Nam">Nam</option>
          <option value="Nữ">Nữ</option>
          <option value="Khác">Khác</option>
        </select>

        <span className="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">
          expand_more
        </span>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
      <div className="flex min-h-[300px] flex-col items-center justify-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <p className="text-sm font-semibold text-slate-600">
          Đang tải thông tin cá nhân...
        </p>
      </div>
    </div>
  );
}

export default function TeacherProfile() {
  const navigate = useNavigate();

  const teacherId = useMemo(() => getTeacherId(), []);
  const teacherHeader = useMemo(() => getTeacherInfo(), []);

  const [profile, setProfile] = useState(() => normalizeProfile({}));
  const [originalProfile, setOriginalProfile] = useState(() =>
    normalizeProfile({})
  );
  const [stats, setStats] = useState(() => normalizeStats({}));
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      if (!teacherId) {
        if (isMounted) {
          setMessage(
            "Không tìm thấy teacherId. Vui lòng đăng nhập lại bằng tài khoản giáo viên."
          );
          setLoading(false);
        }

        return;
      }

      try {
        const [profileData, dashboardData] = await Promise.all([
          getTeacherProfile(teacherId),
          getTeacherDashboard(teacherId),
        ]);

        if (!isMounted) return;

        const normalizedProfile = normalizeProfile(profileData);
        const normalizedStats = normalizeStats(dashboardData);

        setProfile(normalizedProfile);
        setOriginalProfile(normalizedProfile);
        setStats(normalizedStats);
        setMessage("");
      } catch (error) {
        console.error("Lỗi tải thông tin cá nhân:", error);

        if (isMounted) {
          setMessage(error.message || "Không thể tải thông tin cá nhân.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [teacherId]);

  const headerTeacher = useMemo(
    () => ({
      ...teacherHeader,
      ...profile,
    }),
    [teacherHeader, profile]
  );

  const updateField = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const openChangePassword = () => {
    setShowChangePassword(true);
    setIsEditing(false);
    setMessage("");
    setSuccessMessage("");
  };

  const closeChangePassword = () => {
    setShowChangePassword(false);
    setMessage("");
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Vui lòng chọn file hình ảnh hợp lệ.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage("Ảnh đại diện không được vượt quá 2MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setProfile((prev) => ({
        ...prev,
        avatar: reader.result,
      }));
      setMessage("");
    };

    reader.readAsDataURL(file);
  };

  const handleCancel = () => {
    setProfile(originalProfile);
    setIsEditing(false);
    setMessage("");
    setSuccessMessage("");
  };

  const handleSave = async () => {
    if (!teacherId) {
      setMessage("Thiếu teacherId, không thể cập nhật thông tin.");
      return;
    }

    if (!profile.full_name.trim()) {
      setMessage("Họ và tên không được để trống.");
      return;
    }

    if (!profile.email.trim()) {
      setMessage("Email không được để trống.");
      return;
    }

    if (!profile.phone.trim()) {
      setMessage("Số điện thoại không được để trống.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setSuccessMessage("");

      const payload = {
        full_name: profile.full_name.trim(),
        gender: genderToApi(profile.gender),
        date_of_birth: profile.date_of_birth || null,
        phone: profile.phone.trim(),
        email: profile.email.trim(),
        avatar: profile.avatar || null,
        personal_email: profile.personal_email || null,
        office: profile.office || null,
      };

      await updateTeacherProfile(teacherId, payload);

      const nextProfile = {
        ...profile,
      };

      setOriginalProfile(nextProfile);
      saveTeacherToLocalStorage(nextProfile);
      setIsEditing(false);
      setSuccessMessage("Cập nhật thông tin cá nhân thành công.");
    } catch (error) {
      console.error("Lỗi cập nhật thông tin cá nhân:", error);
      setMessage(error.message || "Không thể cập nhật thông tin cá nhân.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar activePage={showChangePassword ? "change-password" : "profile"} />

      <div className="flex min-h-screen flex-1 flex-col md:ml-[280px]">
        <Header teacher={headerTeacher} />

        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 text-white shadow-lg shadow-blue-100">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm text-blue-100">
                  <button
                    type="button"
                    onClick={() => navigate("/teacher/dashboard")}
                    className="font-semibold transition hover:text-white"
                  >
                    Trang chủ
                  </button>

                  <span className="material-symbols-outlined text-[18px]">
                    chevron_right
                  </span>

                  <button
                    type="button"
                    onClick={() => setShowChangePassword(false)}
                    className="font-semibold transition hover:text-white"
                  >
                    Cá nhân
                  </button>

                  {showChangePassword && (
                    <>
                      <span className="material-symbols-outlined text-[18px]">
                        chevron_right
                      </span>
                      <span>Đổi mật khẩu</span>
                    </>
                  )}
                </div>

                <h2 className="text-3xl font-bold tracking-tight">
                  {showChangePassword ? "Đổi mật khẩu" : "Thông tin cá nhân"}
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-blue-100">
                  {showChangePassword
                    ? "Cập nhật mật khẩu tài khoản giáo viên để tăng cường bảo mật."
                    : "Quản lý hồ sơ giáo viên, thông tin liên hệ và ảnh đại diện trong hệ thống điểm danh."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {!showChangePassword && !isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setMessage("");
                      setSuccessMessage("");
                    }}
                    className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      edit
                    </span>
                    Chỉnh sửa
                  </button>
                )}

                {!showChangePassword && isEditing && (
                  <>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        close
                      </span>
                      Hủy
                    </button>

                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        save
                      </span>
                      {saving ? "Đang lưu..." : "Lưu thông tin"}
                    </button>
                  </>
                )}

                {!showChangePassword ? (
                  <button
                    type="button"
                    onClick={openChangePassword}
                    className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/25"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      key
                    </span>
                    Đổi mật khẩu
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={closeChangePassword}
                    className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/25"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      person
                    </span>
                    Quay lại hồ sơ
                  </button>
                )}
              </div>
            </div>
          </div>

          {message && (
            <div className="mb-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              <span className="material-symbols-outlined text-[20px]">
                error
              </span>
              <span>{message}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              <span className="material-symbols-outlined text-[20px]">
                check_circle
              </span>
              <span>{successMessage}</span>
            </div>
          )}

          {loading ? (
            <LoadingState />
          ) : showChangePassword ? (
            <TeacherChangePasswordPanel
              teacherId={teacherId}
              onCancel={closeChangePassword}
              onSuccess={(text) => {
                setSuccessMessage(text);
                setMessage("");
              }}
              onError={(text) => {
                setMessage(text);
                setSuccessMessage("");
              }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div className="xl:col-span-4">
                <ProfileHero
                  profile={profile}
                  stats={stats}
                  isEditing={isEditing}
                  onAvatarChange={handleAvatarChange}
                />
              </div>

              <div className="xl:col-span-8">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">
                        Thông tin chi tiết
                      </h3>
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        Một số trường hệ thống như mã giáo viên, khoa và trạng
                        thái tài khoản chỉ có admin mới được chỉnh sửa.
                      </p>
                    </div>

                    <span
                      className={`hidden rounded-full px-3 py-1 text-xs font-bold sm:inline-flex ${
                        isEditing
                          ? "bg-blue-50 text-blue-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {isEditing ? "Đang chỉnh sửa" : "Chế độ xem"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <FormInput
                      label="Mã giáo viên"
                      value={profile.teacher_code}
                      onChange={() => {}}
                      disabled
                    />

                    <FormInput
                      label="Khoa/Bộ môn"
                      value={profile.department_name}
                      onChange={() => {}}
                      disabled
                    />

                    <FormInput
                      label="Họ và tên"
                      value={profile.full_name}
                      onChange={(value) => updateField("full_name", value)}
                      disabled={!isEditing}
                    />

                    <FormInput
                      label="Ngày sinh"
                      type="date"
                      value={profile.date_of_birth}
                      onChange={(value) => updateField("date_of_birth", value)}
                      disabled={!isEditing}
                    />

                    <FormSelect
                      label="Giới tính"
                      value={profile.gender}
                      onChange={(value) => updateField("gender", value)}
                      disabled={!isEditing}
                    />

                    <FormInput
                      label="Chức vụ"
                      value={profile.position}
                      onChange={() => {}}
                      disabled
                    />

                    <div className="md:col-span-2 mt-2 border-t border-slate-100 pt-5">
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-400">
                        Thông tin liên hệ
                      </h4>
                    </div>

                    <FormInput
                      label="Email trường cấp"
                      type="email"
                      icon="mail"
                      value={profile.email}
                      onChange={(value) => updateField("email", value)}
                      disabled={!isEditing}
                    />

                    <FormInput
                      label="Email cá nhân"
                      type="email"
                      icon="alternate_email"
                      value={profile.personal_email}
                      onChange={(value) =>
                        updateField("personal_email", value)
                      }
                      disabled={!isEditing}
                      placeholder="Nhập email cá nhân"
                    />

                    <FormInput
                      label="Số điện thoại"
                      type="tel"
                      icon="call"
                      value={profile.phone}
                      onChange={(value) => updateField("phone", value)}
                      disabled={!isEditing}
                    />

                    <FormInput
                      label="Địa chỉ / Phòng làm việc"
                      icon="location_on"
                      value={profile.office}
                      onChange={(value) => updateField("office", value)}
                      disabled={!isEditing}
                      placeholder="Ví dụ: Phòng 402, Tòa nhà A"
                    />
                  </div>

                  <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-end">
                    <button
                      type="button"
                      onClick={() => navigate("/teacher/notifications")}
                      className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        notifications
                      </span>
                      Xem thông báo
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/teacher/schedule")}
                      className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        calendar_today
                      </span>
                      Lịch dạy
                    </button>

                    <button
                      type="button"
                      onClick={openChangePassword}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        key
                      </span>
                      Đổi mật khẩu
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}