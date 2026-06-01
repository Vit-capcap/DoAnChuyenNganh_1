import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/teacher/Sidebar";
import Header from "../components/teacher/Header";

import {
  createTeacherSession,
  getTeacherSessions,
} from "../../api/teacherApi";

function getTeacherId() {
  try {
    const account = JSON.parse(localStorage.getItem("account") || "{}");
    const teacher = JSON.parse(localStorage.getItem("teacher") || "{}");

    return (
      account?.teacher_id ||
      account?.id_teacher ||
      account?.teacherId ||
      teacher?.id_teacher ||
      teacher?.teacher_id ||
      localStorage.getItem("teacherId") ||
      null
    );
  } catch {
    return localStorage.getItem("teacherId") || null;
  }
}

function getTeacherInfo() {
  try {
    const account = JSON.parse(localStorage.getItem("account") || "{}");
    const teacher = JSON.parse(localStorage.getItem("teacher") || "{}");

    return {
      ...account,
      ...teacher,
      full_name:
        teacher?.full_name ||
        account?.teacher_name ||
        account?.full_name ||
        "Giảng viên",
      email: teacher?.email || account?.teacher_email || account?.email || "",
      avatar: teacher?.avatar || account?.teacher_avatar || account?.avatar || "",
    };
  } catch {
    return {
      full_name: "Giảng viên",
      email: "",
      avatar: "",
    };
  }
}

function getTodayValue() {
  return new Date().toISOString().slice(0, 10);
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatDate(value) {
  if (!value) return "Chưa có ngày";

  try {
    return new Date(value).toLocaleDateString("vi-VN");
  } catch {
    return value;
  }
}

function formatDateInput(value) {
  if (!value) return "";

  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return String(value).slice(0, 10);
  }
}

function formatTime(value) {
  if (!value) return "--:--";

  return String(value).slice(0, 5);
}

function getSessionStatus(status, idSession) {
  const normalizedStatus = String(status || "NOT_STARTED").toUpperCase();

  if (!idSession) {
    return {
      key: "NOT_CREATED",
      text: "Chưa tạo buổi",
      className: "bg-slate-100 text-slate-600 border border-slate-200",
      dotClass: "bg-slate-400",
    };
  }

  if (normalizedStatus === "ONGOING") {
    return {
      key: "ONGOING",
      text: "Đang diễn ra",
      className: "bg-blue-100 text-blue-700 border border-blue-200",
      dotClass: "bg-blue-500 animate-pulse",
    };
  }

  if (normalizedStatus === "FINISHED") {
    return {
      key: "FINISHED",
      text: "Đã điểm danh",
      className: "bg-emerald-100 text-emerald-700 border border-emerald-200",
      dotClass: "bg-emerald-500",
    };
  }

  return {
    key: "NOT_STARTED",
    text: "Chưa diễn ra",
    className: "bg-amber-100 text-amber-700 border border-amber-200",
    dotClass: "bg-amber-500",
  };
}

