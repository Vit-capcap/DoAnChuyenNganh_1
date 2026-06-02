// src/pages/Student/components/StudentHeader.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = "http://localhost:3060";
const DEFAULT_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAycJ0tEqeG-1uLDOlXlgjI1dU8HkpVebjSbkLUez0eXu8DDxLTNlOyo_8XD0-uo1--Y-xN63S2rEmTS0HOQhWOX9niSdgdaddNuBfFYlkPk1tSW-VQRU4yDZ81GUgDnSzbM9qu--rvEmZM_A0QeG2xJnRXJ1rOWF-awF6gecutUqgPdLf44gwdQMqctU7p5C-yeX0yVDx78tunxeT2A1OA3aYXDL5pKXfSZRKpr7jUGd0zmoPaB7wDMpiMokDZ6-IMALT8mFmfSA";

/** Trả về URL hoàn chỉnh cho ảnh từ backend */
function resolveImageUrl(path) {
  if (!path) return DEFAULT_AVATAR;
  if (path.startsWith("http")) return path;
  return `${BACKEND_URL}/${path}`;
}

/**
 * StudentHeader – header dùng chung cho toàn bộ phân hệ Student.
 *
 * Props:
 *  - title        : tiêu đề chính (dòng lớn màu xanh)
 *  - subtitle     : tiêu đề phụ bên dưới (dòng nhỏ)
 *  - showSearch   : boolean – có hiển thị ô search không (default true)
 *  - searchDisabled: boolean – disabled ô search (default false khi showSearch=true)
 *  - searchValue  : giá trị search
 *  - onSearchChange: handler thay đổi search
 *  - searchPlaceholder: placeholder cho ô search
 *  - actions      : JSX node – các nút thêm render ở đầu phần actions (bên trái notification)
 */
export default function StudentHeader({
  title = "Student Portal",
  subtitle,
  showSearch = true,
  searchDisabled = false,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  actions,
}) {
  const navigate = useNavigate();
  const [avatarSrc, setAvatarSrc] = useState(DEFAULT_AVATAR);

  useEffect(() => {
    try {
      const userRaw = localStorage.getItem("user");
      if (userRaw) {
        const user = JSON.parse(userRaw);
        if (user.avatar) {
          setAvatarSrc(resolveImageUrl(user.avatar));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <header className="fixed top-0 right-0 md:left-[280px] h-[80px] bg-white/80 backdrop-blur-lg border-b border-gray-200 flex items-center justify-between px-6 z-40">

      {/* TITLE */}
      <div>
        <h2 className="text-3xl font-extrabold text-blue-700">{title}</h2>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* ACTIONS */}
      <div className="flex items-center gap-4">

        {/* Extra actions được truyền từ ngoài (ví dụ: nút Refresh của Profile) */}
        {actions}

        {/* SEARCH */}
        {showSearch && (
          <div className="hidden lg:flex items-center bg-[#f3f6fb] rounded-full px-5 py-2 border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-200 transition">
            <input
              type="text"
              placeholder={searchPlaceholder}
              className={`bg-transparent outline-none text-sm w-[200px] ${
                searchDisabled ? "cursor-not-allowed" : ""
              }`}
              disabled={searchDisabled}
              value={searchValue}
              onChange={onSearchChange}
              title={searchDisabled ? "Chức năng tìm kiếm đang được phát triển" : undefined}
            />
            <span className="material-symbols-outlined text-gray-500 text-[20px]">search</span>
          </div>
        )}

        {/* NOTIFICATIONS */}
        <button
          type="button"
          onClick={() => navigate("/student/notifications")}
          className="relative p-2 rounded-full hover:bg-gray-100 transition"
          title="Thông báo"
        >
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* AVATAR */}
        <img
          src={avatarSrc}
          alt="avatar"
          className="w-11 h-11 rounded-full border-2 border-white shadow-sm object-cover cursor-pointer hover:ring-2 hover:ring-blue-400 transition"
          onClick={() => navigate("/student/profile")}
          onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
          title="Thông tin cá nhân"
        />
      </div>
    </header>
  );
}
