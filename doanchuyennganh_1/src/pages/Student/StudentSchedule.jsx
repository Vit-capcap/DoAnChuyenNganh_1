import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/student/Sidebar";
import Header from "../components/student/Header";

import { getMyStudentSchedule } from "../../api/studentApi";

const dayViMap = {
  Monday: "Thứ 2",
  Tuesday: "Thứ 3",
  Wednesday: "Thứ 4",
  Thursday: "Thứ 5",
  Friday: "Thứ 6",
  Saturday: "Thứ 7",
  Sunday: "Chủ nhật",
};

const dayShortMap = {
  Monday: "T2",
  Tuesday: "T3",
  Wednesday: "T4",
  Thursday: "T5",
  Friday: "T6",
  Saturday: "T7",
  Sunday: "CN",
};

const dayOrder = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const timeSlots = [
  { label: "07:00", value: "07:00" },
  { label: "08:00", value: "08:00" },
  { label: "09:00", value: "09:00" },
  { label: "10:00", value: "10:00" },
  { label: "11:00", value: "11:00" },
  { label: "12:00", value: "12:00" },
  { label: "13:00", value: "13:00" },
  { label: "14:00", value: "14:00" },
  { label: "15:00", value: "15:00" },
  { label: "16:00", value: "16:00" },
  { label: "17:00", value: "17:00" },
];

const SLOT_HEIGHT = 92;

function getStudentId() {
  try {
    const account = JSON.parse(localStorage.getItem("account") || "{}");
    const student = JSON.parse(localStorage.getItem("student") || "{}");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return (
      account?.student_id ||
      account?.id_student ||
      student?.id_student ||
      user?.student_id ||
      user?.id_student ||
      localStorage.getItem("studentId") ||
      null
    );
  } catch {
    return localStorage.getItem("studentId") || null;
  }
}

function getStudentInfo() {
  try {
    const account = JSON.parse(localStorage.getItem("account") || "{}");
    const student = JSON.parse(localStorage.getItem("student") || "{}");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return {
      ...user,
      ...account,
      ...student,
      full_name:
        student?.full_name ||
        user?.full_name ||
        account?.student_name ||
        account?.full_name ||
        "Sinh viên",
      student_code:
        student?.student_code ||
        user?.student_code ||
        account?.student_code ||
        "",
      avatar:
        student?.avatar ||
        user?.avatar ||
        account?.student_avatar ||
        "",
    };
  } catch {
    return {};
  }
}

function formatTime(value) {
  if (!value) return "--:--";
  return String(value).slice(0, 5);
}

function timeToMinutes(value) {
  if (!value) return 0;

  const [hour, minute] = String(value)
    .slice(0, 5)
    .split(":")
    .map(Number);

  return hour * 60 + minute;
}

function getScheduleBlockStyle(startTime, endTime) {
  const firstSlotMinutes = timeToMinutes(timeSlots[0].value);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  const top = ((startMinutes - firstSlotMinutes) / 60) * SLOT_HEIGHT + 8;

  const height = Math.max(
    72,
    ((endMinutes - startMinutes) / 60) * SLOT_HEIGHT - 16
  );

  return {
    top: `${top}px`,
    height: `${height}px`,
  };
}

function formatFloor(floor) {
  if (!floor) return "—";

  const text = String(floor).trim();

  if (text.toLowerCase().includes("tầng")) {
    return text;
  }

  return `Tầng ${text}`;
}

function getTodayDayOfWeek() {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return days[new Date().getDay()];
}

function groupScheduleByDay(rows = []) {
  return dayOrder.map((day) => ({
    day,
    label: dayViMap[day] || day,
    rows: rows
      .filter((item) => item.day_of_week === day)
      .sort((a, b) =>
        String(a.start_time || "").localeCompare(String(b.start_time || ""))
      ),
  }));
}

