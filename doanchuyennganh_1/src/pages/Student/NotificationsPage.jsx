import SidebarItem from "../components/SidebarItem";

const sidebarItems = [
  { icon: "dashboard", title: "Dashboard" },
  { icon: "face", title: "Face Registration" },
  { icon: "calendar_month", title: "Study Schedule" },
  { icon: "history", title: "Attendance History" },
  { icon: "leaderboard", title: "Statistics" },
  { icon: "notifications", title: "Notifications", active: true },
  { icon: "settings", title: "Settings" },
];

const notifications = [
  {
    title: "AI Biometric Warning",
    time: "2 mins ago",
    icon: "warning",
    color: "bg-orange-100 text-orange-600",
    unread: true,
    description:
      "The facial recognition system detected a low-confidence match during your login attempt to the Advanced Physics portal.",
    action: "Review Event",
  },
  {
    title: "Upcoming Class: Data Structures",
    time: "1 hour ago",
    icon: "calendar_month",
    color: "bg-blue-100 text-blue-700",
    unread: true,
    description:
      "Your class CS-301 Data Structures begins in 30 minutes in Room 4B.",
  },
  {
    title: "Attendance Alert",
    time: "Yesterday, 14:30",
    icon: "face",
    color: "bg-red-100 text-red-600",
    unread: false,
    description:
      "You were marked absent for Applied Mathematics. If this is incorrect, submit a review request.",
  },
  {
    title: "System Maintenance",
    time: "Oct 12, 09:00",
    icon: "info",
    color: "bg-gray-100 text-gray-600",
    unread: false,
    description:
      "The Student Portal and AI Biometric servers will undergo maintenance this Sunday.",
  },
];

function NotificationCard({
  title,
  time,
  icon,
  color,
  unread,
  description,
  action,
}) {
  return (
    <div
      className={`relative rounded-3xl border p-6 transition-all hover:shadow-lg ${
        unread
          ? "bg-white border-gray-200 shadow-sm"
          : "bg-gray-50 border-gray-100 opacity-80 hover:opacity-100"
      }`}
    >
      {/* UNREAD DOT */}
      {unread && (
        <div className="absolute top-6 right-6 w-3 h-3 rounded-full bg-blue-600 shadow-lg shadow-blue-300"></div>
      )}

      <div className="flex gap-5">

        {/* ICON */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${color}`}
        >
          <span className="material-symbols-outlined text-[28px]">
            {icon}
          </span>
        </div>

        {/* CONTENT */}
        <div className="flex-1">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">

            <h3 className="text-lg font-bold text-gray-800">
              {title}
            </h3>

            <span
              className={`text-sm font-medium ${
                unread ? "text-blue-700" : "text-gray-400"
              }`}
            >
              {time}
            </span>
          </div>

          <p className="text-gray-500 leading-relaxed">
            {description}
          </p>

          {action && (
            <button className="mt-4 text-blue-700 font-semibold hover:underline flex items-center gap-1">

              {action}

              <span className="material-symbols-outlined text-[18px]">
                arrow_forward
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
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

            <div className="w-12 h-12 rounded-full bg-blue-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-white">
                school
              </span>
            </div>

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
            <SidebarItem
              key={index}
              icon={item.icon}
              title={item.title}
              active={item.active}
            />
          ))}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-white/10">

          <button className="w-full bg-white/10 hover:bg-white/20 transition rounded-2xl py-3 mb-3">
            Help Support
          </button>

          <button className="w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 rounded-2xl py-3 transition">

            <span className="material-symbols-outlined">
              logout
            </span>

            Logout
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
            Notifications & Alerts
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-4">

          {/* SEARCH */}
          <div className="hidden lg:flex items-center bg-[#f3f6fb] rounded-full px-5 py-2.5 border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition">

            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent outline-none text-sm w-[220px]"
            />

            <span className="material-symbols-outlined text-gray-500">
              search
            </span>
          </div>

          {/* NOTIFICATION ACTIVE */}
          <button className="relative w-11 h-11 rounded-2xl bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-200">

            <span className="material-symbols-outlined">
              notifications
            </span>

            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-400"></span>
          </button>

          {/* SETTINGS */}
          <button className="w-11 h-11 rounded-2xl bg-[#f3f6fb] hover:bg-gray-200 transition flex items-center justify-center">

            <span className="material-symbols-outlined text-gray-700">
              settings
            </span>
          </button>

          {/* AVATAR */}
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgHCXiNang-UNAIK8diEIZZoGpXBJJUa-dCVajejzQ-Ee6kMpdBnuCZFlQBq27RtkaYfn87Zl2GbuNqEv8XlIP8Y1qD52qlscPd5N3PVh9jNmusFvG2ASv99cRXEXS9DMoPzIBWt0IR4XvQkGRjgvuxGfezVsKmQx2sjv5Nfp2PnA84_z0JlIYFEwD8d-keArXCPYI6_ENaf4TPnxBtNk3hwfm-5snvV0HZZZyE2O1zShRATkBSuMG2BKxWzVwVXAvfra6wxIk3w"
            alt="avatar"
            className="w-11 h-11 rounded-2xl border-2 border-white shadow-sm object-cover"
          />
        </div>
      </header>

      {/* =========================
                MAIN
      ========================= */}
      <main className="md:ml-[280px] pt-[110px] px-6 pb-8">

        <div className="max-w-[1400px] mx-auto">

          {/* PAGE HEADER */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-8">

            <div>
              <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
                Notifications
              </h1>

              <p className="text-gray-500">
                Stay updated with your latest alerts and academic activities.
              </p>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-wrap gap-4">

              <button className="px-5 py-3 rounded-2xl border border-gray-300 hover:border-blue-500 hover:text-blue-700 transition font-medium flex items-center gap-2">

                <span className="material-symbols-outlined text-[20px]">
                  done_all
                </span>

                Mark all as read
              </button>

              <button className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl font-medium shadow-lg shadow-blue-200 transition flex items-center gap-2">

                <span className="material-symbols-outlined text-[20px]">
                  tune
                </span>

                Notification Settings
              </button>
            </div>
          </div>

          {/* NOTIFICATIONS LIST */}
          <div className="max-w-5xl space-y-5">

            {notifications.map((item, index) => (
              <NotificationCard
                key={index}
                title={item.title}
                time={item.time}
                icon={item.icon}
                color={item.color}
                unread={item.unread}
                description={item.description}
                action={item.action}
              />
            ))}

            {/* LOAD MORE */}
            <div className="flex justify-center pt-6">

              <button className="px-8 py-3 rounded-full border border-gray-300 hover:border-blue-500 hover:text-blue-700 transition font-medium">
                Load Previous Notifications
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}