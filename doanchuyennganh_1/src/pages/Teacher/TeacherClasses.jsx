import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/teacher/Sidebar";
import Header from "../components/teacher/Header";

import { getTeacherClasses } from "../../api/teacherApi";

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

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getAttendanceColor(percent) {
  if (percent >= 90) return "bg-emerald-500";
  if (percent >= 70) return "bg-blue-500";
  if (percent >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function getStatusLabel(status) {
  const normalizedStatus = String(status || "OPEN").toUpperCase();

  if (normalizedStatus === "CLOSED") {
    return {
      text: "Đã kết thúc",
      className: "bg-slate-100 text-slate-600",
    };
  }

  return {
    text: "Đang mở",
    className: "bg-blue-100 text-blue-700",
  };
}

function normalizeClassData(item = {}) {
  const id =
    item.id_course_class ||
    item.course_class_id ||
    item.idCourseClass ||
    item.id ||
    "";

  const status = String(item.status || item.course_status || "OPEN").toUpperCase();

  const totalAttendance = safeNumber(
    item.total_attendance || item.totalAttendance
  );

  const attendedCount = safeNumber(item.attended_count || item.attendedCount);

  const attendancePercent =
    item.attendance_percent !== undefined || item.attendancePercent !== undefined
      ? safeNumber(item.attendance_percent || item.attendancePercent)
      : totalAttendance > 0
        ? (attendedCount / totalAttendance) * 100
        : 0;

  return {
    id,
    classCode: item.class_code || item.classCode || "Chưa có mã lớp",
    subjectName: item.subject_name || item.subjectName || "Chưa có môn học",
    subjectCode: item.subject_code || item.subjectCode || "",
    credits: safeNumber(item.credits),
    semester: item.semester || "Chưa có học kỳ",
    schoolYear: item.school_year || item.schoolYear || "Chưa có năm học",
    groupNumber: item.group_number || item.groupNumber || "",
    maxStudent: safeNumber(item.max_student || item.maxStudent),
    roomName:
      item.room_name ||
      item.roomName ||
      item.room_code ||
      item.roomCode ||
      "Chưa có phòng",
    roomCode: item.room_code || item.roomCode || "",
    building: item.building || "",
    floor: item.floor || "",
    totalStudents: safeNumber(
      item.total_students || item.totalStudents || item.student_count
    ),
    totalSchedules: safeNumber(item.total_schedules || item.totalSchedules),
    totalSessions: safeNumber(item.total_sessions || item.totalSessions),
    finishedSessions: safeNumber(
      item.finished_sessions || item.finishedSessions
    ),
    totalAttendance,
    attendedCount,
    presentCount: safeNumber(item.present_count || item.presentCount),
    lateCount: safeNumber(item.late_count || item.lateCount),
    absentCount: safeNumber(item.absent_count || item.absentCount),
    attendancePercent,
    status,
  };
}

function ClassStatCard({ icon, title, value, tag, iconClass }) {
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

function ClassFilters({
  search,
  semester,
  status,
  semesterOptions,
  onSearchChange,
  onSemesterChange,
  onStatusChange,
}) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_auto]">
      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          search
        </span>

        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm kiếm lớp học, mã lớp, môn học, phòng..."
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
        />
      </div>

      <select
        value={semester}
        onChange={(event) => onSemesterChange(event.target.value)}
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
      >
        <option value="all">Tất cả học kỳ</option>
        {semesterOptions.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <select
        value={status}
        onChange={(event) => onStatusChange(event.target.value)}
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
      >
        <option value="all">Tất cả trạng thái</option>
        <option value="OPEN">Đang mở</option>
        <option value="CLOSED">Đã kết thúc</option>
      </select>
    </div>
  );
}

function ClassCard({ item, onViewDetail }) {
  const statusLabel = getStatusLabel(item.status);
  const percent = Math.min(Math.max(item.attendancePercent, 0), 100);

  return (
    <article className="group flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span
            className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusLabel.className}`}
          >
            {statusLabel.text}
          </span>

          <h3
            className="truncate text-lg font-black text-slate-900"
            title={item.subjectName}
          >
            {item.subjectName}
          </h3>

          <p className="mt-1 text-sm font-bold text-slate-500">
            {item.classCode}
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <span className="material-symbols-outlined">groups</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Mã môn
          </p>
          <p className="mt-1 truncate text-sm font-bold text-slate-800">
            {item.subjectCode || "N/A"}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Sĩ số
          </p>
          <p className="mt-1 text-sm font-bold text-slate-800">
            {item.totalStudents} SV
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Phòng
          </p>
          <p className="mt-1 truncate text-sm font-bold text-slate-800">
            {item.roomName}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Buổi học
          </p>
          <p className="mt-1 text-sm font-bold text-slate-800">
            {item.totalSessions} buổi
          </p>
        </div>

        <div className="col-span-2 rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Học kỳ
          </p>
          <p className="mt-1 text-sm font-bold text-slate-800">
            {item.semester} - {item.schoolYear}
          </p>
        </div>
      </div>

      <div className="mt-auto">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Tỷ lệ điểm danh TB
          </p>

          <span className="text-sm font-black text-blue-600">
            {percent.toFixed(0)}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${getAttendanceColor(percent)}`}
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="mt-2 flex justify-between text-xs font-semibold text-slate-400">
          <span>
            Có mặt: {item.presentCount + item.lateCount}/{item.totalAttendance}
          </span>
          <span>Vắng: {item.absentCount}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onViewDetail(`/teacher/classes/${item.id}`, item)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
        >
          Chi tiết lớp
          <span className="material-symbols-outlined text-[18px]">
            arrow_forward
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            onViewDetail(`/teacher/classes/${item.id}/students`, item)
          }
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          Sinh viên
          <span className="material-symbols-outlined text-[18px]">
            group
          </span>
        </button>
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-80 animate-pulse rounded-3xl border border-slate-200 bg-white"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
        <span className="material-symbols-outlined text-[34px]">groups</span>
      </div>

      <h2 className="text-xl font-bold text-slate-900">Chưa có lớp học</h2>

      <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-slate-500">
        Giáo viên này chưa có lớp học phần hoặc dữ liệu chưa khớp với
        teacher_id hiện tại.
      </p>
    </div>
  );
}

