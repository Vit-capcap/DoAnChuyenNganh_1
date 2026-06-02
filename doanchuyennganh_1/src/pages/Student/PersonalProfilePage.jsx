// src/pages/Student/PersonalProfilePage.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SidebarItem from "../components/SidebarItem";
import { getMyStudentProfile } from "../../api/studentApi";

const BACKEND_URL = "http://localhost:3060";
const DEFAULT_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAycJ0tEqeG-1uLDOlXlgjI1dU8HkpVebjSbkLUez0eXu8DDxLTNlOyo_8XD0-uo1--Y-xN63S2rEmTS0HOQhWOX9niSdgdaddNuBfFYlkPk1tSW-VQRU4yDZ81GUgDnSzbM9qu--rvEmZM_A0QeG2xJnRXJ1rOWF-awF6gecutUqgPdLf44gwdQMqctU7p5C-yeX0yVDx78tunxeT2A1OA3aYXDL5pKXfSZRKpr7jUGd0zmoPaB7wDMpiMokDZ6-IMALT8mFmfSA";

/** Trả về URL hoàn chỉnh cho ảnh từ backend */
function resolveImageUrl(path) {
  if (!path) return DEFAULT_AVATAR;
  if (path.startsWith("http")) return path;
  return `${BACKEND_URL}/${path}`;
}

/* =========================
   SIDEBAR ITEMS
========================= */
const sidebarItems = [
  { icon: "dashboard", title: "Dashboard", path: "/student/dashboard" },
  { icon: "face", title: "Face Registration", path: "/student/dashboard" },
  { icon: "calendar_month", title: "Study Schedule", path: "/student/schedule" },
  { icon: "history", title: "Attendance History", path: "/student/attendance" },
  { icon: "leaderboard", title: "Statistics", path: "/student/statistics" },
  { icon: "notifications", title: "Notifications", path: "/student/notifications" },
  { icon: "settings", title: "Settings", active: true, path: "/student/profile" },
];

/* =========================
   SUB-COMPONENTS
========================= */
function InfoField({ label, value, subValue, icon }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:border-blue-200 transition">
      <p className="text-sm text-gray-500 mb-2">{label}</p>

      <div className="flex items-start gap-3">
        {icon && (
          <span className="material-symbols-outlined text-blue-600 mt-0.5">
            {icon}
          </span>
        )}

        <div>
          <p className="text-gray-800 font-medium">{value || "—"}</p>

          {subValue && (
            <p className="text-sm text-gray-500 mt-1">{subValue}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, icon, children, action }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-blue-700">
              {icon}
            </span>
          </div>

          <h3 className="text-xl font-bold text-gray-800">
            {title}
          </h3>
        </div>

        {action}
      </div>

      {/* CONTENT */}
      <div className="p-6">{children}</div>
    </div>
  );
}

/* =========================
   HELPER: format ngày
========================= */
function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatGender(gender) {
  if (!gender) return "—";
  if (gender === "Male") return "Nam";
  if (gender === "Female") return "Nữ";
  return gender;
}

