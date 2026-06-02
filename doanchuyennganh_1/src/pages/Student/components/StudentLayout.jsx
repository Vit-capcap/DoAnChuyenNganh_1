// src/pages/Student/components/StudentLayout.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StudentSidebar from "./StudentSidebar";
import StudentHeader from "./StudentHeader";

/**
 * StudentLayout – layout chung bao gồm Sidebar + Header + main content.
 *
 * Props:
 *  - title           : tiêu đề header
 *  - subtitle        : phụ đề header
 *  - children        : nội dung trang
 *  - headerActions   : JSX – các nút render trong header (trước notification)
 *  - showSearch      : boolean
 *  - searchDisabled  : boolean
 *  - searchValue     : string
 *  - onSearchChange  : fn
 *  - searchPlaceholder: string
 */
export default function StudentLayout({
  title = "Student Portal",
  subtitle,
  children,
  headerActions,
  showSearch = true,
  searchDisabled = false,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
}) {
  const navigate = useNavigate();

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
    if (user.role !== "STUDENT") {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="bg-[#f3f6fb] min-h-screen font-[Inter] text-gray-800 overflow-x-hidden">

      {/* Custom scrollbar */}
      <style>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      {/* SIDEBAR */}
      <StudentSidebar />

      {/* HEADER */}
      <StudentHeader
        title={title}
        subtitle={subtitle}
        showSearch={showSearch}
        searchDisabled={searchDisabled}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        actions={headerActions}
      />

      {/* MAIN */}
      <main className="md:ml-[280px] pt-[100px] px-6 pb-8">
        {children}
      </main>
    </div>
  );
}
