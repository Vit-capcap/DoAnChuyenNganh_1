import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/teacher/Sidebar";
import Header from "../components/teacher/Header";

import {
  getTeacherSchedule,
  getTeacherStatistics,
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

function safeNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function normalizeStatistics(data = {}) {
  const raw = data?.data || data || {};
  const overview = raw.overview || raw.stats || {};

  return {
    overview: {
      totalSessions: safeNumber(overview.totalSessions || overview.total_sessions),
      totalStudents: safeNumber(overview.totalStudents || overview.total_students),
      totalAttendance: safeNumber(
        overview.totalAttendance || overview.total_attendance
      ),
      presentCount: safeNumber(overview.presentCount || overview.present_count),
      lateCount: safeNumber(overview.lateCount || overview.late_count),
      absentCount: safeNumber(overview.absentCount || overview.absent_count),
      attendancePercent: safeNumber(
        overview.attendancePercent || overview.attendance_percent
      ),
      warningStudents: safeNumber(
        overview.warningStudents || overview.warning_students
      ),
    },
    trend: raw.trend || raw.weeklyTrend || [],
    distribution: raw.distribution || {},
    classStats: raw.classStats || raw.class_stats || [],
    topAbsentees: raw.topAbsentees || raw.top_absentees || [],
  };
}

function getInitials(name = "?") {
  return String(name)
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

function StatCard({ icon, title, value, suffix, tag, iconClass }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="absolute right-4 top-4 opacity-5 transition group-hover:opacity-10">
        <span className="material-symbols-outlined text-[76px]">{icon}</span>
      </div>

      <div
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${iconClass}`}
      >
        <span className="material-symbols-outlined text-[26px]">{icon}</span>
      </div>

      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {title}
      </p>

      <div className="mt-2 flex items-end gap-2">
        <h3 className="text-3xl font-black text-slate-900">{value}</h3>
        {suffix && (
          <span className="mb-1 text-sm font-bold text-slate-400">
            {suffix}
          </span>
        )}
      </div>

      {tag && <p className="mt-2 text-xs font-semibold text-slate-500">{tag}</p>}
    </div>
  );
}

function LineTrendChart({ data }) {
  const items =
    data.length > 0
      ? data
      : [
          { label: "T1", attendancePercent: 0, absentPercent: 0 },
          { label: "T2", attendancePercent: 0, absentPercent: 0 },
          { label: "T3", attendancePercent: 0, absentPercent: 0 },
          { label: "T4", attendancePercent: 0, absentPercent: 0 },
          { label: "T5", attendancePercent: 0, absentPercent: 0 },
          { label: "T6", attendancePercent: 0, absentPercent: 0 },
          { label: "T7", attendancePercent: 0, absentPercent: 0 },
        ];

  const width = 720;
  const height = 260;
  const padding = 36;

  const getX = (index) => {
    if (items.length === 1) return width / 2;
    return padding + (index * (width - padding * 2)) / (items.length - 1);
  };

  const getY = (value) => {
    const percent = Math.max(0, Math.min(100, safeNumber(value)));
    return height - padding - (percent * (height - padding * 2)) / 100;
  };

  const presentPoints = items
    .map((item, index) => `${getX(index)},${getY(item.attendancePercent)}`)
    .join(" ");

  const absentPoints = items
    .map((item, index) => `${getX(index)},${getY(item.absentPercent)}`)
    .join(" ");

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900">
            Tỷ lệ điểm danh theo thời gian
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-500">
            So sánh tỷ lệ có mặt và vắng theo các buổi học gần đây.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            Có mặt
          </span>

          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            Vắng
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[280px] min-w-[680px]">
          {[0, 25, 50, 75, 100].map((tick) => (
            <g key={tick}>
              <line
                x1={padding}
                y1={getY(tick)}
                x2={width - padding}
                y2={getY(tick)}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text
                x="8"
                y={getY(tick) + 4}
                className="fill-slate-400 text-[11px] font-semibold"
              >
                {tick}%
              </text>
            </g>
          ))}

          <polyline
            points={presentPoints}
            fill="none"
            stroke="#10b981"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <polyline
            points={absentPoints}
            fill="none"
            stroke="#ef4444"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="8 8"
          />

          {items.map((item, index) => (
            <g key={`${item.label}-${index}`}>
              <circle
                cx={getX(index)}
                cy={getY(item.attendancePercent)}
                r="5"
                fill="#10b981"
              />
              <circle
                cx={getX(index)}
                cy={getY(item.absentPercent)}
                r="5"
                fill="#ef4444"
              />
              <text
                x={getX(index)}
                y={height - 8}
                textAnchor="middle"
                className="fill-slate-400 text-[11px] font-bold"
              >
                {item.label || item.date || `Buổi ${index + 1}`}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

function DistributionCard({ overview }) {
  const total =
    overview.presentCount + overview.lateCount + overview.absentCount || 1;

  const presentPercent = Math.round((overview.presentCount / total) * 100);
  const latePercent = Math.round((overview.lateCount / total) * 100);
  const absentPercent = Math.round((overview.absentCount / total) * 100);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-black text-slate-900">
        Phân bổ trạng thái
      </h3>

      <p className="mt-1 text-sm font-medium text-slate-500">
        Tổng hợp PRESENT / LATE / ABSENT.
      </p>

      <div className="mt-6 flex items-center justify-center">
        <div
          className="relative flex h-44 w-44 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(#10b981 0 ${presentPercent}%, #f59e0b ${presentPercent}% ${
              presentPercent + latePercent
            }%, #ef4444 ${presentPercent + latePercent}% 100%)`,
          }}
        >
          <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
            <span className="text-2xl font-black text-slate-900">
              {overview.attendancePercent}%
            </span>
            <span className="text-xs font-bold uppercase text-slate-400">
              Có mặt
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl bg-emerald-50 p-3">
          <p className="text-lg font-black text-emerald-700">
            {presentPercent}%
          </p>
          <p className="text-xs font-bold text-emerald-600">Có mặt</p>
        </div>

        <div className="rounded-2xl bg-amber-50 p-3">
          <p className="text-lg font-black text-amber-700">{latePercent}%</p>
          <p className="text-xs font-bold text-amber-600">Đi trễ</p>
        </div>

        <div className="rounded-2xl bg-red-50 p-3">
          <p className="text-lg font-black text-red-700">{absentPercent}%</p>
          <p className="text-xs font-bold text-red-600">Vắng</p>
        </div>
      </div>
    </div>
  );
}

