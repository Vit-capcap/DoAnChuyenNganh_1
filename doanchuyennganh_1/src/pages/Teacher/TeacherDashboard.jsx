import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/teacher/Sidebar";
import Header from "../components/teacher/Header";

import { getTeacherDashboard } from "../../api/teacherApi";

function getTeacherId() {
  try {
    const account = JSON.parse(localStorage.getItem("account") || "{}");
    const teacher = JSON.parse(localStorage.getItem("teacher") || "{}");

    return (
      account?.teacher_id ||
      account?.id_teacher ||
      teacher?.id_teacher ||
      localStorage.getItem("teacherId") ||
      null
    );
  } catch {
    return localStorage.getItem("teacherId") || null;
  }
}

function formatTime(value) {
  if (!value) return "--:--";

  return String(value).slice(0, 5);
}

function formatDateTime(value) {
  if (!value) return "";

  try {
    return new Date(value).toLocaleString("vi-VN");
  } catch {
    return value;
  }
}

function getSessionLabel(item) {
  if (!item?.id_session) {
    return {
      text: "Chưa tạo buổi",
      className: "bg-slate-100 text-slate-700",
    };
  }

  if (item.session_status === "ONGOING") {
    return {
      text: "Đang diễn ra",
      className: "bg-emerald-100 text-emerald-700",
    };
  }

  if (item.session_status === "FINISHED") {
    return {
      text: "Đã kết thúc",
      className: "bg-slate-200 text-slate-700",
    };
  }

  return {
    text: "Sắp diễn ra",
    className: "bg-blue-100 text-blue-700",
  };
}

function TeacherMetricCards({ cards = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div
              className={`h-11 w-11 rounded-2xl flex items-center justify-center ${card.iconClass}`}
            >
              <span className="material-symbols-outlined text-[24px]">
                {card.icon}
              </span>
            </div>

            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
          </div>

          <p className="text-sm font-semibold text-slate-600">{card.title}</p>
          <p className="text-xs text-slate-400 mt-1">{card.tag}</p>
        </div>
      ))}
    </div>
  );
}

