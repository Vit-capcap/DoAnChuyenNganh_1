// src/pages/Student/StudySchedule.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import TodaySchedule from "../components/TodaySchedule";
import Calendar from "../components/Calendar";
import { getMyStudentSchedule } from "../../api/studentApi";
import StudentLayout from "./components/StudentLayout";

/* =========================
   MAP thứ tiếng Việt
========================= */
const dayViMap = {
  Monday: "Thứ 2",
  Tuesday: "Thứ 3",
  Wednesday: "Thứ 4",
  Thursday: "Thứ 5",
  Friday: "Thứ 6",
  Saturday: "Thứ 7",
  Sunday: "Chủ nhật",
};

/** Tránh hiển thị "Tầng Tầng 3" khi API đã trả chuỗi chứa "tầng" */
function formatFloor(floor) {
  if (!floor) return "—";
  const text = String(floor).trim();
  if (text.toLowerCase().includes("tầng")) return text;
  return `Tầng ${text}`;
}

/* =========================
   Lấy Today data cho TodaySchedule component
========================= */
const borderColors = [
  "border-blue-500",
  "border-purple-500",
  "border-emerald-500",
  "border-orange-500",
  "border-cyan-500",
  "border-pink-500",
];

function getTodayDayOfWeek() {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date().getDay()];
}

function buildTodayData(scheduleRows) {
  const todayDay = getTodayDayOfWeek();
  const todayRows = scheduleRows.filter((row) => row.day_of_week === todayDay);
  return todayRows.map((row, index) => ({
    title: row.subject_name || "—",
    time: `${(row.start_time || "").slice(0, 5)} - ${(row.end_time || "").slice(0, 5)}`,
    border: borderColors[index % borderColors.length],
  }));
}

