import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/admin/Sidebar";
import Header from "../components/admin/Header";

import StudentStats from "../components/admin/StudentStats";
import StudentFilters from "../components/admin/StudentFilters";
import StudentTable from "../components/admin/StudentTable";
import FaceDataModal from "../components/admin/FaceDataModal";

import { getStudents } from "../../api/studentApi";

export default function AdminStudentsPage() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedFaceStatus, setSelectedFaceStatus] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadStudents = async () => {
      try {
        const data = await getStudents();

        if (isMounted) {
          setStudents(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Lỗi lấy sinh viên:", error);

        if (isMounted) {
          setMessage(error.message || "Không thể tải danh sách sinh viên");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStudents();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setMessage("");

      const data = await getStudents();

      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi lấy sinh viên:", error);
      setMessage(error.message || "Không thể tải danh sách sinh viên");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "SV";

    return name
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(-2)
      .toUpperCase();
  };

  const classOptions = useMemo(() => {
    return [...new Set(students.map((s) => s.class_name).filter(Boolean))];
  }, [students]);

  const facultyOptions = useMemo(() => {
    return [...new Set(students.map((s) => s.faculty).filter(Boolean))];
  }, [students]);

  const stats = useMemo(() => {
    const total = students.length;

    const faceUpdated = students.filter((student) => {
      return Boolean(student.face_updated || student.face_status === "UPDATED");
    }).length;

    const noFace = total - faceUpdated;

    const active = students.filter((student) => {
      const status = student.account_status || student.status;
      return status === "ACTIVE" || status === "Đang học";
    }).length;

    return {
      total,
      faceUpdated,
      noFace,
      active,
    };
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const keyword = searchKeyword.trim().toLowerCase();

      const matchKeyword =
        keyword === "" ||
        student.full_name?.toLowerCase().includes(keyword) ||
        student.student_code?.toLowerCase().includes(keyword) ||
        student.class_name?.toLowerCase().includes(keyword) ||
        student.faculty?.toLowerCase().includes(keyword) ||
        student.email?.toLowerCase().includes(keyword) ||
        student.phone?.toLowerCase().includes(keyword);

      const matchClass =
        selectedClass === "" || student.class_name === selectedClass;

      const matchFaculty =
        selectedFaculty === "" || student.faculty === selectedFaculty;

      const hasFace = Boolean(
        student.face_updated || student.face_status === "UPDATED"
      );

      const matchFaceStatus =
        selectedFaceStatus === "" ||
        (selectedFaceStatus === "UPDATED" && hasFace) ||
        (selectedFaceStatus === "NOT_UPDATED" && !hasFace);

      return matchKeyword && matchClass && matchFaculty && matchFaceStatus;
    });
  }, [
    students,
    searchKeyword,
    selectedClass,
    selectedFaculty,
    selectedFaceStatus,
  ]);

  const handleResetFilter = () => {
    setSearchKeyword("");
    setSelectedClass("");
    setSelectedFaculty("");
    setSelectedFaceStatus("");
  };

  const getFaceBadge = (student) => {
    const hasFace = Boolean(
      student.face_updated || student.face_status === "UPDATED"
    );

    if (hasFace) {
      return {
        text: student.face_status || "Đã cập nhật",
        icon: "check_circle",
        className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
      };
    }

    return {
      text: student.face_status || "Chưa cập nhật",
      icon: "warning",
      className: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
    };
  };

  const getAccountBadge = (student) => {
    const status = student.account_status || student.status;

    if (status === "ACTIVE" || status === "Đang học") {
      return {
        text: "Đang hoạt động",
        className: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
      };
    }

    if (status === "LOCKED") {
      return {
        text: "Đã khóa",
        className: "bg-red-50 text-red-700 ring-1 ring-red-100",
      };
    }

    return {
      text: "Chưa rõ",
      className: "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-700 flex">
        <Sidebar activePage="students" />

        <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
          <Header />

          <main className="flex-1 p-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm flex flex-col items-center justify-center min-h-[320px]">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />

              <p className="text-sm font-semibold text-slate-600">
                Đang tải danh sách sinh viên...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar activePage="students" />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 text-white shadow-lg shadow-blue-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 text-blue-100 text-sm mb-2">
                  <span className="material-symbols-outlined text-[18px]">
                    school
                  </span>
                  Quản trị sinh viên
                </div>

                <h2 className="text-3xl font-bold tracking-tight">
                  Quản lý Học sinh - Sinh viên
                </h2>

                <p className="text-sm text-blue-100 mt-2 max-w-2xl">
                  Theo dõi hồ sơ sinh viên, lớp học, khoa, tài khoản và trạng
                  thái dữ liệu khuôn mặt phục vụ điểm danh.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={fetchStudents}
                  className="bg-white/15 hover:bg-white/25 text-white px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-semibold transition border border-white/20"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    refresh
                  </span>
                  Tải lại
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/addstudent")}
                  className="bg-white text-blue-700 px-5 py-3 rounded-2xl flex items-center gap-2 text-sm font-bold hover:bg-blue-50 transition shadow-sm"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    person_add
                  </span>
                  Thêm sinh viên
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

          <StudentStats stats={stats} />

          <StudentFilters
            searchKeyword={searchKeyword}
            setSearchKeyword={setSearchKeyword}
            selectedClass={selectedClass}
            setSelectedClass={setSelectedClass}
            selectedFaculty={selectedFaculty}
            setSelectedFaculty={setSelectedFaculty}
            selectedFaceStatus={selectedFaceStatus}
            setSelectedFaceStatus={setSelectedFaceStatus}
            classOptions={classOptions}
            facultyOptions={facultyOptions}
            onReset={handleResetFilter}
          />

          <StudentTable
            students={filteredStudents}
            totalStudents={students.length}
            getInitials={getInitials}
            getFaceBadge={getFaceBadge}
            getAccountBadge={getAccountBadge}
            onOpenFaceModal={setSelectedStudent}
          />
        </main>
      </div>

      {selectedStudent && (
        <FaceDataModal
          student={selectedStudent}
          getInitials={getInitials}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}