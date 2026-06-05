import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/student/Sidebar";
import Header from "../components/student/Header";

import { getStudentDashboard } from "../../api/studentApi";

function getStudentId() {
  try {
    const account = JSON.parse(localStorage.getItem("account") || "{}");
    const student = JSON.parse(localStorage.getItem("student") || "{}");

    return (
      account?.student_id ||
      account?.id_student ||
      student?.id_student ||
      localStorage.getItem("studentId") ||
      null
    );
  } catch {
    return localStorage.getItem("studentId") || null;
  }
}

function formatTime(value) {
  if (!value) return "--:--";
  return String(value).slice(0, 5);
}

function formatDate(value) {
  if (!value) return "--/--/----";

  try {
    return new Date(value).toLocaleDateString("vi-VN");
  } catch {
    return value;
  }
}

function formatDateTime(value) {
  if (!value) return "";

  try {
    return new Date(value).toLocaleString("vi-VN");
  } catch {
    return value;
  }
}

function getStatusLabel(status) {
  if (status === "PRESENT") {
    return {
      text: "Có mặt",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
      icon: "check_circle",
    };
  }

  if (status === "LATE") {
    return {
      text: "Đi muộn",
      className:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
      icon: "schedule",
    };
  }

  return {
    text: "Vắng",
    className:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300",
    icon: "cancel",
  };
}

function AttendanceRateCard({ percent = 0 }) {
  const safePercent = Math.max(0, Math.min(100, Number(percent || 0)));
  const dash = `${safePercent}, 100`;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col items-center justify-center">
        <div className="relative h-40 w-40">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              className="text-slate-100 dark:text-slate-800"
            />

            <path
              d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeDasharray={dash}
              strokeLinecap="round"
              className="text-blue-600 dark:text-blue-400"
            />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {safePercent.toFixed(0)}%
            </span>
          </div>
        </div>

        <p className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-200">
          Tỷ lệ chuyên cần học kỳ
        </p>

        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          Tính từ bảng attendance
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon, value, title, tag, iconClass }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <span className="material-symbols-outlined text-[24px]">
            {icon}
          </span>
        </div>

        <p className="text-2xl font-bold text-slate-900 dark:text-white">
          {value}
        </p>
      </div>

      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
        {title}
      </p>

      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
        {tag}
      </p>
    </div>
  );
}

