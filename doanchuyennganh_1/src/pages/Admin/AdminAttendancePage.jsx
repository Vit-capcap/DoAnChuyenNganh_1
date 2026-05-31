import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/admin/Sidebar";
import Header from "../components/admin/Header";

import AttendanceStats from "../components/admin/AttendanceStats";
import AttendanceFilters from "../components/admin/AttendanceFilters";
import AttendanceTable from "../components/admin/AttendanceTable";
import ManualAttendanceModal from "../components/admin/ManualAttendanceModal";
import EditAttendanceModal from "../components/admin/EditAttendanceModal";

import {
  getAttendanceOptions,
  getAttendances,
  searchAttendanceStudents,
  createManualAttendance,
  updateAttendance,
  deleteAttendanceById,
} from "../../api/attendanceApi";

const initialManualForm = {
  id_session: "",
  id_student: "",
  status: "PRESENT",
  check_in_time: "",
  confidence_score: "",
  note: "",
};

const attendanceLabels = {
  PRESENT: "Có mặt",
  LATE: "Đi trễ",
  ABSENT: "Vắng mặt",
};

const statusClass = {
  PRESENT: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  LATE: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  ABSENT: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
};

function getTodayInput() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("vi-VN");
}

function formatTime(value) {
  if (!value) return "--:--";

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return String(value).slice(0, 5);
}

function getStudentImage(item) {
  if (item.face_image) return item.face_image;
  if (item.avatar) return item.avatar;

  const name = encodeURIComponent(item.full_name || "Student");
  return `https://ui-avatars.com/api/?name=${name}&background=2563eb&color=ffffff`;
}

function getPercent(part, total) {
  const totalNumber = Number(total || 0);

  if (totalNumber === 0) return "0%";

  return `${((Number(part || 0) / totalNumber) * 100).toFixed(1)}%`;
}