export default function TeacherClasses() {
  const navigate = useNavigate();

  const teacherId = useMemo(() => getTeacherId(), []);
  const teacher = useMemo(() => getTeacherInfo(), []);

  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState("");
  const [semester, setSemester] = useState("all");
  const [status, setStatus] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadClasses() {
      if (!teacherId) {
        if (isMounted) {
          setClasses([]);
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

        const data = await getTeacherClasses(teacherId, {
          search,
          semester,
          status,
        });

        if (!isMounted) return;

        const rawClasses =
          data?.classes ||
          data?.courseClasses ||
          data?.data ||
          [];

        setClasses(rawClasses.map(normalizeClassData));
      } catch (error) {
        console.error("Lỗi tải lớp học giáo viên:", error);

        if (isMounted) {
          setClasses([]);
          setMessage(error.message || "Không thể tải danh sách lớp học.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    const timeoutId = setTimeout(loadClasses, 250);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [teacherId, search, semester, status, refreshKey]);

  const semesterOptions = useMemo(() => {
    const values = classes.map(
      (item) => `${item.semester} - ${item.schoolYear}`
    );

    return Array.from(new Set(values));
  }, [classes]);

  const stats = useMemo(() => {
    const totalClasses = classes.length;
    const openClasses = classes.filter((item) => item.status === "OPEN").length;
    const closedClasses = classes.filter(
      (item) => item.status === "CLOSED"
    ).length;

    const totalStudents = classes.reduce(
      (sum, item) => sum + Number(item.totalStudents || 0),
      0
    );

    const avgAttendance =
      totalClasses > 0
        ? classes.reduce(
            (sum, item) => sum + Number(item.attendancePercent || 0),
            0
          ) / totalClasses
        : 0;

    return {
      totalClasses,
      openClasses,
      closedClasses,
      totalStudents,
      avgAttendance,
    };
  }, [classes]);

  const handleViewDetail = (path, classData) => {
    navigate(path, {
      state: {
        classData,
      },
    });
  };

  const handleRefresh = () => {
    setLoading(true);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar activePage="classes" />

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

                  <span>Lớp học</span>
                </div>

                <h2 className="text-3xl font-bold tracking-tight">
                  Lớp học của tôi
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-blue-100">
                  Theo dõi danh sách lớp học phần, sĩ số sinh viên, phòng học,
                  buổi học và tỷ lệ điểm danh trung bình của từng lớp.
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
                  onClick={() => navigate("/teacher/attendance")}
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
            <div className="mb-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              <span className="material-symbols-outlined text-[20px]">
                error
              </span>
              <span>{message}</span>
            </div>
          )}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <ClassStatCard
              icon="class"
              title="Tổng lớp học"
              value={stats.totalClasses}
              tag="CourseClass"
              iconClass="bg-blue-50 text-blue-600"
            />

            <ClassStatCard
              icon="lock_open"
              title="Lớp đang mở"
              value={stats.openClasses}
              tag="OPEN"
              iconClass="bg-emerald-50 text-emerald-600"
            />

            <ClassStatCard
              icon="lock"
              title="Lớp đã kết thúc"
              value={stats.closedClasses}
              tag="CLOSED"
              iconClass="bg-slate-100 text-slate-600"
            />

            <ClassStatCard
              icon="groups"
              title="Tổng sinh viên"
              value={stats.totalStudents}
              tag="Enrollment"
              iconClass="bg-purple-50 text-purple-600"
            />

            <ClassStatCard
              icon="percent"
              title="Điểm danh TB"
              value={`${stats.avgAttendance.toFixed(0)}%`}
              tag="Attendance Rate"
              iconClass="bg-amber-50 text-amber-600"
            />
          </div>

          <ClassFilters
            search={search}
            semester={semester}
            status={status}
            semesterOptions={semesterOptions}
            onSearchChange={setSearch}
            onSemesterChange={setSemester}
            onStatusChange={setStatus}
          />

          {loading ? (
            <LoadingState />
          ) : classes.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {classes.map((item) => (
                <ClassCard
                  key={`${item.id}-${item.classCode}`}
                  item={item}
                  onViewDetail={handleViewDetail}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}