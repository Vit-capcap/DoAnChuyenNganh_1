import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/admin/Sidebar";
import Header from "../components/admin/Header";

import TeacherStats from "../components/admin/TeacherStats";
import TeacherFilters from "../components/admin/TeacherFilters";
import TeacherList from "../components/admin/TeacherList";
import TeacherDetailModal from "../components/admin/TeacherDetailModal";

import { getTeachers } from "../../api/teacherApi";

export default function AdminTeachersPage() {
  const navigate = useNavigate();

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [selectedTeacher, setSelectedTeacher] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadTeachers = async () => {
      try {
        const data = await getTeachers();

        if (isMounted) {
          setTeachers(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách giáo viên:", error);

        if (isMounted) {
          setMessage(error.message || "Không thể tải danh sách giáo viên");
          setTeachers([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTeachers();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setMessage("");

      const data = await getTeachers();
      setTeachers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi lấy danh sách giáo viên:", error);
      setMessage(error.message || "Không thể tải danh sách giáo viên");
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name = "") => {
    if (!name || !name.trim()) return "GV";

    return name
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(-2)
      .toUpperCase();
  };

  const formatGender = (gender) => {
    if (gender === "Male") return "Nam";
    if (gender === "Female") return "Nữ";
    if (gender === "Other") return "Khác";
    return "Chưa cập nhật";
  };

  const getStatusBadge = (teacher) => {
    const isActive =
      teacher.status_type === "active" ||
      teacher.work_status === "Đang công tác" ||
      teacher.teacher_code;

    if (isActive) {
      return {
        text: teacher.work_status || "Đang công tác",
        icon: "check_circle",
        className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
      };
    }

    return {
      text: teacher.work_status || "Tạm nghỉ",
      icon: "warning",
      className: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    };
  };

  const departmentOptions = useMemo(() => {
    return [
      ...new Set(
        teachers.map((teacher) => teacher.department_name).filter(Boolean)
      ),
    ];
  }, [teachers]);

  const stats = useMemo(() => {
    const total = teachers.length;

    const active = teachers.filter((teacher) => {
      return (
        teacher.status_type === "active" ||
        teacher.work_status === "Đang công tác" ||
        teacher.teacher_code
      );
    }).length;

    const departments = new Set(
      teachers.map((teacher) => teacher.department_name).filter(Boolean)
    ).size;

    const missingEmail = teachers.filter((teacher) => !teacher.email).length;

    return {
      total,
      active,
      departments,
      missingEmail,
    };
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const keyword = searchKeyword.trim().toLowerCase();

      const matchKeyword =
        keyword === "" ||
        teacher.full_name?.toLowerCase().includes(keyword) ||
        teacher.teacher_code?.toLowerCase().includes(keyword) ||
        teacher.email?.toLowerCase().includes(keyword) ||
        teacher.phone?.toLowerCase().includes(keyword) ||
        teacher.department_name?.toLowerCase().includes(keyword);

      const matchDepartment =
        selectedDepartment === "" ||
        teacher.department_name === selectedDepartment;

      const isActive =
        teacher.status_type === "active" ||
        teacher.work_status === "Đang công tác" ||
        teacher.teacher_code;

      const matchStatus =
        selectedStatus === "" ||
        (selectedStatus === "active" && isActive) ||
        (selectedStatus === "inactive" && !isActive);

      return matchKeyword && matchDepartment && matchStatus;
    });
  }, [teachers, searchKeyword, selectedDepartment, selectedStatus]);

  const handleResetFilter = () => {
    setSearchKeyword("");
    setSelectedDepartment("");
    setSelectedStatus("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-700 flex">
        <Sidebar activePage="teachers" />

        <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
          <Header />

          <main className="flex-1 p-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm flex flex-col items-center justify-center min-h-[320px]">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />

              <p className="text-sm font-semibold text-slate-600">
                Đang tải danh sách giáo viên...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar activePage="teachers" />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 text-white shadow-lg shadow-blue-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 text-blue-100 text-sm mb-2">
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="hover:text-white transition font-semibold"
                  >
                    Trang chủ
                  </button>

                  <span className="material-symbols-outlined text-[16px]">
                    chevron_right
                  </span>

                  <span className="font-semibold text-white">Giáo viên</span>
                </div>

                <h2 className="text-3xl font-bold tracking-tight">
                  Quản lý Giáo viên
                </h2>

                <p className="text-sm text-blue-100 mt-2 max-w-2xl">
                  Theo dõi hồ sơ giáo viên, thông tin liên hệ, khoa/bộ môn và
                  trạng thái công tác trong hệ thống.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={fetchTeachers}
                  className="bg-white/15 hover:bg-white/25 text-white px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-semibold transition border border-white/20"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    refresh
                  </span>
                  Tải lại
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/addteachers")}
                  className="bg-white text-blue-700 px-5 py-3 rounded-2xl flex items-center gap-2 text-sm font-bold hover:bg-blue-50 transition shadow-sm"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    person_add
                  </span>
                  Thêm giáo viên
                </button>
              </div>
            </div>
          </div>

          {message && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 flex items-start gap-2">
              <span className="material-symbols-outlined text-[20px]">
                error
              </span>
              <span>{message}</span>
            </div>
          )}

          <TeacherStats stats={stats} />

          <TeacherFilters
            searchKeyword={searchKeyword}
            setSearchKeyword={setSearchKeyword}
            selectedDepartment={selectedDepartment}
            setSelectedDepartment={setSelectedDepartment}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            departmentOptions={departmentOptions}
            onReset={handleResetFilter}
          />

          <TeacherList
            teachers={filteredTeachers}
            totalTeachers={teachers.length}
            getInitials={getInitials}
            getStatusBadge={getStatusBadge}
            onViewDetail={setSelectedTeacher}
          />
        </main>
      </div>

      {selectedTeacher && (
        <TeacherDetailModal
          teacher={selectedTeacher}
          getInitials={getInitials}
          formatGender={formatGender}
          getStatusBadge={getStatusBadge}
          onClose={() => setSelectedTeacher(null)}
          onEdit={() => {
            const id = selectedTeacher.id_teacher;
            setSelectedTeacher(null);
            navigate(`/editteacher/${id}`);
          }}
        />
      )}
    </div>
  );
}