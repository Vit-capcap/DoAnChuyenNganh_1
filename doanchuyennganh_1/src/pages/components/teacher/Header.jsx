import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Header({ teacher }) {
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

  const teacherName =
    teacher?.full_name ||
    teacher?.teacher_name ||
    teacher?.name ||
    "Giảng viên";

  const teacherEmail = teacher?.email || teacher?.teacher_email || "";

  const teacherAvatar =
    teacher?.avatar ||
    teacher?.teacher_avatar ||
    "https://i.pravatar.cc/150?img=12";

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 shadow-sm backdrop-blur-xl transition-colors duration-300 md:px-6 dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-600 transition hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        <div className="md:hidden">
          <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
            FaceID Teacher
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
            Dashboard Giáo Viên
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Nút thông báo */}
        <button
          type="button"
          onClick={() => navigate("/teacher/notifications")}
          className="relative flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400"
          title="Thông báo"
        >
          <span className="material-symbols-outlined text-[22px]">
            notifications
          </span>

          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500 dark:border-slate-950" />
        </button>

        {/* Nút đổi giao diện sáng/tối */}
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

        {/* Thông tin giáo viên */}
        <button
          type="button"
          onClick={() => navigate("/teacher/profile")}
          className="flex items-center gap-3 rounded-2xl p-1.5 pr-3 transition hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <img
            alt={teacherName}
            className="h-9 w-9 rounded-2xl border border-slate-200 object-cover shadow-sm dark:border-slate-700"
            src={teacherAvatar}
          />

          <div className="hidden text-left lg:block">
            <p className="text-sm font-black leading-4 text-slate-900 dark:text-white">
              {teacherName}
            </p>

            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              {teacherEmail || "Teacher"}
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