import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function getInitials(name) {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

function resolveImageUrl(path) {
  if (!path) return "";

  const value = String(path).trim();

  if (!value) return "";

  if (value.startsWith("data:image")) {
    return value;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.length > 200 && /^[A-Za-z0-9+/=]+$/.test(value)) {
    return `data:image/jpeg;base64,${value}`;
  }

  if (value.startsWith("/")) {
    return `http://localhost:3060${value}`;
  }

  return `http://localhost:3060/${value}`;
}

export default function Header({ student = {}, unreadCount = 0 }) {
  const navigate = useNavigate();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme) {
      return savedTheme === "dark";
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;

    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const studentName =
    student?.full_name ||
    student?.student_name ||
    student?.name ||
    "Sinh viên";

  const studentCode =
    student?.student_code ||
    student?.code ||
    "Chưa có MSSV";

  const studentAvatar = resolveImageUrl(
    student?.avatar || student?.student_avatar || ""
  );

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 shadow-sm backdrop-blur-xl transition-colors duration-300 md:px-6 dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-600 transition hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          title="Menu"
        >
          <span className="material-symbols-outlined text-[24px]">
            menu
          </span>
        </button>

        <div className="md:hidden">
          <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
            FaceID Student
          </h1>

          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            Attendance System
          </p>
        </div>

        <div className="hidden md:block">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Welcome back
          </p>

          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            Dashboard Sinh Viên
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate("/student/notifications")}
          className="relative flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400"
          title="Thông báo"
        >
          <span className="material-symbols-outlined text-[22px]">
            notifications
          </span>

          {Number(unreadCount || 0) > 0 && (
            <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white dark:border-slate-950">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => navigate("/student/settings")}
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400"
          title="Cài đặt"
        >
          <span className="material-symbols-outlined text-[22px]">
            settings
          </span>
        </button>

        <button
          type="button"
          onClick={toggleDarkMode}
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-yellow-400"
          title={
            isDarkMode
              ? "Chuyển sang chế độ sáng"
              : "Chuyển sang chế độ tối"
          }
        >
          <span className="material-symbols-outlined text-[22px]">
            {isDarkMode ? "light_mode" : "dark_mode"}
          </span>
        </button>

        <div className="mx-1 hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-800" />

        <button
          type="button"
          onClick={() => navigate("/student/profile")}
          className="flex items-center gap-3 rounded-2xl p-1.5 pr-3 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Hồ sơ cá nhân"
        >
          {studentAvatar ? (
            <img
              alt={studentName}
              className="h-9 w-9 rounded-2xl border border-slate-200 object-cover shadow-sm dark:border-slate-700"
              src={studentAvatar}
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-blue-50 text-sm font-black text-blue-700 shadow-sm dark:border-slate-700 dark:bg-blue-950 dark:text-blue-300">
              {getInitials(studentName)}
            </div>
          )}

          <div className="hidden text-left lg:block">
            <p className="max-w-[170px] truncate text-sm font-black leading-4 text-slate-900 dark:text-white">
              {studentName}
            </p>

            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              {studentCode}
            </p>
          </div>

          <span className="material-symbols-outlined hidden text-[20px] text-slate-400 lg:block dark:text-slate-500">
            expand_more
          </span>
        </button>
      </div>
    </header>
  );
}