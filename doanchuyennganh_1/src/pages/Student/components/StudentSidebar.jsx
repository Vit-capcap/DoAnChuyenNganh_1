// src/pages/Student/components/StudentSidebar.jsx
import { useNavigate, useLocation } from "react-router-dom";
import SidebarItem from "../../components/SidebarItem";

const LOGO_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuByqpuGT4ZURM80QuN_t5H06SiXoGLOTzxdIng8RWquPlW9UpfcpjnGm8am9toduK4jb-5FdUal4_Gm0-_J6R15bETCjB-Tqcx1YO14Kj5C3bDqT3lY-6TR0zPafo_lmTPqJnwJwvGtujsfZp6A6iC-9EQkJ3r0ynJUV0absqZVAzEWYsYikklO_Tgs2lqui1VY25TItD_04fhkYTTVovOtrZNFZhpzt-0RQ4d3CCp9ABBi6jWXZSYjPmXKAe7MGuvaZIgsNG69Og";

const MENU_ITEMS = [
  { icon: "dashboard", title: "Dashboard", path: "/student/dashboard" },
  { icon: "face", title: "Face Registration", path: null }, // tạm alert
  { icon: "calendar_month", title: "Study Schedule", path: "/student/schedule" },
  { icon: "history", title: "Attendance History", path: "/student/attendance" },
  { icon: "leaderboard", title: "Statistics", path: "/student/statistics" },
  { icon: "notifications", title: "Notifications", path: "/student/notifications" },
  { icon: "settings", title: "Settings", path: "/student/profile" },
];

export default function StudentSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const isActive = (item) => {
    if (!item.path) return false;
    // Settings/Profile: active nếu pathname là /student/profile hoặc /student/settings
    if (item.path === "/student/profile") {
      return (
        location.pathname === "/student/profile" ||
        location.pathname === "/student/settings"
      );
    }
    return location.pathname === item.path;
  };

  const handleClick = (item) => {
    if (!item.path) {
      alert(`Chức năng "${item.title}" đang được phát triển.`);
      return;
    }
    navigate(item.path);
  };

  return (
    <aside className="fixed left-0 top-0 w-[280px] h-screen bg-[#111827] text-white hidden md:flex flex-col z-50 shadow-2xl">

      {/* LOGO */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <img
            src={LOGO_URL}
            alt="EduFace AI logo"
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h1 className="text-2xl font-bold">EduFace AI</h1>
            <p className="text-sm text-gray-400">Biometric System</p>
          </div>
        </div>
      </div>

      {/* MENU */}
      <div className="flex-1 px-4 py-5 space-y-2 overflow-y-auto">
        {MENU_ITEMS.map((item, index) => (
          <div
            key={index}
            onClick={() => handleClick(item)}
            className="cursor-pointer"
          >
            <SidebarItem
              icon={item.icon}
              title={item.title}
              active={isActive(item)}
            />
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t border-white/10">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 rounded-2xl py-3 transition"
        >
          <span className="material-symbols-outlined">logout</span>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