export default function AdminAttendancePage() {
  const navigate = useNavigate();

  const [attendances, setAttendances] = useState([]);

  const [stats, setStats] = useState({
    total_attendance: 0,
    present_count: 0,
    late_count: 0,
    absent_count: 0,
    attendance_rate: 0,
  });

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState(getTodayInput());

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState(initialManualForm);
  const [studentSearch, setStudentSearch] = useState("");

  const [editingAttendance, setEditingAttendance] = useState(null);
  const [editForm, setEditForm] = useState({
    status: "PRESENT",
    check_in_time: "",
    confidence_score: "",
    note: "",
  });

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadOptions = async () => {
      try {
        const data = await getAttendanceOptions();

        if (!isMounted) return;

        setClasses(Array.isArray(data.classes) ? data.classes : []);
        setSubjects(Array.isArray(data.subjects) ? data.subjects : []);
        setSessions(Array.isArray(data.sessions) ? data.sessions : []);
      } catch (error) {
        console.error("Lỗi tải options:", error);

        if (isMounted) {
          setMessage(error.message || "Không thể tải dữ liệu bộ lọc");
        }
      }
    };

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadAttendances = async () => {
      try {
        const data = await getAttendances({
          search,
          class_name: classFilter,
          id_subject: subjectFilter,
          status: statusFilter,
          date: dateFilter,
          page,
          limit: 10,
        });

        if (!isMounted) return;

        setAttendances(
          Array.isArray(data.attendances) ? data.attendances : []
        );
        setStats(data.stats || {});
        setPagination(
          data.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 1,
          }
        );
        setMessage("");
      } catch (error) {
        console.error("Lỗi tải điểm danh:", error);

        if (isMounted) {
          setMessage(error.message || "Không thể tải danh sách điểm danh");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      loadAttendances();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [
    search,
    classFilter,
    subjectFilter,
    statusFilter,
    dateFilter,
    page,
    refreshKey,
  ]);

  useEffect(() => {
    let isMounted = true;

    const searchStudents = async () => {
      try {
        const data = await searchAttendanceStudents(studentSearch);

        if (isMounted) {
          setStudents(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Lỗi tìm sinh viên:", error);
      }
    };

    if (showManualModal) {
      const timeoutId = setTimeout(() => {
        searchStudents();
      }, 300);

      return () => {
        isMounted = false;
        clearTimeout(timeoutId);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [studentSearch, showManualModal]);

  const statCards = useMemo(() => {
    const total = Number(stats.total_attendance || 0);
    const present = Number(stats.present_count || 0);
    const late = Number(stats.late_count || 0);
    const absent = Number(stats.absent_count || 0);
    const rate = Number(stats.attendance_rate || 0);

    return [
      {
        title: "Tổng lượt điểm danh",
        value: total,
        icon: "groups",
        textClass: "text-slate-900",
        bgClass: "bg-blue-50 text-blue-600",
      },
      {
        title: "Có mặt",
        value: present,
        sub: getPercent(present, total),
        icon: "check_circle",
        textClass: "text-emerald-600",
        bgClass: "bg-emerald-50 text-emerald-600",
      },
      {
        title: "Đi trễ",
        value: late,
        sub: getPercent(late, total),
        icon: "schedule",
        textClass: "text-amber-600",
        bgClass: "bg-amber-50 text-amber-600",
      },
      {
        title: "Vắng mặt",
        value: absent,
        sub: getPercent(absent, total),
        icon: "cancel",
        textClass: "text-rose-600",
        bgClass: "bg-rose-50 text-rose-600",
      },
      {
        title: "Tỷ lệ chuyên cần",
        value: `${rate}%`,
        progress: `${Math.min(rate, 100)}%`,
        icon: "trending_up",
        textClass: "text-indigo-600",
        bgClass: "bg-indigo-50 text-indigo-600",
      },
    ];
  }, [stats]);

  const resetFilters = () => {
    setSearch("");
    setClassFilter("");
    setSubjectFilter("");
    setStatusFilter("");
    setDateFilter(getTodayInput());
    setPage(1);
  };

  const exportCSV = () => {
    const headers = [
      "Ma SV",
      "Ho ten",
      "Lop",
      "Mon hoc",
      "Phong",
      "Ngay",
      "Check-in",
      "Trang thai",
      "AI Accuracy",
      "Ghi chu",
    ];

    const rows = attendances.map((item) => [
      item.student_code || "",
      item.full_name || "",
      item.class_name || "",
      item.subject_name || "",
      item.room_code || "",
      formatDate(item.session_date),
      formatTime(item.check_in_time),
      attendanceLabels[item.status] || item.status,
      item.confidence_score ?? "",
      item.note || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `diem-danh-${dateFilter || "all"}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const openManualModal = () => {
    setManualForm(initialManualForm);
    setStudentSearch("");
    setShowManualModal(true);
    setMessage("");
  };

  const closeManualModal = () => {
    setShowManualModal(false);
    setManualForm(initialManualForm);
  };

  const handleManualChange = (e) => {
    const { name, value } = e.target;

    setManualForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitManualAttendance = async (e) => {
    e.preventDefault();

    if (!manualForm.id_session || !manualForm.id_student || !manualForm.status) {
      setMessage("Vui lòng chọn buổi học, sinh viên và trạng thái");
      return;
    }

    try {
      const payload = {
        ...manualForm,
        id_session: Number(manualForm.id_session),
        id_student: Number(manualForm.id_student),
        confidence_score: manualForm.confidence_score
          ? Number(manualForm.confidence_score)
          : null,
      };

      await createManualAttendance(payload);

      alert("Điểm danh thủ công thành công");
      closeManualModal();
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Lỗi điểm danh thủ công:", error);
      setMessage(error.message || "Điểm danh thủ công thất bại");
    }
  };

  const openEditModal = (item) => {
    setEditingAttendance(item);

    setEditForm({
      status: item.status || "PRESENT",
      check_in_time: item.check_in_time
        ? String(item.check_in_time).slice(0, 16)
        : "",
      confidence_score:
        item.confidence_score !== null && item.confidence_score !== undefined
          ? item.confidence_score
          : "",
      note: item.note || "",
    });
  };

  const closeEditModal = () => {
    setEditingAttendance(null);

    setEditForm({
      status: "PRESENT",
      check_in_time: "",
      confidence_score: "",
      note: "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitEditAttendance = async (e) => {
    e.preventDefault();

    if (!editingAttendance) return;

    try {
      const payload = {
        status: editForm.status,
        check_in_time: editForm.check_in_time || null,
        confidence_score: editForm.confidence_score
          ? Number(editForm.confidence_score)
          : null,
        note: editForm.note || null,
      };

      await updateAttendance(editingAttendance.id_attendance, payload);

      alert("Cập nhật điểm danh thành công");
      closeEditModal();
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Lỗi cập nhật điểm danh:", error);
      setMessage(error.message || "Cập nhật điểm danh thất bại");
    }
  };

  const deleteAttendance = async (item) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa bản ghi điểm danh của ${item.full_name} không?`
    );

    if (!confirmDelete) return;

    try {
      await deleteAttendanceById(item.id_attendance);

      alert("Xóa điểm danh thành công");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Lỗi xóa điểm danh:", error);
      setMessage(error.message || "Xóa điểm danh thất bại");
    }
  };

  const goToStudentDetail = (item) => {
    navigate(`/studentdetail/${item.id_student}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
    
      <Sidebar activePage="attendance" />

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

                  <span className="font-semibold text-white">
                    Quản lý điểm danh
                  </span>
                </div>

                <h2 className="text-3xl font-bold tracking-tight">
                  Quản lý điểm danh
                </h2>

                <p className="text-sm text-blue-100 mt-2 max-w-2xl">
                  Theo dõi, lọc, cập nhật và xuất dữ liệu điểm danh từ MySQL.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={exportCSV}
                  disabled={attendances.length === 0}
                  className="bg-white/15 hover:bg-white/25 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-semibold transition border border-white/20"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    download
                  </span>
                  Xuất dữ liệu
                </button>

                <button
                  type="button"
                  onClick={openManualModal}
                  className="bg-white text-blue-700 px-5 py-3 rounded-2xl flex items-center gap-2 text-sm font-bold hover:bg-blue-50 transition shadow-sm"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    add_circle
                  </span>
                  Điểm danh thủ công
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

          <AttendanceStats statCards={statCards} />

          <AttendanceFilters
            search={search}
            setSearch={setSearch}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            classFilter={classFilter}
            setClassFilter={setClassFilter}
            subjectFilter={subjectFilter}
            setSubjectFilter={setSubjectFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            classes={classes}
            subjects={subjects}
            onReset={resetFilters}
            onPageReset={() => setPage(1)}
          />

          <AttendanceTable
            attendances={attendances}
            loading={loading}
            pagination={pagination}
            page={page}
            setPage={setPage}
            attendanceLabels={attendanceLabels}
            statusClass={statusClass}
            formatDate={formatDate}
            formatTime={formatTime}
            getStudentImage={getStudentImage}
            onEdit={openEditModal}
            onDelete={deleteAttendance}
            onViewStudent={goToStudentDetail}
          />

          {showManualModal && (
            <ManualAttendanceModal
              formData={manualForm}
              sessions={sessions}
              students={students}
              studentSearch={studentSearch}
              onStudentSearch={setStudentSearch}
              onChange={handleManualChange}
              onClose={closeManualModal}
              onSubmit={submitManualAttendance}
            />
          )}

          {editingAttendance && (
            <EditAttendanceModal
              item={editingAttendance}
              formData={editForm}
              onChange={handleEditChange}
              onClose={closeEditModal}
              onSubmit={submitEditAttendance}
            />
          )}
        </main>
      </div>
    </div>
  );
}