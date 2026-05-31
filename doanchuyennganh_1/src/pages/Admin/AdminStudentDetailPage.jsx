import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Sidebar from "../components/admin/Sidebar";
import Header from "../components/admin/Header";

const API_URL = "http://localhost:3060/api";

async function getStudentDetail(id, signal) {
  const res = await fetch(`${API_URL}/students/${id}/detail`, {
    signal,
  });

  const text = await res.text();

  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      "Backend không trả về JSON. Có thể sai API hoặc server đang trả HTML."
    );
  }

  if (!res.ok) {
    throw new Error(data.message || "Không thể tải chi tiết sinh viên");
  }

  return data;
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
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDateTime(value) {
  if (!value) return "Chưa có dữ liệu";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa có dữ liệu";
  }

  return date.toLocaleString("vi-VN");
}

function getGenderLabel(gender) {
  if (gender === "Male") return "Nam";
  if (gender === "Female") return "Nữ";
  if (gender === "Other") return "Khác";
  return "Chưa cập nhật";
}

function getStudentStatusLabel(status) {
  if (status === "ACTIVE") return "Đang học";
  if (status === "INACTIVE") return "Ngừng học";
  return "Chưa xác định";
}

function getAttendanceStatusLabel(status) {
  if (status === "PRESENT") return "Có mặt";
  if (status === "LATE") return "Đi trễ";
  if (status === "ABSENT") return "Vắng";
  return "Không rõ";
}

function getAttendanceStatusClass(status) {
  if (status === "PRESENT") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
  }

  if (status === "LATE") {
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
  }

  if (status === "ABSENT") {
    return "bg-rose-50 text-rose-700 ring-1 ring-rose-100";
  }

  return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
}

function getAvatar(student) {
  if (student?.avatar) return student.avatar;
  if (student?.face_image) return student.face_image;

  const name = encodeURIComponent(student?.full_name || "Student");

  return `https://ui-avatars.com/api/?name=${name}&background=2563eb&color=ffffff`;
}

const defaultStats = {
  total_sessions: 0,
  present_count: 0,
  late_count: 0,
  absent_count: 0,
  attendance_rate: 0,
};