function WeeklyAttendanceChart({ data = [] }) {
  const chartData = data.length
    ? data
    : [
        { label: "T2", attendancePercent: 0 },
        { label: "T3", attendancePercent: 0 },
        { label: "T4", attendancePercent: 0 },
        { label: "T5", attendancePercent: 0 },
        { label: "T6", attendancePercent: 0 },
        { label: "T7", attendancePercent: 0 },
        { label: "CN", attendancePercent: 0 },
      ];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Xu hướng điểm danh theo tuần
          </h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tỷ lệ có mặt trong 7 ngày gần nhất
          </p>
        </div>
      </div>

      <div className="flex h-[300px] items-end justify-around gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
        {chartData.map((item, index) => {
          const percent = Math.max(
            0,
            Math.min(100, Number(item.attendancePercent || 0))
          );

          return (
            <div
              key={`${item.label}-${index}`}
              className="flex h-full flex-1 flex-col items-center justify-end gap-3"
            >
              <div className="flex h-full w-full items-end justify-center">
                <div
                  className="w-full max-w-[46px] rounded-t-2xl bg-gradient-to-t from-blue-700 to-sky-400 shadow-sm transition"
                  style={{ height: `${percent}%` }}
                />
              </div>

              <div className="text-center">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {item.label}
                </p>

                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {percent.toFixed(0)}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuickActions({ onAction }) {
  const actions = [
    {
      icon: "face_retouching_natural",
      title: "Đăng ký khuôn mặt",
      description: "Cập nhật dữ liệu nhận diện",
      path: "/student/face-registration",
      primary: true,
    },
    {
      icon: "calendar_month",
      title: "Xem lịch học",
      description: "Theo dõi lịch học trong tuần",
      path: "/student/schedule",
    },
    {
      icon: "history",
      title: "Lịch sử điểm danh",
      description: "Xem chi tiết từng buổi học",
      path: "/student/attendance-history",
    },
    {
      icon: "download",
      title: "Tải báo cáo",
      description: "Xuất báo cáo điểm danh",
      path: "download",
    },
  ];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-5 text-lg font-bold text-slate-900 dark:text-white">
        Thao tác nhanh
      </h3>

      <div className="space-y-3">
        {actions.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => onAction(item.path)}
            className={`flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left transition ${
              item.primary
                ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[24px]">
                {item.icon}
              </span>

              <div>
                <p className="text-sm font-bold">{item.title}</p>

                <p
                  className={`text-xs ${
                    item.primary
                      ? "text-blue-100"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {item.description}
                </p>
              </div>
            </div>

            <span className="material-symbols-outlined text-[22px]">
              arrow_forward
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function UpcomingClasses({ data = [], onViewAll }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Lớp học sắp tới
          </h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Các buổi học gần nhất của bạn
          </p>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Xem tất cả
        </button>
      </div>

      {data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-950">
          <span className="material-symbols-outlined text-[40px] text-slate-400">
            event_busy
          </span>

          <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            Chưa có lịch học sắp tới
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((item) => (
            <div
              key={`${item.id_schedule}-${item.session_date || item.start_time}`}
              className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 transition hover:bg-white hover:shadow-sm dark:bg-slate-950 dark:hover:bg-slate-800"
            >
              <div className="min-w-[76px] rounded-2xl bg-blue-50 px-3 py-3 text-center text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <p className="text-sm font-bold">
                  {formatTime(item.start_time)}
                </p>

                <p className="text-xs font-semibold text-blue-400">
                  {formatTime(item.end_time)}
                </p>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                  {item.subject_name || "Chưa có môn học"}
                </p>

                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">
                      meeting_room
                    </span>
                    {item.room_name || item.room_code || "Chưa có phòng"}
                  </span>

                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">
                      calendar_today
                    </span>
                    {formatDate(item.session_date || item.start_date)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationsPanel({ data = [], onViewAll }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">
            campaign
          </span>
          Thông báo mới
        </h3>

        <button
          type="button"
          onClick={onViewAll}
          className="text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Xem tất cả
        </button>
      </div>

      {data.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 dark:bg-slate-950 dark:text-slate-400">
          Chưa có thông báo mới
        </p>
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <div
              key={item.id_notification}
              className="border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-slate-800"
            >
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {formatDateTime(item.created_at)}
              </p>

              <p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">
                {item.title}
              </p>

              <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                {item.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AttendanceHistoryTable({ data = [], onViewAll }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Lịch sử điểm danh gần đây
          </h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Các lần điểm danh mới nhất
          </p>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Xem tất cả
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="bg-slate-50 dark:bg-slate-950">
            <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <th className="px-5 py-4">Môn học</th>
              <th className="px-5 py-4">Ngày học</th>
              <th className="px-5 py-4">Giờ check-in</th>
              <th className="px-5 py-4">Trạng thái</th>
              <th className="px-5 py-4">Độ tin cậy</th>
              <th className="px-5 py-4">Ghi chú</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-10 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-[40px] text-slate-300 dark:text-slate-600">
                      fact_check
                    </span>

                    <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Chưa có dữ liệu điểm danh
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const status = getStatusLabel(item.status);

                return (
                  <tr
                    key={item.id_attendance}
                    className="border-t border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950"
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800 dark:text-slate-100">
                        {item.subject_name || "Chưa có môn học"}
                      </p>

                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {item.class_code || "Chưa có lớp"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(item.session_date)}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {item.check_in_time
                        ? formatDateTime(item.check_in_time)
                        : "Chưa check-in"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${status.className}`}
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {status.icon}
                        </span>
                        {status.text}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {item.confidence_score != null
                        ? `${Number(item.confidence_score).toFixed(1)}%`
                        : "--"}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {item.note || "--"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const studentId = useMemo(() => getStudentId(), []);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      await Promise.resolve();

      if (!studentId) {
        if (!isMounted) return;

        setDashboard({});
        setMessage(
          "Chưa có studentId. Vui lòng đăng nhập bằng tài khoản sinh viên hoặc lưu studentId vào localStorage."
        );
        setLoading(false);
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
          setMessage("");
        }

        const data = await getStudentDashboard(studentId);

        if (!isMounted) return;

        setDashboard(data || {});
        setMessage("");
      } catch (error) {
        console.error("Lỗi lấy dashboard sinh viên:", error);

        if (isMounted) {
          setMessage(error.message || "Không thể tải dashboard sinh viên");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [studentId, refreshKey]);

  const student = dashboard?.student || {};
  const stats = dashboard?.stats || {};
  const unreadCount = Number(dashboard?.unreadNotifications || 0);

  const cards = useMemo(
    () => [
      {
        icon: "check_circle",
        title: "Có mặt",
        value: stats.presentCount || 0,
        tag: "Attendance PRESENT",
        iconClass:
          "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
      },
      {
        icon: "cancel",
        title: "Vắng",
        value: stats.absentCount || 0,
        tag: "Attendance ABSENT",
        iconClass:
          "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300",
      },
      {
        icon: "schedule",
        title: "Đi muộn",
        value: stats.lateCount || 0,
        tag: "Attendance LATE",
        iconClass:
          "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
      },
    ],
    [stats]
  );

  const handleQuickAction = (path) => {
    if (path === "download") {
      navigate("/student/attendance-history?download=true");
      return;
    }

    navigate(path);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
        <Sidebar activePage="dashboard" />

        <div className="flex min-h-screen flex-1 flex-col md:ml-[280px]">
          <Header student={student} unreadCount={unreadCount} />

          <main className="flex-1 p-4 md:p-6">
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Đang tải dữ liệu trang chủ sinh viên...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar activePage="dashboard" />

      <div className="flex min-h-screen flex-1 flex-col md:ml-[280px]">
        <Header student={student} unreadCount={unreadCount} />

        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 text-white shadow-lg shadow-blue-100 dark:shadow-none">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm text-blue-100">
                  <span className="material-symbols-outlined text-[18px]">
                    dashboard
                  </span>
                  Trang chủ sinh viên
                </div>

                <h2 className="text-3xl font-bold tracking-tight">
                  Xin chào, {student.full_name || "Sinh viên"}
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-blue-100">
                  Theo dõi lịch học, điểm danh, thông báo và tình hình chuyên
                  cần của bạn trong học kỳ.
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-blue-50">
                  <span className="rounded-full bg-white/15 px-3 py-1">
                    MSSV: {student.student_code || "--"}
                  </span>

                  <span className="rounded-full bg-white/15 px-3 py-1">
                    Lớp: {student.class_name || "--"}
                  </span>

                  <span className="rounded-full bg-white/15 px-3 py-1">
                    Khoa: {student.faculty || "--"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setRefreshKey((prev) => prev + 1)}
                  className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/25"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    refresh
                  </span>
                  Tải lại
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/student/schedule")}
                  className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/25"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    calendar_today
                  </span>
                  Lịch học
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/student/attendance-history")}
                  className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    fact_check
                  </span>
                  Điểm danh
                </button>
              </div>
            </div>
          </div>

          {message && (
            <div className="mb-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              <span className="material-symbols-outlined text-[20px]">
                error
              </span>
              <span>{message}</span>
            </div>
          )}

          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
            <AttendanceRateCard percent={stats.attendancePercent || 0} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-3">
              {cards.map((card) => (
                <StatCard key={card.title} {...card} />
              ))}
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <WeeklyAttendanceChart data={dashboard?.weeklyTrend || []} />
            </div>

            <QuickActions onAction={handleQuickAction} />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <UpcomingClasses
                data={dashboard?.upcomingClasses || []}
                onViewAll={() => navigate("/student/schedule")}
              />
            </div>

            <NotificationsPanel
              data={dashboard?.notifications || []}
              onViewAll={() => navigate("/student/notifications")}
            />
          </div>

          <AttendanceHistoryTable
            data={dashboard?.recentAttendance || []}
            onViewAll={() => navigate("/student/attendance-history")}
          />
        </main>
      </div>
    </div>
  );
}