function normalizeSession(item = {}) {
  const presentStudents = safeNumber(
    item.present_students || item.presentStudents || item.present_count
  );

  const lateStudents = safeNumber(
    item.late_students || item.lateStudents || item.late_count
  );

  const absentStudents = safeNumber(
    item.absent_students || item.absentStudents || item.absent_count
  );

  const totalStudents = safeNumber(
    item.total_students || item.totalStudents || item.student_count
  );

  const attendedStudents = safeNumber(
    item.attended_students ||
      item.attendedStudents ||
      presentStudents + lateStudents
  );

  const attendancePercent =
    totalStudents > 0 ? (attendedStudents / totalStudents) * 100 : 0;

  return {
    idSchedule: item.id_schedule || item.schedule_id || "",
    idSession: item.id_session || item.session_id || "",
    idCourseClass: item.id_course_class || item.course_class_id || "",
    classCode: item.class_code || item.classCode || "Chưa có lớp",
    subjectName: item.subject_name || item.subjectName || "Chưa có môn học",
    subjectCode: item.subject_code || item.subjectCode || "",
    roomName:
      item.room_name ||
      item.roomName ||
      item.room_code ||
      item.roomCode ||
      "Chưa có phòng",
    roomCode: item.room_code || item.roomCode || "",
    sessionDate:
      formatDateInput(item.session_date || item.sessionDate) || getTodayValue(),
    scheduleDate: formatDateInput(item.schedule_date || item.scheduleDate),
    startDate: formatDateInput(item.start_date || item.startDate),
    endDate: formatDateInput(item.end_date || item.endDate),
    dayOfWeek: item.day_of_week || item.dayOfWeek || "",
    startTime: item.start_time || item.startTime || "",
    endTime: item.end_time || item.endTime || "",
    sessionNumber: safeNumber(item.session_number || item.sessionNumber || 1),
    sessionStatus:
      item.session_status || item.sessionStatus || item.status || "NOT_STARTED",
    totalStudents,
    attendedStudents,
    presentStudents,
    lateStudents,
    absentStudents,
    attendancePercent,
  };
}

function StatCard({ icon, title, value, tag, iconClass }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <span className="material-symbols-outlined text-[24px]">{icon}</span>
        </div>

        <p className="text-2xl font-black text-slate-900">{value}</p>
      </div>

      <p className="text-sm font-bold text-slate-600">{title}</p>
      <p className="mt-1 text-xs font-semibold text-slate-400">{tag}</p>
    </div>
  );
}

