import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/teacher/Sidebar";
import Header from "../components/teacher/Header";

import { getTeacherSchedule } from "../../api/teacherApi";

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

function getDayNameVi(day) {
  const map = {
    Monday: "Thứ 2",
    Tuesday: "Thứ 3",
    Wednesday: "Thứ 4",
    Thursday: "Thứ 5",
    Friday: "Thứ 6",
    Saturday: "Thứ 7",
    Sunday: "Chủ nhật",
  };

  return map[day] || "Chưa có ngày";
}

function getTodayTitle() {
  return new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getSessionStatus(item) {
  if (!item?.id_session) {
    return {
      text: "Chưa tạo buổi",
      className: "bg-slate-100 text-slate-600",
      dotClass: "bg-slate-400",
      active: false,
    };
  }

  if (item.session_status === "ONGOING") {
    return {
      text: "Đang diễn ra",
      className: "bg-emerald-100 text-emerald-700",
      dotClass: "bg-emerald-500",
      active: true,
    };
  }

  if (item.session_status === "FINISHED") {
    return {
      text: "Đã kết thúc",
      className: "bg-slate-200 text-slate-700",
      dotClass: "bg-slate-400",
      active: false,
    };
  }

  return {
    text: "Sắp diễn ra",
    className: "bg-blue-100 text-blue-700",
    dotClass: "bg-blue-500",
    active: false,
  };
}

function MiniCalendar() {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });

  const days = Array.from({ length: 31 }, (_, index) => index + 1);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">{currentMonth}</h3>

        <div className="flex gap-1">
          <button
            type="button"
            className="rounded-xl p-1 text-slate-500 hover:bg-slate-100"
          >
            <span className="material-symbols-outlined text-[20px]">
              chevron_left
            </span>
          </button>

          <button
            type="button"
            className="rounded-xl p-1 text-slate-500 hover:bg-slate-100"
          >
            <span className="material-symbols-outlined text-[20px]">
              chevron_right
            </span>
          </button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
          <span key={day} className="text-xs font-bold text-slate-400">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {days.map((day) => (
          <span
            key={day}
            className={`rounded-full py-1 text-sm ${
              day === currentDay
                ? "bg-blue-600 font-bold text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {day}
          </span>
        ))}
      </div>
    </div>
  );
}

function WeekStatsCard({ stats }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-bold text-slate-900">
        Tổng quan tuần
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm text-slate-500">
            <span className="material-symbols-outlined text-[18px]">
              menu_book
            </span>
            Tổng số lớp
          </span>

          <span className="font-bold text-slate-900">
            {stats.totalClasses || 0}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm text-slate-500">
            <span className="material-symbols-outlined text-[18px]">
              subject
            </span>
            Tổng số môn
          </span>

          <span className="font-bold text-slate-900">
            {stats.totalSubjects || 0}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm text-slate-500">
            <span className="material-symbols-outlined text-[18px]">
              calendar_today
            </span>
            Số lịch dạy
          </span>

          <span className="font-bold text-slate-900">
            {stats.totalSchedules || 0}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm text-slate-500">
            <span className="material-symbols-outlined text-[18px]">
              schedule
            </span>
            Giờ giảng dạy
          </span>

          <span className="font-bold text-slate-900">
            {stats.totalTeachingHours || 0}h
          </span>
        </div>
      </div>
    </div>
  );
}

function ScheduleTimeline({ schedules = [], onOpenAttendance, onViewDetail }) {
  if (schedules.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
        <span className="material-symbols-outlined text-[48px] text-slate-400">
          event_busy
        </span>

        <p className="mt-3 text-sm font-bold text-slate-600">
          Chưa có lịch dạy phù hợp
        </p>

        <p className="mt-1 text-sm text-slate-400">
          Hãy kiểm tra dữ liệu bảng CourseClass, Schedule và ClassRoom.
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 pl-6 before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-slate-200">
      {schedules.map((item) => {
        const status = getSessionStatus(item);

        return (
          <div key={item.id_schedule || item.id_course_class} className="relative">
            <div
              className={`absolute -left-[30px] top-2 h-4 w-4 rounded-full ring-4 ring-white ${status.dotClass}`}
            />

            <div className="flex flex-col gap-4 md:flex-row">
              <div className="w-36 flex-shrink-0 pt-1">
                <p className="text-sm font-bold text-blue-600">
                  {formatTime(item.start_time)} - {formatTime(item.end_time)}
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-400">
                  {getDayNameVi(item.day_of_week)}
                </p>
              </div>

              <div
                className={`flex-1 rounded-3xl border p-5 transition hover:shadow-md ${
                  status.active
                    ? "border-blue-200 bg-white shadow-sm"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${status.className}`}
                      >
                        {status.text}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                        {item.course_status || "OPEN"}
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-slate-900">
                      {item.subject_name || "Chưa có môn học"}
                    </h4>

                    <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-500 md:grid-cols-3">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[17px]">
                          meeting_room
                        </span>
                        {item.room_name || item.room_code || "Chưa có phòng"}
                      </span>

                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[17px]">
                          groups
                        </span>
                        {item.class_code || "Chưa có lớp"}
                      </span>

                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[17px]">
                          person
                        </span>
                        {Number(item.totalStudents || 0)} sinh viên
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-500 md:grid-cols-3">
                      <span>
                        Có mặt:{" "}
                        <b className="text-emerald-600">
                          {Number(item.attendedStudents || 0)}
                        </b>
                      </span>

                      <span>
                        Vắng:{" "}
                        <b className="text-red-600">
                          {Number(item.absentStudents || 0)}
                        </b>
                      </span>

                      <span>
                        Nhóm:{" "}
                        <b className="text-slate-700">
                          {item.group_number || "--"}
                        </b>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    {item.session_status !== "FINISHED" && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenAttendance(item.id_session, item.id_schedule)
                        }
                        className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          face_retouching_natural
                        </span>
                        Điểm danh
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        onViewDetail(`/teacher/classes/${item.id_course_class}`)
                      }
                      className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TeacherSchedule() {
  const navigate = useNavigate();

  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [view, setView] = useState("week");
  const [subject, setSubject] = useState("");
  const [classCode, setClassCode] = useState("");

  // Demo chưa đăng nhập: đổi số này thành id_teacher có thật trong MySQL
//   const teacherId = 41;

  // Sau này có đăng nhập thì đổi lại dòng dưới:
  const teacherId = useMemo(() => getTeacherId(), []);

  useEffect(() => {
    let isMounted = true;

    const loadSchedule = async () => {
      try {
        setLoading(true);

        const data = await getTeacherSchedule(teacherId, {
          view,
          subject,
          classCode,
        });

        if (!isMounted) return;

        setScheduleData(data || {});
        setMessage("");
      } catch (error) {
        console.error("Lỗi lấy lịch dạy:", error);

        if (isMounted) {
          setMessage(error.message || "Không thể tải lịch dạy");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSchedule();

    return () => {
      isMounted = false;
    };
  }, [teacherId, view, subject, classCode, refreshKey]);

  const teacher = scheduleData?.teacher || {};
  const stats = scheduleData?.stats || {};
  const schedules = scheduleData?.schedules || [];
  const subjects = scheduleData?.subjects || [];
  const classes = scheduleData?.classes || [];

  const pageTitle = useMemo(() => {
    if (view === "day") return "Lịch dạy theo ngày";
    if (view === "month") return "Lịch dạy theo tháng";
    return "Lịch dạy theo tuần";
  }, [view]);

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
        <Sidebar activePage="schedule" />

        <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
          <Header teacher={teacher} />

          <main className="flex-1 p-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm flex flex-col items-center justify-center min-h-[320px]">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />

              <p className="text-sm font-semibold text-slate-600">
                Đang tải lịch dạy giáo viên...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar activePage="schedule" />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <Header teacher={teacher} />

        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 text-white shadow-lg shadow-blue-100">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 text-blue-100 text-sm mb-2">
                  <span className="material-symbols-outlined text-[18px]">
                    calendar_today
                  </span>
                  Lịch dạy của tôi
                </div>

                <h2 className="text-3xl font-bold tracking-tight">
                  {pageTitle}
                </h2>

                <p className="text-sm text-blue-100 mt-2 max-w-2xl">
                  Quản lý lịch dạy, lớp học, phòng học và trạng thái điểm danh
                  của giáo viên {teacher.full_name || ""}.
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
                  onClick={() => navigate("/teacher/dashboard")}
                  className="bg-white text-blue-700 px-5 py-3 rounded-2xl flex items-center gap-2 text-sm font-bold hover:bg-blue-50 transition shadow-sm"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    dashboard
                  </span>
                  Dashboard
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

          <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
            <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {[
                { key: "day", label: "Ngày" },
                { key: "week", label: "Tuần" },
                { key: "month", label: "Tháng" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setView(item.key)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                    view === item.key
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:w-[520px]">
              <select
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              >
                <option value="">Tất cả môn học</option>
                {subjects.map((item) => (
                  <option key={item.id_subject} value={item.subject_name}>
                    {item.subject_name}
                  </option>
                ))}
              </select>

              <select
                value={classCode}
                onChange={(event) => setClassCode(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              >
                <option value="">Tất cả lớp</option>
                {classes.map((item) => (
                  <option key={item.id_course_class} value={item.class_code}>
                    {item.class_code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-3">
              <MiniCalendar />
              <WeekStatsCard stats={stats} />
            </div>

            <div className="lg:col-span-9">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {getTodayTitle()}
                    </h3>

                    <p className="text-sm text-slate-500 mt-1">
                      Danh sách lịch dạy theo dữ liệu MySQL
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setView("week");
                      setSubject("");
                      setClassCode("");
                    }}
                    className="text-sm font-bold text-blue-600 hover:text-blue-700"
                  >
                    Xóa bộ lọc
                  </button>
                </div>

                <ScheduleTimeline
                  schedules={schedules}
                  onOpenAttendance={handleOpenAttendance}
                  onViewDetail={navigate}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}