function getDurationLabel(startTime, endTime) {
  const start = formatTime(startTime);
  const end = formatTime(endTime);

  if (start === "--:--" || end === "--:--") {
    return "--:--";
  }

  return `${start} - ${end}`;
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined mt-0.5 text-[20px] text-blue-600 dark:text-blue-400">
          {icon}
        </span>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {label}
          </p>

          <p className="mt-1 break-words text-sm font-bold text-slate-800 dark:text-slate-100">
            {value || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

function SubjectModal({ subject, onClose }) {
  if (!subject) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-white transition hover:bg-white/25"
            title="Đóng"
          >
            <span className="material-symbols-outlined text-[22px]">
              close
            </span>
          </button>

          <div className="flex items-center gap-4 pr-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <span className="material-symbols-outlined text-[30px]">
                menu_book
              </span>
            </div>

            <div>
              <p className="text-sm font-semibold text-blue-100">
                Chi tiết môn học
              </p>

              <h3 className="mt-1 text-2xl font-bold tracking-tight">
                {subject.subject_name || "Chưa có môn học"}
              </h3>

              <p className="mt-1 text-sm font-semibold text-blue-100">
                {subject.subject_code || "—"} · {subject.class_code || "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <InfoRow icon="class" label="Mã lớp" value={subject.class_code} />

          <InfoRow
            icon="person"
            label="Giảng viên"
            value={subject.teacher_name}
          />

          <InfoRow
            icon="mail"
            label="Email giảng viên"
            value={subject.teacher_email}
          />

          <InfoRow
            icon="meeting_room"
            label="Phòng học"
            value={subject.room_name || subject.room_code}
          />

          <InfoRow icon="apartment" label="Tòa nhà" value={subject.building} />

          <InfoRow
            icon="stairs"
            label="Tầng"
            value={formatFloor(subject.floor)}
          />

          <InfoRow
            icon="calendar_today"
            label="Thứ"
            value={dayViMap[subject.day_of_week] || subject.day_of_week}
          />

          <InfoRow
            icon="schedule"
            label="Giờ học"
            value={getDurationLabel(subject.start_time, subject.end_time)}
          />

          <InfoRow icon="school" label="Học kỳ" value={subject.semester} />

          <InfoRow
            icon="date_range"
            label="Năm học"
            value={subject.school_year}
          />

          <InfoRow
            icon="star"
            label="Tín chỉ"
            value={subject.credits ? `${subject.credits} tín chỉ` : "—"}
          />

          <InfoRow
            icon="group"
            label="Nhóm"
            value={subject.group_number ? `Nhóm ${subject.group_number}` : "—"}
          />
        </div>
      </div>
    </div>
  );
}

function ScheduleMetricCards({ rows = [] }) {
  const subjects = new Set(rows.map((item) => item.subject_code).filter(Boolean));
  const teachers = new Set(rows.map((item) => item.teacher_name).filter(Boolean));
  const rooms = new Set(rows.map((item) => item.room_code).filter(Boolean));

  const cards = [
    {
      icon: "menu_book",
      title: "Tổng lịch học",
      value: rows.length,
      tag: "Buổi học trong tuần",
      iconClass:
        "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
    },
    {
      icon: "auto_stories",
      title: "Môn học",
      value: subjects.size,
      tag: "Môn đang học",
      iconClass:
        "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300",
    },
    {
      icon: "person",
      title: "Giảng viên",
      value: teachers.size,
      tag: "Giảng viên phụ trách",
      iconClass:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
    },
    {
      icon: "meeting_room",
      title: "Phòng học",
      value: rooms.size,
      tag: "Phòng đang sử dụng",
      iconClass:
        "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.iconClass}`}
            >
              <span className="material-symbols-outlined text-[24px]">
                {card.icon}
              </span>
            </div>

            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {card.value}
            </p>
          </div>

          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            {card.title}
          </p>

          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {card.tag}
          </p>
        </div>
      ))}
    </div>
  );
}