function SessionFilters({
  search,
  classCode,
  subject,
  date,
  status,
  classOptions,
  subjectOptions,
  onSearchChange,
  onClassChange,
  onSubjectChange,
  onDateChange,
  onStatusChange,
  onClearDate,
}) {
  return (
    <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto]">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>

          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm môn học, mã lớp, phòng học..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          />
        </div>

        <select
          value={classCode}
          onChange={(event) => onClassChange(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
        >
          <option value="all">Tất cả lớp</option>
          {classOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={subject}
          onChange={(event) => onSubjectChange(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
        >
          <option value="all">Tất cả môn</option>
          {subjectOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
        />

        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="NOT_CREATED">Chưa tạo buổi</option>
          <option value="NOT_STARTED">Chưa diễn ra</option>
          <option value="ONGOING">Đang diễn ra</option>
          <option value="FINISHED">Đã điểm danh</option>
        </select>

        <button
          type="button"
          onClick={onClearDate}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
        >
          Tất cả ngày
        </button>
      </div>
    </div>
  );
}

function SessionTable({
  sessions = [],
  creatingId,
  onCreateSession,
  onOpenAttendance,
  onViewReport,
  onViewClass,
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-6 py-4 font-bold">Ngày / Thời gian</th>
              <th className="px-6 py-4 font-bold">Môn học & Lớp</th>
              <th className="px-6 py-4 font-bold">Phòng học</th>
              <th className="px-6 py-4 font-bold">Trạng thái</th>
              <th className="px-6 py-4 font-bold">Điểm danh</th>
              <th className="px-6 py-4 text-right font-bold">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {sessions.map((item) => {
              const status = getSessionStatus(item.sessionStatus, item.idSession);
              const rowKey = `${item.idSchedule}-${item.idSession || "empty"}`;
              const isCreating = creatingId === rowKey;

              return (
                <tr
                  key={rowKey}
                  className="group border-t border-slate-100 transition hover:bg-blue-50/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-800">
                        {formatDate(item.sessionDate)}
                      </span>

                      <span className="mt-1 text-xs font-semibold text-slate-400">
                        {formatTime(item.startTime)} - {formatTime(item.endTime)}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => onViewClass(item)}
                      className="text-left"
                    >
                      <span className="block text-sm font-black text-slate-800 transition hover:text-blue-700">
                        {item.subjectName}
                      </span>

                      <span className="mt-1 block text-xs font-semibold text-slate-400">
                        {item.subjectCode || "N/A"} • {item.classCode}
                      </span>
                    </button>
                  </td>

                  <td className="px-6 py-4 text-sm font-bold text-slate-600">
                    {item.roomName}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${status.className}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`}
                      />
                      {status.text}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {item.idSession ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1" title="Có mặt">
                            <span className="material-symbols-outlined text-[16px] text-emerald-600">
                              how_to_reg
                            </span>
                            <span className="text-sm font-bold text-slate-700">
                              {item.presentStudents + item.lateStudents}
                            </span>
                          </div>

                          <div className="flex items-center gap-1" title="Vắng">
                            <span className="material-symbols-outlined text-[16px] text-red-600">
                              person_off
                            </span>
                            <span className="text-sm font-bold text-slate-700">
                              {item.absentStudents}
                            </span>
                          </div>

                          <div className="flex items-center gap-1" title="Trễ">
                            <span className="material-symbols-outlined text-[16px] text-amber-500">
                              schedule
                            </span>
                            <span className="text-sm font-bold text-slate-700">
                              {item.lateStudents}
                            </span>
                          </div>

                          <span className="ml-1 text-xs font-semibold text-slate-400">
                            / {item.totalStudents}
                          </span>
                        </div>

                        <div className="h-2 w-36 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{
                              width: `${Math.min(
                                Math.max(item.attendancePercent, 0),
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold italic text-slate-400">
                        Chưa có dữ liệu
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!item.idSession ? (
                        <button
                          type="button"
                          onClick={() => onCreateSession(item)}
                          disabled={isCreating}
                          className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isCreating ? "Đang tạo..." : "Tạo buổi"}
                        </button>
                      ) : item.sessionStatus === "FINISHED" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onViewReport(item)}
                            className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                          >
                            Xem kết quả
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenAttendance(item)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100"
                            title="Xem điểm danh"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              visibility
                            </span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpenAttendance(item)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            fact_check
                          </span>
                          Điểm danh
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
      <div className="flex min-h-[260px] flex-col items-center justify-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

        <p className="text-sm font-semibold text-slate-600">
          Đang tải danh sách buổi học...
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
        <span className="material-symbols-outlined text-[34px]">
          event_busy
        </span>
      </div>

      <h2 className="text-xl font-bold text-slate-900">Không có buổi học</h2>

      <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-slate-500">
        Không tìm thấy buổi học nào phù hợp với bộ lọc hiện tại.
      </p>
    </div>
  );
}

export default function TeacherSessions() {
  const navigate = useNavigate();

  const teacherId = useMemo(() => getTeacherId(), []);
  const teacher = useMemo(() => getTeacherInfo(), []);

  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState("");
  const [classCode, setClassCode] = useState("all");
  const [subject, setSubject] = useState("all");
  const [date, setDate] = useState(getTodayValue());
  const [status, setStatus] = useState("all");
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadSessions() {
      if (!teacherId) {
        if (isMounted) {
          setSessions([]);
          setMessage(
            "Không tìm thấy teacherId. Vui lòng đăng nhập lại bằng tài khoản giáo viên."
          );
          setLoading(false);
        }

        return;
      }

      try {
        setLoading(true);
        setMessage("");

        const data = await getTeacherSessions(teacherId, {
          date,
          classCode,
          subject,
          status,
          search,
        });

        if (!isMounted) return;

        const rawSessions = data?.sessions || data?.data || [];
        setSessions(rawSessions.map(normalizeSession));
      } catch (error) {
        console.error("Lỗi tải danh sách buổi học:", error);

        if (isMounted) {
          setSessions([]);
          setMessage(error.message || "Không thể tải danh sách buổi học.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    const timeoutId = setTimeout(loadSessions, 250);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [teacherId, date, classCode, subject, status, search, refreshKey]);

  const classOptions = useMemo(() => {
    return Array.from(new Set(sessions.map((item) => item.classCode))).filter(
      Boolean
    );
  }, [sessions]);

  const subjectOptions = useMemo(() => {
    return Array.from(new Set(sessions.map((item) => item.subjectName))).filter(
      Boolean
    );
  }, [sessions]);

  const stats = useMemo(() => {
    const total = sessions.length;

    const ongoing = sessions.filter(
      (item) => item.idSession && item.sessionStatus === "ONGOING"
    ).length;

    const finished = sessions.filter(
      (item) => item.idSession && item.sessionStatus === "FINISHED"
    ).length;

    const notCreated = sessions.filter((item) => !item.idSession).length;

    const notStarted = sessions.filter(
      (item) => item.idSession && item.sessionStatus === "NOT_STARTED"
    ).length;

    const absentTotal = sessions.reduce(
      (sum, item) => sum + safeNumber(item.absentStudents),
      0
    );

    return {
      total,
      ongoing,
      finished,
      notCreated,
      notStarted,
      absentTotal,
    };
  }, [sessions]);

  const handleRefresh = () => {
    setLoading(true);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCreateSession = async (item) => {
    if (!item.idSchedule) {
      setMessage("Lịch học này thiếu id_schedule, không thể tạo buổi học.");
      return;
    }

    const rowKey = `${item.idSchedule}-${item.idSession || "empty"}`;

    try {
      setCreatingId(rowKey);
      setMessage("");
      setSuccessMessage("");

      const payload = {
        id_schedule: item.idSchedule,
        session_date: item.sessionDate || date || getTodayValue(),
        session_number: item.sessionNumber || 1,
      };

      const data = await createTeacherSession(payload);
      const createdSession =
        data?.session || data?.data || data?.createdSession || null;

      setSuccessMessage("Tạo buổi học thành công.");

      if (createdSession?.id_session) {
        navigate(`/teacher/attendance/${createdSession.id_session}`);
        return;
      }

      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Lỗi tạo buổi học:", error);
      setMessage(error.message || "Không thể tạo buổi học.");
    } finally {
      setCreatingId("");
    }
  };

  const handleOpenAttendance = async (item) => {
    if (!item.idSession) {
      await handleCreateSession(item);
      return;
    }

    navigate(`/teacher/attendance/${item.idSession}`, {
      state: {
        session: item,
      },
    });
  };

  const handleViewReport = (item) => {
    if (!item.idSession) {
      setMessage("Buổi học chưa được tạo nên chưa có báo cáo.");
      return;
    }

    navigate(`/teacher/attendance/report/${item.idSession}`, {
      state: {
        session: item,
      },
    });
  };

  const handleViewClass = (item) => {
    if (!item.idCourseClass) return;

    navigate(`/teacher/classes/${item.idCourseClass}`, {
      state: {
        classData: {
          id_course_class: item.idCourseClass,
          class_code: item.classCode,
          subject_name: item.subjectName,
          subject_code: item.subjectCode,
          room_name: item.roomName,
        },
      },
    });
  };

  const handleExportCsv = () => {
    const rows = [
      [
        "Ngày học",
        "Thời gian",
        "Mã lớp",
        "Môn học",
        "Phòng",
        "Trạng thái",
        "Tổng SV",
        "Có mặt",
        "Đi trễ",
        "Vắng",
        "Tỷ lệ",
      ],
      ...sessions.map((item) => {
        const statusInfo = getSessionStatus(item.sessionStatus, item.idSession);

        return [
          formatDate(item.sessionDate),
          `${formatTime(item.startTime)} - ${formatTime(item.endTime)}`,
          item.classCode,
          item.subjectName,
          item.roomName,
          statusInfo.text,
          item.totalStudents,
          item.presentStudents,
          item.lateStudents,
          item.absentStudents,
          `${item.attendancePercent.toFixed(2)}%`,
        ];
      }),
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `teacher-sessions-${teacherId}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar activePage="sessions" />

      <div className="flex min-h-screen flex-1 flex-col md:ml-[280px]">
        <Header teacher={teacher} />

        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 text-white shadow-lg shadow-blue-100">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm text-blue-100">
                  <button
                    type="button"
                    onClick={() => navigate("/teacher/dashboard")}
                    className="font-semibold transition hover:text-white"
                  >
                    Trang chủ
                  </button>

                  <span className="material-symbols-outlined text-[18px]">
                    chevron_right
                  </span>

                  <span>Buổi học</span>
                </div>

                <h2 className="text-3xl font-bold tracking-tight">
                  Buổi học của tôi
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-blue-100">
                  Quản lý các buổi học, tạo buổi điểm danh từ lịch học, theo dõi
                  trạng thái điểm danh và mở nhanh trang điểm danh.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    refresh
                  </span>
                  Tải lại
                </button>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    download
                  </span>
                  Xuất CSV
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/teacher/schedule")}
                  className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/25"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    calendar_today
                  </span>
                  Lịch dạy
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/teacher/classes")}
                  className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    groups
                  </span>
                  Lớp học
                </button>
              </div>
            </div>
          </div>

          {message && (
            <div className="mb-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              <span className="material-symbols-outlined text-[20px]">
                error
              </span>
              <span>{message}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              <span className="material-symbols-outlined text-[20px]">
                check_circle
              </span>
              <span>{successMessage}</span>
            </div>
          )}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <StatCard
              icon="event_note"
              title="Tổng buổi"
              value={stats.total}
              tag="Schedule / Session"
              iconClass="bg-blue-50 text-blue-600"
            />

            <StatCard
              icon="pending_actions"
              title="Chưa tạo"
              value={stats.notCreated}
              tag="NOT_CREATED"
              iconClass="bg-slate-100 text-slate-600"
            />

            <StatCard
              icon="schedule"
              title="Chưa diễn ra"
              value={stats.notStarted}
              tag="NOT_STARTED"
              iconClass="bg-amber-50 text-amber-600"
            />

            <StatCard
              icon="play_circle"
              title="Đang diễn ra"
              value={stats.ongoing}
              tag="ONGOING"
              iconClass="bg-cyan-50 text-cyan-600"
            />

            <StatCard
              icon="done_all"
              title="Đã điểm danh"
              value={stats.finished}
              tag="FINISHED"
              iconClass="bg-emerald-50 text-emerald-600"
            />

            <StatCard
              icon="person_off"
              title="Lượt vắng"
              value={stats.absentTotal}
              tag="ABSENT"
              iconClass="bg-red-50 text-red-600"
            />
          </div>

          <SessionFilters
            search={search}
            classCode={classCode}
            subject={subject}
            date={date}
            status={status}
            classOptions={classOptions}
            subjectOptions={subjectOptions}
            onSearchChange={setSearch}
            onClassChange={setClassCode}
            onSubjectChange={setSubject}
            onDateChange={setDate}
            onStatusChange={setStatus}
            onClearDate={() => setDate("")}
          />

          {loading ? (
            <LoadingState />
          ) : sessions.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <SessionTable
                sessions={sessions}
                creatingId={creatingId}
                onCreateSession={handleCreateSession}
                onOpenAttendance={handleOpenAttendance}
                onViewReport={handleViewReport}
                onViewClass={handleViewClass}
              />

              <div className="mt-5 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Hiển thị{" "}
                  <span className="font-bold text-slate-800">
                    {sessions.length}
                  </span>{" "}
                  buổi học theo bộ lọc hiện tại
                </span>

                <span>
                  Ngày lọc:{" "}
                  <span className="font-bold text-slate-800">
                    {date ? formatDate(date) : "Tất cả ngày"}
                  </span>
                </span>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}