function TodayScheduleCard({ data = [], onOpenAttendance, onViewDetail }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Lịch dạy hôm nay</h3>
          <p className="text-sm text-slate-500 mt-1">
            Danh sách lớp học theo lịch trong ngày
          </p>
        </div>

        <button
          type="button"
          onClick={() => onViewDetail("/teacher/schedule")}
          className="text-sm font-bold text-blue-600 hover:text-blue-700"
        >
          Xem tất cả
        </button>
      </div>

      {data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <span className="material-symbols-outlined text-[40px] text-slate-400">
            event_busy
          </span>

          <p className="text-sm font-semibold text-slate-600 mt-2">
            Hôm nay chưa có lịch dạy
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((item) => {
            const label = getSessionLabel(item);
            const totalStudents = Number(item.totalStudents || 0);
            const attendedStudents = Number(item.attendedStudents || 0);

            return (
              <div
                key={`${item.id_schedule}-${item.id_session || "empty"}`}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:bg-white hover:shadow-md"
              >
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${label.className}`}
                      >
                        {label.text}
                      </span>

                      <span className="flex items-center gap-1 text-sm text-slate-500">
                        <span className="material-symbols-outlined text-[17px]">
                          schedule
                        </span>
                        {formatTime(item.start_time)} -{" "}
                        {formatTime(item.end_time)}
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-slate-900">
                      {item.subject_name || "Chưa có tên môn học"}
                    </h4>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[17px]">
                          groups
                        </span>
                        {item.class_code || "Chưa có lớp"}
                      </span>

                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[17px]">
                          meeting_room
                        </span>
                        {item.room_name || item.room_code || "Chưa có phòng"}
                      </span>

                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[17px]">
                          fact_check
                        </span>
                        {attendedStudents}/{totalStudents} đã điểm danh
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    {item.session_status === "FINISHED" ? (
                      <button
                        type="button"
                        onClick={() =>
                          onViewDetail(
                            `/teacher/attendance/report/${item.id_session}`
                          )
                        }
                        className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                      >
                        Xem báo cáo
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenAttendance(item.id_session, item.id_schedule)
                        }
                        className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                      >
                        Bắt đầu điểm danh
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        onViewDetail(`/teacher/classes/${item.id_course_class}`)
                      }
                      className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
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

  const points = chartData
    .map((item, index) => {
      const x =
        chartData.length === 1 ? 50 : (index / (chartData.length - 1)) * 100;
      const y = 100 - Number(item.attendancePercent || 0);

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Tỷ lệ điểm danh theo tuần
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Dữ liệu lấy từ bảng Attendance theo 7 ngày gần nhất
          </p>
        </div>
      </div>

      <div className="h-64 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            points={points}
            className="text-blue-600"
          />

          {chartData.map((item, index) => {
            const x =
              chartData.length === 1
                ? 50
                : (index / (chartData.length - 1)) * 100;
            const y = 100 - Number(item.attendancePercent || 0);

            return (
              <circle
                key={`${item.label}-${index}`}
                cx={x}
                cy={y}
                r="2.5"
                className="fill-blue-600"
              />
            );
          })}
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2">
        {chartData.map((item, index) => (
          <div key={`${item.label}-${index}`} className="text-center">
            <p className="text-xs font-bold text-slate-500">{item.label}</p>
            <p className="text-xs text-slate-400">
              {Number(item.attendancePercent || 0).toFixed(0)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationsPanel({ data = [], onViewAll }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <span className="material-symbols-outlined text-blue-600">
            campaign
          </span>
          Thông báo mới
        </h3>
      </div>

      {data.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
          Chưa có thông báo mới
        </p>
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <div
              key={item.id_notification}
              className="border-b border-slate-100 pb-3 last:border-0 last:pb-0"
            >
              <p className="text-xs text-slate-400">
                {formatDateTime(item.created_at)}
              </p>

              <p className="mt-1 text-sm font-bold text-slate-700">
                {item.title}
              </p>

              <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                {item.content}
              </p>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onViewAll}
        className="mt-5 w-full rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
      >
        Xem tất cả thông báo
      </button>
    </div>
  );
}

function TopAbsenteesPanel({ data = [] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-2">
        <span className="material-symbols-outlined text-red-500">warning</span>
        Cảnh báo vắng học
      </h3>

      <p className="text-sm text-slate-500 mb-4">
        Top sinh viên vắng nhiều nhất trong 7 ngày gần đây
      </p>

      {data.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
          Chưa có sinh viên vắng nhiều
        </p>
      ) : (
        <div className="space-y-3">
          {data.map((student) => {
            const initials = String(student.full_name || "?")
              .trim()
              .split(/\s+/)
              .map((word) => word[0])
              .slice(-2)
              .join("")
              .toUpperCase();

            return (
              <div
                key={student.id_student}
                className="flex items-center justify-between gap-3 rounded-2xl p-3 transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-sm font-bold text-blue-700">
                    {initials}
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {student.full_name}
                    </p>

                    <p className="text-xs text-slate-400">
                      {student.student_code} ·{" "}
                      {student.class_name || "Chưa có lớp"}
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                  {student.absentCount} buổi
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TeacherDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const teacherId = useMemo(() => getTeacherId(), []);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      if (!teacherId) {
        setDashboard({});
        setMessage(
          "Chưa có teacherId. Vui lòng đăng nhập bằng tài khoản giáo viên hoặc lưu teacherId vào localStorage."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const data = await getTeacherDashboard(teacherId);

        if (!isMounted) return;

        setDashboard(data || {});
        setMessage("");
      } catch (error) {
        console.error("Lỗi lấy dashboard giáo viên:", error);

        if (isMounted) {
          setMessage(error.message || "Không thể tải dashboard giáo viên");
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
  }, [teacherId, refreshKey]);

  const teacher = dashboard?.teacher || {};
  const stats = dashboard?.stats || {};

  const cards = useMemo(
    () => [
      {
        icon: "class",
        title: "Tổng lớp đang dạy",
        value: stats.totalClasses || 0,
        tag: "CourseClass",
        iconClass: "bg-blue-50 text-blue-600",
      },
      {
        icon: "menu_book",
        title: "Tổng môn phụ trách",
        value: stats.totalSubjects || 0,
        tag: "Subject",
        iconClass: "bg-purple-50 text-purple-600",
      },
      {
        icon: "event",
        title: "Lịch dạy hôm nay",
        value: stats.todaySchedules || 0,
        tag: "Schedule",
        iconClass: "bg-emerald-50 text-emerald-600",
      },
      {
        icon: "done_all",
        title: "Đã điểm danh",
        value: stats.completedToday || 0,
        tag: "Session",
        iconClass: "bg-teal-50 text-teal-600",
      },
      {
        icon: "person_off",
        title: "SV vắng hôm nay",
        value: stats.absentToday || 0,
        tag: "Attendance",
        iconClass: "bg-red-50 text-red-600",
      },
      {
        icon: "percent",
        title: "Tỷ lệ đi học TB",
        value: `${Number(stats.avgAttendancePercent || 0).toFixed(0)}%`,
        tag: "Attendance Rate",
        iconClass: "bg-amber-50 text-amber-600",
      },
    ],
    [stats]
  );

  const handleOpenAttendance = (sessionId, scheduleId) => {
    if (sessionId) {
      navigate(`/teacher/attendance/${sessionId}`);
      return;
    }

    navigate(`/teacher/sessions/create?scheduleId=${scheduleId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-700 flex">
        <Sidebar activePage="dashboard" />

        <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
          <Header teacher={teacher} />

          <main className="flex-1 p-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm flex flex-col items-center justify-center min-h-[320px]">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />

              <p className="text-sm font-semibold text-slate-600">
                Đang tải dữ liệu trang chủ giáo viên...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar activePage="dashboard" />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <Header teacher={teacher} />

        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 text-white shadow-lg shadow-blue-100">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 text-blue-100 text-sm mb-2">
                  <span className="material-symbols-outlined text-[18px]">
                    dashboard
                  </span>
                  Trang chủ giáo viên
                </div>

                <h2 className="text-3xl font-bold tracking-tight">
                  Xin chào, {teacher.full_name || "Giảng viên"}
                </h2>

                <p className="text-sm text-blue-100 mt-2 max-w-2xl">
                  Theo dõi lịch dạy, lớp học, điểm danh, thông báo và tình hình
                  chuyên cần của sinh viên.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setRefreshKey((prev) => prev + 1)}
                  className="bg-white/15 hover:bg-white/25 text-white border border-white/20 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 transition"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    refresh
                  </span>
                  Tải lại
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/teacher/schedule")}
                  className="bg-white/15 hover:bg-white/25 text-white border border-white/20 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 transition"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    calendar_today
                  </span>
                  Lịch dạy
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/teacher/attendance")}
                  className="bg-white text-blue-700 px-5 py-3 rounded-2xl flex items-center gap-2 text-sm font-bold hover:bg-blue-50 transition shadow-sm"
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
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 flex items-start gap-2">
              <span className="material-symbols-outlined text-[20px]">
                error
              </span>
              <span>{message}</span>
            </div>
          )}

          <TeacherMetricCards cards={cards} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <TodayScheduleCard
                data={dashboard?.todaySchedule || []}
                onOpenAttendance={handleOpenAttendance}
                onViewDetail={navigate}
              />

              <WeeklyAttendanceChart data={dashboard?.weeklyTrend || []} />
            </div>

            <div className="space-y-6">
              <NotificationsPanel
                data={dashboard?.notifications || []}
                onViewAll={() => navigate("/teacher/notifications")}
              />

              <TopAbsenteesPanel data={dashboard?.topAbsentees || []} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}