function TodayScheduleCard({ rows = [], onSelectSubject }) {
  const todayDay = getTodayDayOfWeek();

  const todayRows = rows
    .filter((item) => item.day_of_week === todayDay)
    .sort((a, b) =>
      String(a.start_time || "").localeCompare(String(b.start_time || ""))
    );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Lịch học hôm nay
          </h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {dayViMap[todayDay] || todayDay}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
          <span className="material-symbols-outlined text-[24px]">
            today
          </span>
        </div>
      </div>

      {todayRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-950">
          <span className="material-symbols-outlined text-[42px] text-slate-400">
            event_busy
          </span>

          <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            Hôm nay chưa có lịch học
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {todayRows.map((item) => (
            <button
              key={`${item.id_schedule}-${item.start_time}`}
              type="button"
              onClick={() => onSelectSubject(item)}
              className="w-full rounded-2xl border-l-4 border-blue-600 bg-slate-50 p-4 text-left transition hover:bg-white hover:shadow-sm dark:bg-slate-950 dark:hover:bg-slate-800"
            >
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {item.subject_name || "Chưa có môn học"}
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {getDurationLabel(item.start_time, item.end_time)}
              </p>

              <p className="mt-2 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="material-symbols-outlined text-[15px]">
                  meeting_room
                </span>
                {item.room_name || item.room_code || "Chưa có phòng"}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function WeeklyCalendar({ rows = [], onSelectSubject }) {
  const todayDay = getTodayDayOfWeek();
  const gridHeight = (timeSlots.length - 1) * SLOT_HEIGHT;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Thời khóa biểu dạng lưới
          </h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Môn học sẽ kéo dài đúng theo thời gian bắt đầu và kết thúc
          </p>
        </div>

        <span className="w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
          Bấm vào ô môn học để xem chi tiết
        </span>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
            <div className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Giờ
            </div>

            {dayOrder.map((day) => (
              <div
                key={day}
                className={`px-4 py-3 text-center text-sm font-bold ${
                  day === todayDay
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                    : "text-slate-700 dark:text-slate-200"
                }`}
              >
                <p>{dayShortMap[day]}</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-400">
                  {dayViMap[day]}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-8">
            <div className="bg-slate-50 dark:bg-slate-950">
              {timeSlots.slice(0, -1).map((slot) => (
                <div
                  key={slot.value}
                  className="flex items-start justify-center border-b border-slate-100 px-4 py-3 text-xs font-bold text-slate-500 dark:border-slate-800 dark:text-slate-400"
                  style={{ height: `${SLOT_HEIGHT}px` }}
                >
                  {slot.label}
                </div>
              ))}
            </div>

            {dayOrder.map((day) => {
              const daySubjects = rows
                .filter((item) => item.day_of_week === day)
                .sort((a, b) =>
                  String(a.start_time || "").localeCompare(
                    String(b.start_time || "")
                  )
                );

              return (
                <div
                  key={day}
                  className={`relative border-l border-slate-100 dark:border-slate-800 ${
                    day === todayDay
                      ? "bg-blue-50/40 dark:bg-blue-950/20"
                      : "bg-white dark:bg-slate-900"
                  }`}
                  style={{ height: `${gridHeight}px` }}
                >
                  {timeSlots.slice(0, -1).map((slot) => (
                    <div
                      key={`${day}-${slot.value}`}
                      className="border-b border-slate-100 dark:border-slate-800"
                      style={{ height: `${SLOT_HEIGHT}px` }}
                    />
                  ))}

                  {daySubjects.map((item) => (
                    <button
                      key={`${item.id_schedule}-${item.day_of_week}-${item.start_time}`}
                      type="button"
                      onClick={() => onSelectSubject(item)}
                      className="absolute left-2 right-2 z-10 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 p-3 text-left text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      style={getScheduleBlockStyle(
                        item.start_time,
                        item.end_time
                      )}
                    >
                      <p className="line-clamp-2 text-sm font-bold">
                        {item.subject_name || "Môn học"}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-blue-100">
                        {getDurationLabel(item.start_time, item.end_time)}
                      </p>

                      <p className="mt-1 truncate text-xs text-blue-100">
                        {item.room_name || item.room_code || "Chưa có phòng"}
                      </p>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function DayListView({ rows = [], onSelectSubject }) {
  const grouped = groupScheduleByDay(rows);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Lịch học theo ngày
        </h3>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Danh sách môn học được nhóm theo thứ trong tuần
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        {grouped.map((group) => (
          <div
            key={group.day}
            className="min-h-[220px] rounded-3xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="mb-3 rounded-2xl bg-white px-3 py-2 text-center shadow-sm dark:bg-slate-900">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {group.label}
              </p>

              <p className="text-xs text-slate-400">
                {group.rows.length} lịch
              </p>
            </div>

            {group.rows.length === 0 ? (
              <div className="flex h-[130px] items-center justify-center rounded-2xl border border-dashed border-slate-300 text-center dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-400">Trống</p>
              </div>
            ) : (
              <div className="space-y-2">
                {group.rows.map((item) => (
                  <button
                    key={`${group.day}-${item.id_schedule}-${item.start_time}`}
                    type="button"
                    onClick={() => onSelectSubject(item)}
                    className="w-full rounded-2xl bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 dark:hover:bg-slate-800"
                  >
                    <p className="line-clamp-2 text-xs font-bold text-slate-900 dark:text-white">
                      {item.subject_name || "Môn học"}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {getDurationLabel(item.start_time, item.end_time)}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                      {item.room_name || item.room_code || "Chưa có phòng"}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScheduleTable({ rows = [], isFiltered, onSelectSubject }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Chi tiết lịch học ({rows.length} lịch)
          </h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Danh sách toàn bộ lịch học theo học kỳ và năm học
          </p>
        </div>

        {isFiltered && (
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
            Đang lọc
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-slate-50 dark:bg-slate-950">
            <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <th className="px-5 py-4">Môn học</th>
              <th className="px-5 py-4">Mã lớp</th>
              <th className="px-5 py-4">Thứ</th>
              <th className="px-5 py-4">Giờ</th>
              <th className="px-5 py-4">Giảng viên</th>
              <th className="px-5 py-4">Phòng</th>
              <th className="px-5 py-4">Học kỳ</th>
              <th className="px-5 py-4">Năm học</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.id_schedule}-${row.id_course_class || row.class_code}`}
                onClick={() => onSelectSubject(row)}
                className="cursor-pointer border-t border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950"
                title="Bấm để xem chi tiết"
              >
                <td className="px-5 py-4">
                  <p className="font-bold text-slate-800 dark:text-slate-100">
                    {row.subject_name || "—"}
                  </p>

                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {row.subject_code || "—"}
                    {row.credits ? ` · ${row.credits} tín chỉ` : ""}
                  </p>
                </td>

                <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                  <p className="font-semibold">{row.class_code || "—"}</p>

                  {row.group_number && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Nhóm {row.group_number}
                    </p>
                  )}
                </td>

                <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                  {dayViMap[row.day_of_week] || row.day_of_week || "—"}
                </td>

                <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                  {getDurationLabel(row.start_time, row.end_time)}
                </td>

                <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                  {row.teacher_name || "—"}
                </td>

                <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                  <p>{row.room_name || row.room_code || "—"}</p>

                  {row.building && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {row.building}
                      {row.floor ? ` · ${formatFloor(row.floor)}` : ""}
                    </p>
                  )}
                </td>

                <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                  {row.semester || "—"}
                </td>

                <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                  {row.school_year || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StudentSchedule() {
  const navigate = useNavigate();

  const [student] = useState(() => getStudentInfo());

  const [rawRows, setRawRows] = useState([]);
  const [semester, setSemester] = useState("");
  const [schoolYear, setSchoolYear] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedSubject, setSelectedSubject] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadSchedule = async () => {
      await Promise.resolve();

      const sid = getStudentId();

      if (!isMounted) return;

      if (!sid) {
        setMessage(
          "Chưa có studentId. Vui lòng đăng nhập bằng tài khoản sinh viên."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setMessage("");

        const res = await getMyStudentSchedule(sid, {});
        const rows = res?.success ? res.data || [] : res || [];

        if (!isMounted) return;

        setRawRows(Array.isArray(rows) ? rows : []);
      } catch (error) {
        console.error("Lỗi tải lịch học sinh viên:", error);

        if (isMounted) {
          setMessage(error.message || "Không thể tải lịch học sinh viên.");
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
  }, [refreshKey]);

  const semesterOptions = useMemo(
    () =>
      [...new Set(rawRows.map((item) => item.semester).filter(Boolean))].sort(),
    [rawRows]
  );

  const schoolYearOptions = useMemo(
    () =>
      [...new Set(rawRows.map((item) => item.school_year).filter(Boolean))].sort(),
    [rawRows]
  );

  const scheduleRows = useMemo(() => {
    let filtered = rawRows;

    if (semester) {
      filtered = filtered.filter((item) => item.semester === semester);
    }

    if (schoolYear) {
      filtered = filtered.filter((item) => item.school_year === schoolYear);
    }

    return filtered;
  }, [rawRows, semester, schoolYear]);

  const isFiltered = Boolean(semester || schoolYear);

  const resetFilter = () => {
    setSemester("");
    setSchoolYear("");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
        <Sidebar activePage="schedule" />

        <div className="flex min-h-screen flex-1 flex-col md:ml-[280px]">
          <Header student={student} />

          <main className="flex-1 p-4 md:p-6">
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Đang tải lịch học sinh viên...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar activePage="schedule" />

      <div className="flex min-h-screen flex-1 flex-col md:ml-[280px]">
        <Header student={student} />

        <main className="flex-1 p-4 md:p-6">
          <SubjectModal
            subject={selectedSubject}
            onClose={() => setSelectedSubject(null)}
          />

          <div className="mb-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 text-white shadow-lg shadow-blue-100 dark:shadow-none">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm text-blue-100">
                  <span className="material-symbols-outlined text-[18px]">
                    calendar_month
                  </span>
                  Lịch học sinh viên
                </div>

                <h2 className="text-3xl font-bold tracking-tight">
                  Lịch học cá nhân
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-blue-100">
                  Theo dõi thời khóa biểu, giảng viên, phòng học, học kỳ và năm
                  học của bạn.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/student/dashboard")}
                  className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/25"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    dashboard
                  </span>
                  Trang chủ
                </button>

                <button
                  type="button"
                  onClick={() => setRefreshKey((prev) => prev + 1)}
                  className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    refresh
                  </span>
                  Tải lại
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

          {!message && (
            <div className="space-y-6">
              <ScheduleMetricCards rows={scheduleRows} />

              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">
                    Thời khóa biểu
                  </h1>

                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Xem lịch học theo thứ trong tuần và lọc theo học kỳ, năm
                    học.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${
                        viewMode === "grid"
                          ? "bg-blue-600 text-white"
                          : "text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        calendar_view_week
                      </span>
                      Lưới
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${
                        viewMode === "list"
                          ? "bg-blue-600 text-white"
                          : "text-slate-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        view_agenda
                      </span>
                      Ngày
                    </button>
                  </div>

                  <select
                    value={semester}
                    onChange={(event) => setSemester(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-blue-500 dark:focus:ring-blue-950"
                  >
                    <option value="">Tất cả học kỳ</option>
                    {semesterOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <select
                    value={schoolYear}
                    onChange={(event) => setSchoolYear(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-blue-500 dark:focus:ring-blue-950"
                  >
                    <option value="">Tất cả năm học</option>
                    {schoolYearOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  {isFiltered && (
                    <button
                      type="button"
                      onClick={resetFilter}
                      className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        filter_alt_off
                      </span>
                      Xóa lọc
                    </button>
                  )}
                </div>
              </div>

              {scheduleRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <span className="material-symbols-outlined mb-4 text-[64px] text-slate-300 dark:text-slate-600">
                    event_busy
                  </span>

                  <p className="text-lg font-bold text-slate-600 dark:text-slate-300">
                    Bạn chưa có lịch học nào.
                  </p>

                  {isFiltered && (
                    <p className="mt-2 text-sm text-slate-400">
                      Thử xóa bộ lọc để xem tất cả lịch học.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
                    <TodayScheduleCard
                      rows={scheduleRows}
                      onSelectSubject={setSelectedSubject}
                    />

                    <div className="xl:col-span-3">
                      {viewMode === "grid" ? (
                        <WeeklyCalendar
                          rows={scheduleRows}
                          onSelectSubject={setSelectedSubject}
                        />
                      ) : (
                        <DayListView
                          rows={scheduleRows}
                          onSelectSubject={setSelectedSubject}
                        />
                      )}
                    </div>
                  </div>

                  <ScheduleTable
                    rows={scheduleRows}
                    isFiltered={isFiltered}
                    onSelectSubject={setSelectedSubject}
                  />
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}