/* ===========================
   MODAL chi tiết môn học
=========================== */
function SubjectModal({ subject, onClose }) {
  if (!subject) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition"
          title="Đóng"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-blue-700">menu_book</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{subject.subject_name}</h3>
            <p className="text-sm text-gray-500">{subject.subject_code}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <InfoRow icon="class" label="Mã lớp" value={subject.class_code} />
          <InfoRow icon="person" label="Giảng viên" value={subject.teacher_name} />
          <InfoRow icon="mail" label="Email GV" value={subject.teacher_email} />
          <InfoRow icon="meeting_room" label="Phòng học" value={subject.room_name || subject.room_code || "—"} />
          <InfoRow icon="apartment" label="Tòa nhà" value={subject.building || "—"} />
          <InfoRow icon="stairs" label="Tầng" value={formatFloor(subject.floor)} />
          <InfoRow icon="calendar_today" label="Thứ" value={dayViMap[subject.day_of_week] || subject.day_of_week} />
          <InfoRow
            icon="schedule"
            label="Giờ học"
            value={`${(subject.start_time || "").slice(0, 5)} – ${(subject.end_time || "").slice(0, 5)}`}
          />
          <InfoRow icon="school" label="Học kỳ" value={subject.semester} />
          <InfoRow icon="date_range" label="Năm học" value={subject.school_year} />
          {subject.credits && (
            <InfoRow icon="star" label="Tín chỉ" value={`${subject.credits} tín chỉ`} />
          )}
          {subject.group_number && (
            <InfoRow icon="group" label="Nhóm" value={`Nhóm ${subject.group_number}`} />
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-3">
      <span className="material-symbols-outlined text-blue-600 text-[18px] mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="font-medium text-gray-800">{value || "—"}</p>
      </div>
    </div>
  );
}

/* =========================
   MAIN COMPONENT
========================= */
export default function StudySchedule() {
  const navigate = useNavigate();

  // --- Dữ liệu thô (tất cả lịch, không filter) để giữ options ---
  const [rawRows, setRawRows] = useState([]);

  const [scheduleRows, setScheduleRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [todayData, setTodayData] = useState([]);

  // Filter states
  const [semester, setSemester] = useState("");
  const [schoolYear, setSchoolYear] = useState("");

  // Modal state
  const [selectedSubject, setSelectedSubject] = useState(null);

  // User ref để tránh re-read localStorage nhiều lần
  const userRef = useRef(null);

  /* --- Load user & dữ liệu thô lần đầu --- */
  useEffect(() => {
    const userRaw = localStorage.getItem("user");
    if (!userRaw) {
      navigate("/login");
      return;
    }

    let user;
    try {
      user = JSON.parse(userRaw);
    } catch {
      localStorage.removeItem("user");
      navigate("/login");
      return;
    }

    if (user.role !== "STUDENT" || !user.student_id) {
      setError("Tài khoản không có quyền truy cập trang này.");
      setLoading(false);
      return;
    }

    userRef.current = user;

    // Gọi API không filter để lấy toàn bộ dữ liệu (cho options)
    getMyStudentSchedule(user.student_id, {})
      .then((res) => {
        if (res && res.success) {
          const rows = res.data || [];
          setRawRows(rows);
          setScheduleRows(rows);
          setTodayData(buildTodayData(rows));
        } else {
          setError(res?.message || "Không thể tải lịch học.");
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Lỗi kết nối đến server.");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  /* --- Khi filter thay đổi: filter local từ rawRows --- */
  useEffect(() => {
    if (rawRows.length === 0) return;

    let filtered = rawRows;
    if (semester) filtered = filtered.filter((r) => r.semester === semester);
    if (schoolYear) filtered = filtered.filter((r) => r.school_year === schoolYear);

    setScheduleRows(filtered);
    setTodayData(buildTodayData(filtered));
  }, [semester, schoolYear, rawRows]);

  const handleResetFilter = () => {
    setSemester("");
    setSchoolYear("");
  };

  // Lấy options từ rawRows (không bị ảnh hưởng bởi filter)
  const semesterOptions = [...new Set(rawRows.map((r) => r.semester).filter(Boolean))].sort();
  const schoolYearOptions = [...new Set(rawRows.map((r) => r.school_year).filter(Boolean))].sort();

  const isFiltered = semester || schoolYear;

  return (
    <StudentLayout
      title="Student Portal"
      subtitle="Study Schedule"
      showSearch={false}
    >
      {/* Modal chi tiết môn học */}
      <SubjectModal subject={selectedSubject} onClose={() => setSelectedSubject(null)} />

      <div className="space-y-6">

        {/* Title + Filter */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Lịch học cá nhân</h1>
            <p className="text-gray-500">Xem lịch học theo thứ trong tuần</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-blue-300 outline-none"
            >
              <option value="">Tất cả học kỳ</option>
              {semesterOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-blue-300 outline-none"
            >
              <option value="">Tất cả năm học</option>
              {schoolYearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {/* Nút reset filter */}
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="px-4 py-2 rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 text-sm transition flex items-center gap-1"
                title="Xóa bộ lọc"
              >
                <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                Xóa lọc
              </button>
            )}
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <span className="material-symbols-outlined text-5xl text-blue-500 animate-spin">
                progress_activity
              </span>
              <p className="mt-3 text-gray-500">Đang tải lịch học...</p>
            </div>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl">error_outline</span>
            <div>
              <p className="font-semibold">Không thể tải lịch học</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && scheduleRows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">event_busy</span>
            <p className="text-gray-500 font-medium text-lg">Bạn chưa có lịch học nào.</p>
            {isFiltered && (
              <p className="text-gray-400 text-sm mt-2">
                Thử xóa bộ lọc để xem tất cả lịch học.
              </p>
            )}
          </div>
        )}

        {/* DATA */}
        {!loading && !error && scheduleRows.length > 0 && (
          <div className="grid xl:grid-cols-4 gap-5">

            {/* Today */}
            <div>
              <TodaySchedule data={todayData} />
            </div>

            <div className="xl:col-span-3">
              <Calendar
                scheduleRows={scheduleRows}
                onSelectSubject={setSelectedSubject}
              />
            </div>
          </div>
        )}

        {/* LIST TABLE dưới Calendar */}
        {!loading && !error && scheduleRows.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-6">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">
                Chi tiết lịch học ({scheduleRows.length} lịch)
              </h3>
              {isFiltered && (
                <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  Đang lọc
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-blue-900 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Môn học</th>
                    <th className="px-4 py-3 text-left">Mã lớp</th>
                    <th className="px-4 py-3 text-left">Thứ</th>
                    <th className="px-4 py-3 text-left">Giờ</th>
                    <th className="px-4 py-3 text-left">Giảng viên</th>
                    <th className="px-4 py-3 text-left">Phòng</th>
                    <th className="px-4 py-3 text-left">Học kỳ</th>
                    <th className="px-4 py-3 text-left">Năm học</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {scheduleRows.map((row) => (
                    <tr
                      key={row.id_schedule}
                      className="hover:bg-blue-50 transition cursor-pointer"
                      onClick={() => setSelectedSubject(row)}
                      title="Bấm để xem chi tiết"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800">{row.subject_name}</p>
                        <p className="text-gray-400 text-xs">{row.subject_code} · {row.credits} tín chỉ</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <p>{row.class_code}</p>
                        {row.group_number && <p className="text-xs text-gray-400">Nhóm {row.group_number}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {dayViMap[row.day_of_week] || row.day_of_week}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {(row.start_time || "").slice(0, 5)} – {(row.end_time || "").slice(0, 5)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{row.teacher_name}</td>
                      <td className="px-4 py-3 text-gray-600">
                        <p>{row.room_name || row.room_code || "—"}</p>
                        {row.building && (
                          <p className="text-xs text-gray-400">
                            {row.building}{row.floor ? ` · ${formatFloor(row.floor)}` : ""}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{row.semester}</td>
                      <td className="px-4 py-3 text-gray-600">{row.school_year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}