export default function AdminStudentDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [stats, setStats] = useState(defaultStats);
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  const [subjectFilter, setSubjectFilter] = useState("");
  const [activeTab, setActiveTab] = useState("attendance");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadStudentDetail = async () => {
      try {
        const data = await getStudentDetail(id, controller.signal);

        setStudent(data.student || null);
        setStats(data.stats || defaultStats);
        setAttendanceHistory(
          Array.isArray(data.attendanceHistory) ? data.attendanceHistory : []
        );
      } catch (error) {
        if (error.name === "AbortError") return;

        console.error("Lỗi tải chi tiết sinh viên:", error);

        setStudent(null);
        setStats(defaultStats);
        setAttendanceHistory([]);
        setMessage(error.message || "Không thể tải chi tiết sinh viên");
      } finally {
        setLoading(false);
      }
    };

    loadStudentDetail();

    return () => {
      controller.abort();
    };
  }, [id]);

  const fetchStudentDetail = useCallback(async () => {
    try {
      setRefreshing(true);
      setMessage("");

      const data = await getStudentDetail(id);

      setStudent(data.student || null);
      setStats(data.stats || defaultStats);
      setAttendanceHistory(
        Array.isArray(data.attendanceHistory) ? data.attendanceHistory : []
      );
    } catch (error) {
      console.error("Lỗi tải lại chi tiết sinh viên:", error);

      setMessage(error.message || "Không thể tải lại chi tiết sinh viên");
    } finally {
      setRefreshing(false);
    }
  }, [id]);

  const subjects = useMemo(() => {
    const subjectNames = attendanceHistory
      .map((item) => item.subject_name)
      .filter(Boolean);

    return Array.from(new Set(subjectNames));
  }, [attendanceHistory]);

  const filteredAttendance = useMemo(() => {
    if (!subjectFilter) return attendanceHistory;

    return attendanceHistory.filter(
      (item) => item.subject_name === subjectFilter
    );
  }, [attendanceHistory, subjectFilter]);

  const attendanceRate = Number(stats.attendance_rate || 0);

  const statCards = [
    {
      title: "Tổng buổi học",
      value: Number(stats.total_sessions || 0),
      icon: "calendar_today",
      textClass: "text-slate-900",
      bgClass: "bg-slate-100 text-slate-600",
    },
    {
      title: "Có mặt",
      value: Number(stats.present_count || 0),
      icon: "check_circle",
      textClass: "text-emerald-600",
      bgClass: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Đi trễ",
      value: Number(stats.late_count || 0),
      icon: "schedule",
      textClass: "text-amber-600",
      bgClass: "bg-amber-50 text-amber-600",
    },
    {
      title: "Vắng",
      value: Number(stats.absent_count || 0),
      icon: "cancel",
      textClass: "text-rose-600",
      bgClass: "bg-rose-50 text-rose-600",
    },
  ];

  const exportCSV = () => {
    const headers = [
      "Ngay hoc",
      "Mon hoc",
      "Lop hoc phan",
      "Phong",
      "Gio check-in",
      "Trang thai",
      "Do chinh xac",
      "Ghi chu",
    ];

    const rows = filteredAttendance.map((item) => [
      formatDate(item.session_date),
      item.subject_name || "",
      item.class_code || "",
      item.room_code || "",
      formatTime(item.check_in_time),
      getAttendanceStatusLabel(item.status),
      item.confidence_score ?? "",
      item.note || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `lich-su-diem-danh-${student?.student_code || id}.csv`;
    link.click();

    URL.revokeObjectURL(url);
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
                Đang tải chi tiết sinh viên...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex">
        <Sidebar activePage="students" />

        <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
          <Header />

          <main className="flex-1 p-4 md:p-6">
            <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-sm font-bold text-red-700 flex items-start gap-3">
              <span className="material-symbols-outlined text-[22px]">
                error
              </span>

              <span>{message || "Không tìm thấy sinh viên"}</span>
            </div>

            <button
              type="button"
              onClick={() => navigate("/students")}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 transition shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">
                arrow_back
              </span>
              Quay lại danh sách
            </button>
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

                  <button
                    type="button"
                    onClick={() => navigate("/students")}
                    className="hover:text-white transition font-semibold"
                  >
                    Học sinh - sinh viên
                  </button>

                  <span className="material-symbols-outlined text-[16px]">
                    chevron_right
                  </span>

                  <span className="font-semibold text-white">Chi tiết</span>
                </div>

                <h1 className="text-3xl font-bold tracking-tight">
                  Chi tiết học sinh - sinh viên
                </h1>

                <p className="text-sm text-blue-100 mt-2 max-w-2xl">
                  Hiển thị thông tin cá nhân, dữ liệu khuôn mặt và lịch sử điểm
                  danh theo ID sinh viên.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/students")}
                  className="bg-white/15 hover:bg-white/25 text-white px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-semibold transition border border-white/20"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_back
                  </span>
                  Quay lại
                </button>

                <button
                  type="button"
                  onClick={fetchStudentDetail}
                  disabled={refreshing}
                  className="bg-white/15 hover:bg-white/25 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-semibold transition border border-white/20"
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  >
                    refresh
                  </span>
                  {refreshing ? "Đang tải..." : "Tải lại"}
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

          <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col lg:flex-row items-start lg:items-center gap-6 mb-6">
            <div className="relative shrink-0">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-3xl overflow-hidden border-4 border-white bg-slate-100 shadow-sm">
                <img
                  alt={student.full_name || "Sinh viên"}
                  className="w-full h-full object-cover"
                  src={getAvatar(student)}
                />
              </div>

              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-[22px]">
                  face
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900">
                  {student.full_name || "Chưa có tên"}
                </h2>

                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ring-1 ${
                    student.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                      : "bg-rose-50 text-rose-700 ring-rose-100"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      student.status === "ACTIVE"
                        ? "bg-emerald-600"
                        : "bg-rose-600"
                    }`}
                  />
                  {getStudentStatusLabel(student.status)}
                </span>

                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ring-1 ${
                    student.id_face
                      ? "bg-blue-50 text-blue-700 ring-blue-100"
                      : "bg-slate-100 text-slate-600 ring-slate-200"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px] mr-1">
                    face
                  </span>
                  {student.id_face ? "Đã có FaceData" : "Chưa có FaceData"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-5">
                <Info icon="badge" label="Mã SV" value={student.student_code} />
                <Info icon="class" label="Lớp" value={student.class_name} />
                <Info icon="school" label="Khoa" value={student.faculty} />
                <Info
                  icon="calendar_month"
                  label="Khóa"
                  value={student.course_year}
                />
                <Info icon="mail" label="Email" value={student.email} />
                <Info
                  icon="phone_iphone"
                  label="SĐT"
                  value={student.phone}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/editstudent/${student.id_student}`)}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 transition shadow-sm"
              title="Chỉnh sửa sinh viên"
            >
              <span className="material-symbols-outlined text-[18px]">
                edit
              </span>
              Chỉnh sửa
            </button>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
            <div className="sm:col-span-2 xl:col-span-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-5 relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-xl" />

              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-xs font-bold text-slate-400 uppercase">
                  Tỷ lệ chuyên cần
                </span>

                <span className="material-symbols-outlined text-blue-600 bg-blue-50 p-2 rounded-2xl">
                  trending_up
                </span>
              </div>

              <div className="flex items-end gap-2 relative z-10">
                <span className="text-4xl font-black text-slate-900">
                  {attendanceRate}%
                </span>
              </div>

              <p className="text-xs font-semibold text-slate-500 mt-2">
                Tính theo PRESENT + LATE
              </p>

              <div className="w-full h-2 bg-slate-100 rounded-full mt-4 overflow-hidden relative z-10">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${Math.min(attendanceRate, 100)}%` }}
                />
              </div>
            </div>

            {statCards.map((item) => (
              <div
                key={item.title}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">
                      {item.title}
                    </p>

                    <h3
                      className={`text-3xl font-black mt-1 ${item.textClass}`}
                    >
                      {item.value}
                    </h3>
                  </div>

                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.bgClass}`}
                  >
                    <span className="material-symbols-outlined">
                      {item.icon}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm px-4 pt-3">
              <div className="flex overflow-x-auto gap-2">
                <TabButton
                  active={activeTab === "attendance"}
                  icon="fact_check"
                  label="Điểm danh"
                  onClick={() => setActiveTab("attendance")}
                />

                <TabButton
                  active={activeTab === "overview"}
                  icon="person"
                  label="Tổng quan"
                  onClick={() => setActiveTab("overview")}
                />

                <TabButton
                  active={activeTab === "face"}
                  icon="face_retouching_natural"
                  label="Nhận diện khuôn mặt"
                  onClick={() => setActiveTab("face")}
                />
              </div>
            </div>

            {activeTab === "attendance" && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 md:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      Lịch sử điểm danh
                    </h3>

                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      Theo dõi trạng thái điểm danh theo từng buổi học.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative">
                      <select
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                        className="w-full sm:w-64 bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-600 px-4 py-3 outline-none appearance-none"
                      >
                        <option value="">Tất cả môn học</option>

                        {subjects.map((subject) => (
                          <option key={subject} value={subject}>
                            {subject}
                          </option>
                        ))}
                      </select>

                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        expand_more
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={exportCSV}
                      disabled={filteredAttendance.length === 0}
                      className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold px-4 py-3 rounded-2xl flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        download
                      </span>
                      Xuất CSV
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <TableHead>Ngày học</TableHead>
                        <TableHead>Môn học</TableHead>
                        <TableHead>Lớp HP</TableHead>
                        <TableHead>Phòng</TableHead>
                        <TableHead>Giờ check-in</TableHead>
                        <TableHead center>Trạng thái</TableHead>
                        <TableHead right>Độ chính xác AI</TableHead>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredAttendance.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center">
                              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                                <span className="material-symbols-outlined text-3xl">
                                  event_busy
                                </span>
                              </div>

                              <p className="text-sm font-bold text-slate-700">
                                Chưa có dữ liệu điểm danh
                              </p>

                              <p className="text-xs text-slate-500 mt-1">
                                Dữ liệu sẽ hiển thị sau khi sinh viên được điểm
                                danh.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredAttendance.map((item) => (
                          <tr
                            key={item.id_attendance}
                            className="hover:bg-blue-50/40 transition"
                          >
                            <td className="px-6 py-4 text-slate-900 font-bold">
                              {formatDate(item.session_date)}
                            </td>

                            <td className="px-6 py-4 text-slate-900">
                              <div className="font-bold">
                                {item.subject_name || "-"}
                              </div>

                              <div className="text-xs text-slate-500">
                                {item.subject_code || ""}
                              </div>
                            </td>

                            <td className="px-6 py-4 text-slate-500 font-semibold">
                              {item.class_code || "-"}
                            </td>

                            <td className="px-6 py-4 text-slate-500">
                              {item.room_code || "-"}
                              {item.room_name ? ` - ${item.room_name}` : ""}
                            </td>

                            <td className="px-6 py-4 text-slate-900 font-mono">
                              {formatTime(item.check_in_time)}
                            </td>

                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${getAttendanceStatusClass(
                                  item.status
                                )}`}
                              >
                                {getAttendanceStatusLabel(item.status)}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-right">
                              {item.confidence_score !== null &&
                              item.confidence_score !== undefined ? (
                                <div className="flex items-center justify-end gap-2">
                                  <span className="text-slate-500 font-mono text-xs">
                                    {Number(item.confidence_score).toFixed(2)}
                                  </span>

                                  <span className="material-symbols-outlined text-[16px] text-blue-500">
                                    verified_user
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-xs">
                                  -
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm font-semibold text-slate-500 bg-slate-50">
                  <span>
                    Hiển thị {filteredAttendance.length} kết quả điểm danh
                  </span>

                  <span>Tổng buổi: {Number(stats.total_sessions || 0)}</span>
                </div>
              </div>
            )}

            {activeTab === "overview" && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-xl font-black text-slate-900 mb-4">
                  Tổng quan sinh viên
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailBox label="ID sinh viên" value={student.id_student} />
                  <DetailBox label="Mã sinh viên" value={student.student_code} />
                  <DetailBox label="Họ và tên" value={student.full_name} />
                  <DetailBox
                    label="Giới tính"
                    value={getGenderLabel(student.gender)}
                  />
                  <DetailBox
                    label="Ngày sinh"
                    value={formatDate(student.date_of_birth)}
                  />
                  <DetailBox label="Email" value={student.email} />
                  <DetailBox label="Số điện thoại" value={student.phone} />
                  <DetailBox label="Khoa" value={student.faculty} />
                  <DetailBox label="Lớp" value={student.class_name} />
                  <DetailBox label="Khóa học" value={student.course_year} />
                  <DetailBox
                    label="Trạng thái học tập"
                    value={getStudentStatusLabel(student.status)}
                  />
                  <DetailBox
                    label="Tài khoản"
                    value={student.account_status || "Chưa có"}
                  />
                  <DetailBox
                    label="Ngày tạo"
                    value={formatDateTime(student.created_at)}
                  />
                  <DetailBox
                    label="Ngày cập nhật"
                    value={formatDateTime(student.updated_at)}
                  />
                </div>
              </div>
            )}

            {activeTab === "face" && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-xl font-black text-slate-900 mb-4">
                  Dữ liệu nhận diện khuôn mặt
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailBox
                    label="Trạng thái FaceData"
                    value={student.id_face ? "Đã đăng ký" : "Chưa đăng ký"}
                  />

                  <DetailBox
                    label="ID FaceData"
                    value={student.id_face || "Chưa có"}
                  />

                  <DetailBox
                    label="Phiên bản model"
                    value={student.model_version || "Chưa có"}
                  />

                  <DetailBox
                    label="Ngày tạo FaceData"
                    value={formatDateTime(student.face_created_at)}
                  />

                  <DetailBox
                    label="Ảnh khuôn mặt"
                    value={student.face_image || "Chưa có"}
                  />
                </div>

                <div className="mt-6 bg-blue-50 border border-blue-100 rounded-3xl p-5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-3xl">
                      face_retouching_natural
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-slate-900">
                      Ghi chú
                    </h4>

                    <p className="text-sm text-slate-600 mt-1">
                      Dữ liệu khuôn mặt được lấy từ bảng FaceData. Nếu sinh viên
                      chưa có FaceData, hệ thống sẽ hiển thị trạng thái chưa
                      đăng ký.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function Info({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-100 p-3">
      <span className="material-symbols-outlined text-[20px] text-blue-600">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-400 uppercase">{label}</p>
        <p className="text-sm font-bold text-slate-800 truncate">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

function TabButton({ active, icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-sm font-bold py-3 px-4 border-b-2 rounded-t-2xl flex items-center gap-2 transition whitespace-nowrap ${
        active
          ? "text-blue-600 border-blue-600 bg-blue-50"
          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-transparent"
      }`}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      {label}
    </button>
  );
}

function TableHead({ children, center = false, right = false }) {
  return (
    <th
      className={`text-xs font-black text-slate-500 uppercase tracking-wide px-6 py-4 ${
        center ? "text-center" : right ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}

function DetailBox({ label, value }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
      <p className="text-xs font-bold text-slate-400 uppercase">{label}</p>

      <p className="text-sm font-black text-slate-900 mt-1 break-all">
        {value || "Chưa có dữ liệu"}
      </p>
    </div>
  );
}