/* =========================
   MAIN COMPONENT
========================= */
export default function PersonalProfilePage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentId, setStudentId] = useState(null);

  const fetchProfile = useCallback((sid) => {
    setLoading(true);
    setError("");
    getMyStudentProfile(sid)
      .then((res) => {
        if (res && res.success) {
          setProfile(res.data);
        } else {
          setError(res?.message || "Không thể tải thông tin cá nhân.");
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Lỗi kết nối đến server.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const userRaw = localStorage.getItem("user");
    if (!userRaw) {
      navigate("/login");
      return;
    }

    let user;
    try {
      user = JSON.parse(userRaw);
    } catch {
      localStorage.removeItem("user");
      navigate("/login");
      return;
    }

    if (user.role !== "STUDENT" || !user.student_id) {
      setError("Tài khoản không có quyền truy cập trang này.");
      setLoading(false);
      return;
    }

    setStudentId(user.student_id);
    fetchProfile(user.student_id);
  }, [navigate, fetchProfile]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  /* ====================== LOADING ====================== */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f6fb] flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-blue-600 animate-spin">
            progress_activity
          </span>
          <p className="mt-4 text-gray-500">Đang tải thông tin cá nhân...</p>
        </div>
      </div>
    );
  }

  /* ====================== ERROR ====================== */
  if (error) {
    return (
      <div className="min-h-screen bg-[#f3f6fb] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <span className="material-symbols-outlined text-6xl text-red-400">
            error_outline
          </span>
          <p className="mt-4 text-red-600 font-semibold">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition"
          >
            Về trang đăng nhập
          </button>
        </div>
      </div>
    );
  }

  /* ====================== BUILD personalInfo ====================== */
  const personalInfo = [
    {
      label: "Họ và tên đầy đủ",
      value: profile?.full_name,
    },
    {
      label: "Ngày sinh",
      value: formatDate(profile?.date_of_birth),
    },
    {
      label: "Giới tính",
      value: formatGender(profile?.gender),
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
    },
    {
      label: "Lớp",
      value: profile?.class_name,
    },
    {
      label: "Khóa học",
      value: profile?.course_year,
    },
    {
      label: "Trạng thái sinh viên",
      value: profile?.student_status === "ACTIVE" ? "Đang học" : (profile?.student_status || "—"),
    },
    {
      label: "Ngày tạo hồ sơ",
      value: formatDate(profile?.created_at),
    },
  ];

  const hasFace = Boolean(profile?.id_face);
  const avatarSrc = resolveImageUrl(profile?.avatar);

  return (
    <div className="min-h-screen bg-[#f3f6fb] text-gray-800 overflow-x-hidden">

      {/* =========================
            SCROLLBAR
      ========================= */}
      <style>{`
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      {/* =========================
              SIDEBAR
      ========================= */}
      <aside className="fixed left-0 top-0 w-[280px] h-screen bg-[#111827] text-white hidden md:flex flex-col z-50 shadow-2xl">

        {/* LOGO */}
        <div className="p-6 border-b border-white/10">

          <div className="flex items-center gap-4">

            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuByqpuGT4ZURM80QuN_t5H06SiXoGLOTzxdIng8RWquPlW9UpfcpjnGm8am9toduK4jb-5FdUal4_Gm0-_J6R15bETCjB-Tqcx1YO14Kj5C3bDqT3lY-6TR0zPafo_lmTPqJnwJwvGtujsfZp6A6iC-9EQkJ3r0ynJUV0absqZVAzEWYsYikklO_Tgs2lqui1VY25TItD_04fhkYTTVovOtrZNFZhpzt-0RQ4d3CCp9ABBi6jWXZSYjPmXKAe7MGuvaZIgsNG69Og"
              alt="logo"
              className="w-12 h-12 rounded-full object-cover"
            />

            <div>
              <h1 className="text-2xl font-bold">
                EduFace AI
              </h1>

              <p className="text-sm text-gray-400">
                Biometric System
              </p>
            </div>
          </div>
        </div>

        {/* MENU */}
        <div className="flex-1 px-4 py-5 space-y-2 overflow-y-auto">

          {sidebarItems.map((item, index) => (
            <div key={index} onClick={() => navigate(item.path)} className="cursor-pointer">
              <SidebarItem
                icon={item.icon}
                title={item.title}
                active={item.active}
              />
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-white/10">

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 rounded-2xl py-3 transition"
          >
            <span className="material-symbols-outlined">
              logout
            </span>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* =========================
              HEADER
      ========================= */}
      <header className="fixed top-0 right-0 md:left-[280px] h-[80px] bg-white/80 backdrop-blur-xl border-b border-gray-200 flex items-center justify-between px-6 z-40">

        {/* TITLE */}
        <div>
          <h2 className="text-3xl font-extrabold text-blue-700">
            Student Portal
          </h2>

          <p className="text-sm text-gray-500">
            Personal Profile Management
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-4">

          {/* REFRESH */}
          <button
            type="button"
            onClick={() => studentId && fetchProfile(studentId)}
            className="p-2 rounded-full hover:bg-gray-100 transition"
            title="Tải lại thông tin"
            disabled={loading}
          >
            <span className={`material-symbols-outlined text-gray-500 ${loading ? "animate-spin" : ""}`}>
              refresh
            </span>
          </button>

          {/* SEARCH – disabled */}
          <div className="hidden lg:flex items-center bg-[#f3f6fb] rounded-full px-5 py-2.5 border border-gray-200">
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent outline-none text-sm w-[220px] cursor-not-allowed"
              disabled
              title="Chức năng tìm kiếm đang được phát triển"
            />
            <span className="material-symbols-outlined text-gray-500">search</span>
          </div>

          {/* AVATAR – click → chính trang này */}
          <img
            src={avatarSrc}
            alt="avatar"
            className="w-11 h-11 rounded-2xl border-2 border-white shadow-sm object-cover cursor-pointer hover:ring-2 hover:ring-blue-400 transition"
            onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
            onClick={() => navigate("/student/profile")}
            title="Thông tin cá nhân"
          />
        </div>
      </header>

      {/* =========================
                MAIN
      ========================= */}
      <main className="md:ml-[280px] pt-[110px] px-6 pb-8">

        <div className="max-w-[1500px] mx-auto">

          {/* PAGE HEADER */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-8">

            <div>
              <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
                Thông tin cá nhân
              </h1>

              <p className="text-gray-500">
                Quản lý hồ sơ nhận diện sinh trắc học và hồ sơ học tập.
              </p>
            </div>
          </div>

          {/* CONTENT */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

            {/* LEFT */}
            <div className="xl:col-span-4">

              <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">

                {/* BANNER */}
                <div className="h-[160px] bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 relative">
                  <div className="absolute inset-0 bg-black/10"></div>
                </div>

                {/* PROFILE */}
                <div className="px-6 pb-6 relative flex flex-col items-center text-center -mt-[70px]">

                  {/* AVATAR */}
                  <div className="relative mb-5">
                    <div className="w-[130px] h-[130px] rounded-full overflow-hidden border-[6px] border-white shadow-xl bg-white">
                      <img
                        src={avatarSrc}
                        alt="profile"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                      />
                    </div>
                  </div>

                  {/* INFO */}
                  <h2 className="text-2xl font-bold text-gray-800">
                    {profile?.full_name || "—"}
                  </h2>

                  <p className="text-blue-700 tracking-widest text-sm font-semibold mt-1 mb-5">
                    Mã SV: {profile?.student_code || "—"}
                  </p>

                  {/* TAGS */}
                  <div className="flex flex-wrap justify-center gap-3 mb-6">

                    <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium">
                      {profile?.faculty || "—"}
                    </span>

                    <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-sm font-medium">
                      {profile?.class_name || "—"}
                    </span>
                  </div>

                  {/* USERNAME */}
                  <div className="w-full bg-[#f8fafc] border border-gray-200 rounded-2xl p-3 mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-gray-500 text-[20px]">
                        person
                      </span>
                      <span className="text-sm text-gray-600">Tài khoản</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{profile?.username || "—"}</span>
                  </div>

                  {/* FACE ID STATUS */}
                  <div className="w-full bg-[#f8fafc] border border-gray-200 rounded-2xl p-4 flex items-center justify-between">

                    <div className="flex items-center gap-2">

                      <span className="material-symbols-outlined text-blue-700">
                        face
                      </span>

                      <span className="font-medium text-gray-700">
                        Face ID Status
                      </span>
                    </div>

                    {hasFace ? (
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">
                          check_circle
                        </span>
                        Đã đăng ký
                      </span>
                    ) : (
                      <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">
                          warning
                        </span>
                        Chưa đăng ký
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="xl:col-span-8 flex flex-col gap-6">

              {/* PERSONAL INFO */}
              <SectionCard
                title="Thông tin cá nhân"
                icon="badge"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {personalInfo.map((item, index) => (
                    <InfoField
                      key={index}
                      label={item.label}
                      value={item.value}
                      subValue={item.subValue}
                      icon={item.icon}
                    />
                  ))}
                </div>
              </SectionCard>

              {/* ACCOUNT SECURITY */}
              <SectionCard
                title="Bảo mật tài khoản"
                icon="security"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">

                  <div>
                    <p className="text-lg font-semibold text-gray-800 mb-1">
                      Mật khẩu & Xác thực
                    </p>

                    <p className="text-gray-500">
                      Trạng thái tài khoản:{" "}
                      <span className={profile?.account_status === "ACTIVE" ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
                        {profile?.account_status === "ACTIVE" ? "Hoạt động" : (profile?.account_status || "—")}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl font-medium w-fit">

                    <span className="material-symbols-outlined">
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
  );
}