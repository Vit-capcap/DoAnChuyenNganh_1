import { NavLink } from "react-router-dom";

export default function Sidebar({ activePage }) {
  const sidebarItems = [
    {
      icon: "dashboard",
      label: "Trang chủ",
      key: "dashboard",
      path: "/dashboard",
    },
    {
      icon: "group",
      label: "Học sinh - sinh viên",
      key: "students",
      path: "/students",
    },
    {
      icon: "school",
      label: "Quản lý giáo viên",
      key: "teachers",
      path: "/teachers",
    },
    {
      icon: "meeting_room",
      label: "Quản lý phòng học",
      key: "rooms",
      path: "/rooms",
    },
    {
      icon: "calendar_month",
      label: "Lịch học",
      key: "schedule",
      path: "/schedule",
    },
    {
      icon: "menu_book",
      label: "Môn học",
      key: "subjects",
      path: "/subjects",
    },
    {
      icon: "menu_book",
      label: "Quản lý điểm danh",
      key: "attendance",
      path: "/attendance",
    },
    {
      icon: "menu_book",
      label: "Quản lý tài khoản",
      key: "accounts",
      path: "/accounts",
    },
    {
      icon: "menu_book",
      label: "Biểu đồ thống kê",
      key: "reports",
      path: "/reports",
    },
        {
      icon: "menu_book",
      label: "Camera giám sát",
      key: "cameras",
      path: "/cameras",
    },
 
  ];

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[280px] flex-col overflow-y-auto border-r border-white/10 bg-slate-950 px-5 py-6 text-white md:flex">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-950/40">
          <span className="material-symbols-outlined text-[28px] text-white">
            face
          </span>
        </div>

        <div>
          <h1 className="text-xl font-black tracking-tight text-white">
            FaceID Portal
          </h1>
          <p className="text-xs font-semibold text-slate-400">
            Management System
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {sidebarItems.map((item) => {
          const isActive = activePage === item.key;

          return (
            <NavLink
              key={item.key}
              to={item.path}
              className={`group relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                  : "text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-white" />
              )}

              <span
                className={`material-symbols-outlined text-[22px] transition ${
                  isActive
                    ? "text-white"
                    : "text-slate-500 group-hover:text-white"
                }`}
              >
                {item.icon}
              </span>

              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-4">

        <button
          type="button"
          className="mb-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white/80 transition hover:bg-white/15 hover:text-white"
        >
          <span className="material-symbols-outlined text-[18px]">
            help
          </span>
          Help Support
        </button>

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-red-400 transition bg-red-500/5 hover:bg-red-500/10  hover:text-red-500"
        >
          <span className="material-symbols-outlined text-[18px]">
            logout
          </span>
          Logout
        </button>
      </div>
    </aside>
  );
}