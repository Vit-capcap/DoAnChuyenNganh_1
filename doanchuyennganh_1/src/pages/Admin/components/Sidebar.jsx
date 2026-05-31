export default function Sidebar({ activePage }) {
  const sidebarItems = [
    { icon: "dashboard", label: "Trang chủ", key: "dashboard", path: "/dashboard" },
    { icon: "group", label: "Học sinh - sinh viên", key: "students", path: "/students" },
    { icon: "school", label: "Quản lý giáo viên", key: "teachers", path: "/teachers" },
    { icon: "meeting_room", label: "Quản lý phòng học", key: "rooms", path: "/rooms" },
    { icon: "calendar_month", label: "Lịch học", key: "schedule", path: "/schedule" },
    { icon: "menu_book", label: "Môn học", key: "subjects", path: "/subjects" },
  ];

  return (
    <aside className="w-[280px] h-full fixed left-0 top-0 overflow-y-auto hidden md:flex flex-col p-6 border-r border-[#c3c6d7] bg-[#111827] z-50">
      <div className="flex items-center gap-4a mb-8 px-2"> 
        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
          <span className="material-symbols-outlined text-white">face</span>
        </div>

        <div>
          <h1 className="text-xl font-bold text-blue-700">FaceID Portal</h1>
          <p className="text-xs font-semibold text-gray-500">
            Management System
          </p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {sidebarItems.map((item) => {
          const isActive = activePage === item.key;


          return (
            <a
              key={item.key}
              href={item.path}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
          isActive
            ? "bg-blue-600/20 text-blue-400"
            : "text-gray-500 hover:bg-white/10 hover:text-white/70"
        }`}
      >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-sm font-semibold">{item.label}</span>
            </a>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
          <button className="w-full bg-white/10 text-white/80 hover:bg-white/20 transition rounded-xl py-3 mb-3">
            Help Support
          </button>

          <button className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-500/10 rounded-xl py-3 transition">
            <span className="material-symbols-outlined ">
              logout
            </span>

            Logout
          </button>
        </div>
    </aside>
  );
}