function ClassAbsenceChart({ data }) {
  const items = data.length > 0 ? data : [];
  const maxValue = Math.max(...items.map((item) => safeNumber(item.absentPercent)), 1);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-black text-slate-900">
        Tỷ lệ vắng theo lớp
      </h3>

      <p className="mt-1 text-sm font-medium text-slate-500">
        Lớp có tỷ lệ vắng cao cần được theo dõi thêm.
      </p>

      <div className="mt-6 space-y-4">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm font-semibold text-slate-400">
            Chưa có dữ liệu lớp học.
          </p>
        ) : (
          items.map((item) => {
            const percent = safeNumber(item.absentPercent);
            const width = Math.max(6, (percent / maxValue) * 100);

            return (
              <div key={item.id_course_class || item.class_code}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-700">
                    {item.class_code || item.classCode || "N/A"}
                  </p>
                  <p className="text-sm font-black text-red-600">{percent}%</p>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-red-500"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function TopAbsenteesTable({ data }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-black text-slate-900">
            <span className="material-symbols-outlined text-red-600">
              warning
            </span>
            Sinh viên vắng nhiều nhất
          </h3>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Danh sách sinh viên có tỷ lệ vắng cao trong các lớp đang dạy.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-6 py-4 font-bold">Sinh viên</th>
              <th className="px-6 py-4 font-bold">Lớp</th>
              <th className="px-6 py-4 text-right font-bold">Số buổi vắng</th>
              <th className="px-6 py-4 text-right font-bold">Tỷ lệ</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-10 text-center text-sm font-semibold text-slate-400"
                >
                  Chưa có sinh viên vắng nhiều.
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const absentCount = safeNumber(
                  item.absentCount || item.absent_count
                );
                const totalSessions = safeNumber(
                  item.totalSessions || item.total_sessions
                );
                const absentPercent = safeNumber(
                  item.absentPercent || item.absent_percent
                );

                return (
                  <tr
                    key={`${item.id_student}-${item.class_code}`}
                    className="transition hover:bg-blue-50/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {item.avatar ? (
                          <img
                            src={item.avatar}
                            alt={item.full_name}
                            className="h-10 w-10 rounded-2xl object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-sm font-black text-blue-700">
                            {getInitials(item.full_name)}
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-black text-slate-800">
                            {item.full_name || "Chưa có tên"}
                          </p>
                          <p className="text-xs font-semibold text-slate-400">
                            {item.student_code || "N/A"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                      {item.class_code || item.class_name || "N/A"}
                    </td>

                    <td className="px-6 py-4 text-right text-sm font-black text-red-600">
                      {absentCount}/{totalSessions || 0}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span
                        className={`rounded-xl px-3 py-1 text-xs font-black ${
                          absentPercent >= 20
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {absentPercent}%
                      </span>
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

function LoadingState() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
      <div className="flex min-h-[300px] flex-col items-center justify-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <p className="text-sm font-semibold text-slate-600">
          Đang tải dữ liệu thống kê...
        </p>
      </div>
    </div>
  );
}

export default function TeacherStatistics() {
  const navigate = useNavigate();

  const teacher = useMemo(() => getTeacherInfo(), []);
  const teacherId = useMemo(() => getTeacherId(), []);

  const [statistics, setStatistics] = useState(() => normalizeStatistics({}));
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchInitialData() {
      if (!teacherId) {
        if (isMounted) {
          setMessage(
            "Không tìm thấy teacherId. Vui lòng đăng nhập lại bằng tài khoản giáo viên."
          );
          setLoading(false);
        }
        return;
      }

      try {
        const [statisticsData, scheduleData] = await Promise.all([
          getTeacherStatistics(teacherId, {
            courseClassId: selectedClassId,
          }),
          getTeacherSchedule(teacherId),
        ]);

        if (!isMounted) return;

        const rawClasses = scheduleData?.classes || [];
        setClasses(rawClasses);
        setStatistics(normalizeStatistics(statisticsData));
        setMessage("");
      } catch (error) {
        console.error("Lỗi tải thống kê:", error);

        if (isMounted) {
          setMessage(error.message || "Không thể tải dữ liệu thống kê.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, [teacherId, selectedClassId, refreshKey]);

  const overview = statistics.overview;

  const handleRefresh = () => {
    setLoading(true);
    setRefreshKey((prev) => prev + 1);
  };

  const handleExportCsv = () => {
    const rows = [
      ["Thông tin", "Giá trị"],
      ["Tổng buổi học", overview.totalSessions],
      ["Tổng sinh viên", overview.totalStudents],
      ["Tổng bản ghi điểm danh", overview.totalAttendance],
      ["Có mặt", overview.presentCount],
      ["Đi trễ", overview.lateCount],
      ["Vắng", overview.absentCount],
      ["Tỷ lệ có mặt", `${overview.attendancePercent}%`],
      ["Sinh viên cảnh báo vắng", overview.warningStudents],
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `teacher-statistics-${teacherId}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar activePage="statistics" />

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

                  <span>Thống kê</span>
                </div>

                <h2 className="text-3xl font-bold tracking-tight">
                  Thống kê điểm danh
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-blue-100">
                  Theo dõi tỷ lệ điểm danh, sinh viên vắng nhiều và tình hình
                  tham gia học tập trong các lớp đang giảng dạy.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  value={selectedClassId}
                  onChange={(event) => {
                    setSelectedClassId(event.target.value);
                    setLoading(true);
                  }}
                  className="rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-bold text-white outline-none backdrop-blur transition focus:bg-white focus:text-slate-800"
                >
                  <option value="all">Tất cả lớp học</option>
                  {classes.map((item) => (
                    <option
                      key={item.id_course_class}
                      value={item.id_course_class}
                    >
                      {item.class_code}
                    </option>
                  ))}
                </select>

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
                  className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    download
                  </span>
                  Xuất CSV
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

          {loading ? (
            <LoadingState />
          ) : (
            <>
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  icon="event_note"
                  title="Tổng buổi học"
                  value={overview.totalSessions}
                  suffix="buổi"
                  tag="Đã tạo trên hệ thống"
                  iconClass="bg-blue-50 text-blue-600"
                />

                <StatCard
                  icon="groups"
                  title="Tổng sinh viên"
                  value={overview.totalStudents}
                  suffix="SV"
                  tag="Sinh viên trong lớp"
                  iconClass="bg-indigo-50 text-indigo-600"
                />

                <StatCard
                  icon="trending_up"
                  title="Tỷ lệ có mặt"
                  value={`${overview.attendancePercent}%`}
                  tag={`${overview.presentCount + overview.lateCount}/${overview.totalAttendance} lượt`}
                  iconClass="bg-emerald-50 text-emerald-600"
                />

                <StatCard
                  icon="warning"
                  title="Cảnh báo vắng"
                  value={overview.warningStudents}
                  suffix="SV"
                  tag="Tỷ lệ vắng từ 20%"
                  iconClass="bg-red-50 text-red-600"
                />
              </div>

              <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2">
                  <LineTrendChart data={statistics.trend} />
                </div>

                <DistributionCard overview={overview} />
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <ClassAbsenceChart data={statistics.classStats} />
                <TopAbsenteesTable data={statistics.topAbsentees} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}