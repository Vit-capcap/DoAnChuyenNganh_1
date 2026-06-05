import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Sidebar from "../components/teacher/Sidebar";
import Header from "../components/teacher/Header";

import {
  getTeacherSchedule,
  getTeacherSessionAttendance,
  updateTeacherAttendance,
  updateTeacherAttendanceBulk,
  getTeacherSessionById,
  updateTeacherSessionStatus,
} from "../../api/teacherApi";

const ATTENDANCE_CLOSE_BEFORE_END_MINUTES = 15;

/* =========================================================
   HELPER: LẤY THÔNG TIN GIÁO VIÊN
========================================================= */

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

function getInitials(name = "?") {
  return String(name)
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

/* =========================================================
   HELPER: NGÀY GIỜ
========================================================= */

function normalizeDateOnly(value) {
  if (!value) return "";

  const text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return text.slice(0, 10);
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function padTime(value) {
  if (!value) return "";

  const raw = String(value).trim();

  if (/^\d{2}:\d{2}:\d{2}$/.test(raw)) return raw;
  if (/^\d{2}:\d{2}$/.test(raw)) return `${raw}:00`;

  return raw.slice(0, 8);
}

function formatTime(value) {
  if (!value) return "--:--";
  return String(value).slice(0, 5);
}

function formatDate(value) {
  if (!value) return "Chưa có ngày";

  const safeDate = normalizeDateOnly(value);

  if (!safeDate) return "Chưa có ngày";

  const [year, month, day] = safeDate.split("-");

  if (!year || !month || !day) return safeDate;

  return `${day}/${month}/${year}`;
}

function buildDateTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;

  const date = normalizeDateOnly(dateValue);
  const time = padTime(timeValue);

  if (!date || !time) return null;

  const result = new Date(`${date}T${time}`);

  if (Number.isNaN(result.getTime())) return null;

  return result;
}

function formatDateTimeText(value) {
  if (!value) return "--";

  try {
    return value.toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "--";
  }
}

function formatDuration(ms) {
  if (ms <= 0) return "00 phút";

  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${String(minutes).padStart(2, "0")} phút`;
  }

  return `${hours} giờ ${String(minutes).padStart(2, "0")} phút`;
}

function formatCheckInTime(value) {
  if (!value) {
    return {
      time: "--:--:--",
      source: "Chưa ghi nhận",
    };
  }

  const raw = String(value);

  if (!raw.includes("T")) {
    return {
      time: raw.slice(0, 8),
      source: "Manual / Face ID",
    };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      time: "--:--:--",
      source: "Manual / Face ID",
    };
  }

  return {
    time: date.toLocaleTimeString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    source: "Manual / Face ID",
  };
}

function getCurrentTime() {
  return new Date().toTimeString().slice(0, 8);
}

/*
  QUY TẮC ĐIỂM DANH THỦ CÔNG:

  Vắng / Có mặt / Đi trễ đều được chuyển qua lại.

  - Chuyển sang PRESENT:
    check_in_time = giờ bắt đầu buổi học.

  - Chuyển sang LATE:
    check_in_time = giờ hiện tại.

  - Chuyển sang ABSENT:
    check_in_time = null.
*/
function getManualCheckInTimeByStatus(status, session) {
  if (status === "PRESENT") {
    return padTime(session?.startTime) || getCurrentTime();
  }

  if (status === "LATE") {
    return getCurrentTime();
  }

  return null;
}

function getManualMethodByStatus(status) {
  if (status === "PRESENT") return "Manual - sửa lỗi hệ thống";
  if (status === "LATE") return "Manual - đi trễ";
  return "Manual - vắng";
}

function getManualNoteByStatus(status) {
  if (status === "PRESENT") {
    return "Giáo viên chỉnh thủ công: có mặt do lỗi hệ thống";
  }

  if (status === "LATE") {
    return "Giáo viên chỉnh thủ công: đi trễ";
  }

  if (status === "ABSENT") {
    return "Giáo viên chỉnh thủ công: vắng";
  }

  return null;
}

/* =========================================================
   HELPER: TRẠNG THÁI
========================================================= */

function normalizeAttendanceStatus(status) {
  const value = String(status || "").toUpperCase();

  if (["PRESENT", "LATE", "ABSENT"].includes(value)) {
    return value;
  }

  return "ABSENT";
}

function getStatusConfig(status) {
  if (status === "PRESENT") {
    return {
      text: "Có mặt",
      activeClass:
        "bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm",
    };
  }

  if (status === "LATE") {
    return {
      text: "Đi trễ",
      activeClass: "bg-amber-100 text-amber-700 border-amber-200 shadow-sm",
    };
  }

  if (status === "ABSENT") {
    return {
      text: "Vắng",
      activeClass: "bg-red-100 text-red-700 border-red-200 shadow-sm",
    };
  }

  return {
    text: "Chưa điểm danh",
    activeClass: "bg-slate-100 text-slate-600 border-slate-200 shadow-sm",
  };
}

/* =========================================================
   HELPER: NORMALIZE DATA
========================================================= */

function normalizeSession(data = {}) {
  const raw =
    data?.session ||
    data?.sessionDetail ||
    data?.data?.session ||
    data?.data ||
    data ||
    {};

  return {
    idSession: raw.id_session || raw.idSession || raw.id || "",
    idSchedule: raw.id_schedule || raw.idSchedule || "",
    sessionDate: normalizeDateOnly(raw.session_date || raw.sessionDate || ""),
    sessionNumber: raw.session_number || raw.sessionNumber || "",
    sessionStatus: raw.status || raw.session_status || "NOT_STARTED",

    subjectName: raw.subject_name || raw.subjectName || "Chưa có môn học",
    subjectCode: raw.subject_code || raw.subjectCode || "",
    classCode: raw.class_code || raw.classCode || "Chưa có lớp",
    roomName: raw.room_name || raw.roomName || raw.room_code || "Chưa có phòng",
    startTime: raw.start_time || raw.startTime || "",
    endTime: raw.end_time || raw.endTime || "",
  };
}

function normalizeAttendance(item = {}) {
  return {
    idAttendance:
      item.id_attendance || item.attendance_id || item.idAttendance || item.id || null,
    idStudent: item.id_student || item.student_id || item.idStudent || null,
    studentCode: item.student_code || item.studentCode || "N/A",
    fullName: item.full_name || item.fullName || "Chưa có tên",
    email: item.email || "",
    avatar: item.avatar || "",
    className: item.class_name || item.className || "",
    status: normalizeAttendanceStatus(item.status || item.attendance_status),
    checkInTime: item.check_in_time || item.checkInTime || "",
    note: item.note || item.attendance_note || "",
    method: item.method || item.recognition_method || "",
  };
}

function normalizeSessionOption(item = {}) {
  return {
    idSession: item.id_session || item.idSession || "",
    idSchedule: item.id_schedule || item.idSchedule || "",
    subjectName: item.subject_name || item.subjectName || "Chưa có môn học",
    classCode: item.class_code || item.classCode || "Chưa có lớp",
    sessionDate: normalizeDateOnly(
      item.session_date || item.sessionDate || item.start_date || ""
    ),
    startTime: item.start_time || item.startTime || "",
    endTime: item.end_time || item.endTime || "",
    roomName: item.room_name || item.roomName || item.room_code || "",
  };
}

/* =========================================================
   HELPER: QUYỀN SỬA ĐIỂM DANH
========================================================= */

function getAttendancePermission(session, now = new Date()) {
  if (!session?.idSession) {
    return {
      canEdit: false,
      locked: true,
      reason: "Không tìm thấy buổi học để điểm danh.",
      phase: "NO_SESSION",
      closeAt: null,
      startAt: null,
      endAt: null,
      remainingText: "--",
    };
  }

  const startAt = buildDateTime(session.sessionDate, session.startTime);
  const endAt = buildDateTime(session.sessionDate, session.endTime);

  if (!startAt || !endAt) {
    return {
      canEdit: false,
      locked: true,
      reason:
        "Buổi học thiếu ngày học, giờ bắt đầu hoặc giờ kết thúc nên không thể điểm danh.",
      phase: "INVALID_TIME",
      closeAt: null,
      startAt,
      endAt,
      remainingText: "--",
    };
  }

  const closeAt = new Date(
    endAt.getTime() - ATTENDANCE_CLOSE_BEFORE_END_MINUTES * 60 * 1000
  );

  if (session.sessionStatus === "FINISHED") {
    return {
      canEdit: false,
      locked: true,
      reason:
        "Buổi học đã được khóa trong hệ thống. Muốn demo lại cần đổi status về ONGOING hoặc NOT_STARTED.",
      phase: "FINISHED",
      closeAt,
      startAt,
      endAt,
      remainingText: "Đã khóa",
    };
  }

  if (now < startAt) {
    return {
      canEdit: false,
      locked: true,
      reason: `Chưa đến giờ học. Điểm danh thủ công sẽ tự mở lúc ${formatDateTimeText(
        startAt
      )}.`,
      phase: "BEFORE_START",
      closeAt,
      startAt,
      endAt,
      remainingText: `Mở sau ${formatDuration(startAt.getTime() - now.getTime())}`,
    };
  }

  if (now >= closeAt) {
    return {
      canEdit: false,
      locked: true,
      reason: `Đã đến mốc khóa điểm danh. Hệ thống khóa trước giờ kết thúc ${ATTENDANCE_CLOSE_BEFORE_END_MINUTES} phút.`,
      phase: "CLOSED_BY_TIME",
      closeAt,
      startAt,
      endAt,
      remainingText: "Đã hết giờ",
    };
  }

  return {
    canEdit: true,
    locked: false,
    reason: `Đang trong thời gian cho phép điểm danh thủ công. Hệ thống sẽ tự khóa lúc ${formatDateTimeText(
      closeAt
    )}.`,
    phase: "OPEN",
    closeAt,
    startAt,
    endAt,
    remainingText: `Còn ${formatDuration(closeAt.getTime() - now.getTime())}`,
  };
}

/* =========================================================
   COMPONENT CON
========================================================= */

function StatCard({ icon, title, value, tag, iconClass }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <span className="material-symbols-outlined text-[24px]">{icon}</span>
        </div>

        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>

      <p className="text-sm font-semibold text-slate-600">{title}</p>
      <p className="mt-1 text-xs text-slate-400">{tag}</p>
    </div>
  );
}

function InfoMiniCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}

function AttendanceLockBanner({ permission }) {
  return (
    <div
      className={`mb-5 rounded-3xl border p-4 shadow-sm ${
        permission.canEdit
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-[24px]">
            {permission.canEdit ? "edit_calendar" : "lock"}
          </span>

          <div>
            <p className="text-sm font-black">
              {permission.canEdit
                ? "Đang mở điểm danh thủ công"
                : "Điểm danh đang bị khóa"}
            </p>

            <p className="mt-1 text-sm font-semibold opacity-90">
              {permission.reason}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white/70 px-4 py-2 text-sm font-black">
          {permission.remainingText}
        </div>
      </div>
    </div>
  );
}

function SessionInfoCard({ session, stats, permission }) {
  const statusConfig =
    session.sessionStatus === "FINISHED"
      ? {
          text: "Đã khóa trong hệ thống",
          className: "bg-red-100 text-red-700",
          dot: "bg-red-600",
        }
      : permission.canEdit
        ? {
            text: "Đang mở điểm danh",
            className: "bg-blue-100 text-blue-700",
            dot: "bg-blue-600 animate-pulse",
          }
        : permission.phase === "BEFORE_START"
          ? {
              text: "Chưa tới giờ mở",
              className: "bg-amber-100 text-amber-700",
              dot: "bg-amber-600",
            }
          : {
              text: "Đã khóa theo thời gian",
              className: "bg-red-100 text-red-700",
              dot: "bg-red-600",
            };

  return (
    <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-5">
        <div className="absolute -right-8 -top-8 text-blue-50">
          <span className="material-symbols-outlined text-[150px]">
            event_note
          </span>
        </div>

        <div className="relative">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <span className="material-symbols-outlined">menu_book</span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {session.subjectName}
              </h3>

              <p className="text-sm font-semibold text-slate-400">
                Buổi {session.sessionNumber || "N/A"} -{" "}
                {formatDate(session.sessionDate)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <InfoMiniCard label="Lớp" value={session.classCode} />
            <InfoMiniCard label="Phòng" value={session.roomName} />
            <InfoMiniCard
              label="Giờ học"
              value={`${formatTime(session.startTime)} - ${formatTime(
                session.endTime
              )}`}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Khóa điểm danh lúc
              </span>
              <p className="mt-1 text-sm font-black text-slate-800">
                {permission.closeAt
                  ? formatDateTimeText(permission.closeAt)
                  : "--"}
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Trạng thái
              </span>

              <div className="mt-1">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${statusConfig.className}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`}
                  />
                  {statusConfig.text}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-7 xl:grid-cols-4">
        <StatCard
          icon="check_circle"
          title="Có mặt"
          value={stats.present}
          tag={`/ ${stats.total} sinh viên`}
          iconClass="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          icon="cancel"
          title="Vắng"
          value={stats.absent}
          tag="ABSENT"
          iconClass="bg-red-50 text-red-600"
        />

        <StatCard
          icon="schedule"
          title="Đi trễ"
          value={stats.late}
          tag="LATE"
          iconClass="bg-amber-50 text-amber-600"
        />

        <StatCard
          icon="lock_clock"
          title="Trạng thái sửa"
          value={permission.canEdit ? "Mở" : "Khóa"}
          tag={permission.remainingText}
          iconClass={
            permission.canEdit
              ? "bg-blue-50 text-blue-600"
              : "bg-slate-100 text-slate-600"
          }
        />
      </div>
    </div>
  );
}

function AttendanceStatusButtons({ value, onChange, disabled }) {
  const statuses = ["PRESENT", "LATE", "ABSENT"];

  return (
    <div
      className={`inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm ${
        disabled ? "opacity-60" : ""
      }`}
    >
      {statuses.map((status) => {
        const config = getStatusConfig(status);
        const active = value === status;

        return (
          <button
            key={status}
            type="button"
            disabled={disabled}
            onClick={() => onChange(status)}
            className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition disabled:cursor-not-allowed ${
              active
                ? config.activeClass
                : "border-transparent text-slate-500 hover:bg-slate-50"
            }`}
          >
            {config.text}
          </button>
        );
      })}
    </div>
  );
}

function AttendanceTable({
  students,
  canEdit,
  onChangeStatus,
  onChangeNote,
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Danh sách sinh viên
          </h3>
          <p className="text-sm font-medium text-slate-500">
            {canEdit
              ? "Có thể cập nhật Có mặt / Đi trễ / Vắng thủ công trong thời gian cho phép."
              : "Điểm danh đã khóa, chỉ có thể xem dữ liệu."}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="w-16 px-6 py-4 font-bold">STT</th>
              <th className="px-6 py-4 font-bold">Sinh viên</th>
              <th className="w-40 px-6 py-4 font-bold">Mã SV</th>
              <th className="w-80 px-6 py-4 text-center font-bold">
                Trạng thái điểm danh
              </th>
              <th className="w-40 px-6 py-4 font-bold">Thời gian</th>
              <th className="px-6 py-4 font-bold">Ghi chú</th>
            </tr>
          </thead>

          <tbody>
            {students.map((student, index) => {
              const time = formatCheckInTime(student.checkInTime);

              return (
                <tr
                  key={`${student.idStudent}-${student.idAttendance || "new"}`}
                  className="group border-t border-slate-100 transition hover:bg-blue-50/50"
                >
                  <td className="px-6 py-4 text-sm font-semibold text-slate-400">
                    {index + 1}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {student.avatar ? (
                        <img
                          src={student.avatar}
                          alt={student.fullName}
                          className="h-10 w-10 rounded-2xl border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-sm font-bold text-blue-700">
                          {getInitials(student.fullName)}
                        </div>
                      )}

                      <div>
                        <p className="text-sm font-bold text-slate-800 transition group-hover:text-blue-700">
                          {student.fullName}
                        </p>
                        <p className="text-xs font-medium text-slate-400">
                          {student.email || student.className || "Sinh viên"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-mono text-sm font-semibold text-slate-500">
                    {student.studentCode}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <AttendanceStatusButtons
                      value={student.status}
                      disabled={!canEdit}
                      onChange={(status) => onChangeStatus(student, status)}
                    />
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-xs font-semibold text-slate-600">
                      {time.time}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400">
                      {student.method || time.source}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={student.note || ""}
                      disabled={!canEdit}
                      onChange={(event) =>
                        onChangeNote(student.idStudent, event.target.value)
                      }
                      placeholder={
                        canEdit ? "Thêm ghi chú..." : "Đã khóa ghi chú"
                      }
                      className="w-full rounded-xl border border-transparent bg-transparent px-3 py-2 text-sm font-medium text-slate-600 outline-none transition hover:border-slate-200 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                    />
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
          Đang tải dữ liệu điểm danh...
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
          group_off
        </span>
      </div>

      <h2 className="text-xl font-bold text-slate-900">
        Chưa có dữ liệu điểm danh
      </h2>

      <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-slate-500">
        Buổi học này chưa có danh sách sinh viên hoặc backend chưa tạo bản ghi
        điểm danh cho sinh viên.
      </p>
    </div>
  );
}

/* =========================================================
   PAGE CHÍNH
========================================================= */

export default function TeacherAttendance() {
  const navigate = useNavigate();
  const { sessionId, id } = useParams();

  const routeSessionId = sessionId || id;
  const teacher = useMemo(() => getTeacherInfo(), []);
  const teacherId = useMemo(() => getTeacherId(), []);

  const [selectedSessionId, setSelectedSessionId] = useState(
    routeSessionId || ""
  );

  const activeSessionId = routeSessionId || selectedSessionId;

  const [sessionOptions, setSessionOptions] = useState([]);
  const [session, setSession] = useState(() => normalizeSession({}));
  const [students, setStudents] = useState([]);
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const permission = useMemo(() => {
    return getAttendancePermission(session, now);
  }, [session, now]);

  const autoTimeMessage = useMemo(() => {
    if (!session?.idSession) return "";

    if (permission.phase === "BEFORE_START") {
      return `Điểm danh thủ công chưa mở. Hệ thống sẽ tự mở lúc ${
        permission.startAt ? formatDateTimeText(permission.startAt) : "--"
      }.`;
    }

    if (permission.phase === "OPEN") {
      return `Điểm danh thủ công đang mở. Hệ thống sẽ tự khóa lúc ${
        permission.closeAt ? formatDateTimeText(permission.closeAt) : "--"
      }.`;
    }

    if (permission.phase === "CLOSED_BY_TIME") {
      return `Đã đến mốc khóa điểm danh trước giờ kết thúc ${ATTENDANCE_CLOSE_BEFORE_END_MINUTES} phút.`;
    }

    return "";
  }, [
    session?.idSession,
    permission.phase,
    permission.startAt,
    permission.closeAt,
  ]);

  useEffect(() => {
    let isMounted = true;

    async function fetchAttendance() {
      try {
        let targetSessionId = activeSessionId;

        if (!targetSessionId) {
          if (!teacherId) {
            if (isMounted) {
              setMessage(
                "Không tìm thấy teacherId. Vui lòng đăng nhập lại bằng tài khoản giáo viên."
              );
              setStudents([]);
              setLoading(false);
            }

            return;
          }

          const scheduleData = await getTeacherSchedule(teacherId, {
            view: "week",
          });

          if (!isMounted) return;

          const rawSchedules =
            scheduleData?.schedules ||
            scheduleData?.sessions ||
            scheduleData?.data ||
            [];

          const options = rawSchedules
            .map(normalizeSessionOption)
            .filter((item) => item.idSession);

          setSessionOptions(options);

          if (options.length === 0) {
            setMessage(
              "Chưa có buổi học nào được tạo. Hãy vào trang Buổi học và bấm Tạo buổi trước khi điểm danh."
            );
            setStudents([]);
            setLoading(false);
            return;
          }

          targetSessionId = options[0].idSession;
          setSelectedSessionId(targetSessionId);
        }

        const [sessionData, attendanceData] = await Promise.all([
          getTeacherSessionById(targetSessionId),
          getTeacherSessionAttendance(targetSessionId),
        ]);

        if (!isMounted) return;

        const rawStudents =
          attendanceData?.attendances ||
          attendanceData?.attendance ||
          attendanceData?.students ||
          attendanceData?.data ||
          [];

        setSession(normalizeSession(sessionData));
        setStudents(rawStudents.map(normalizeAttendance));
        setMessage("");
      } catch (error) {
        console.error("Lỗi tải dữ liệu điểm danh:", error);

        if (isMounted) {
          setMessage(error.message || "Không thể tải dữ liệu điểm danh.");
          setStudents([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchAttendance();

    return () => {
      isMounted = false;
    };
  }, [activeSessionId, teacherId, refreshKey]);

  const stats = useMemo(() => {
    const total = students.length;
    const present = students.filter((item) => item.status === "PRESENT").length;
    const absent = students.filter((item) => item.status === "ABSENT").length;
    const late = students.filter((item) => item.status === "LATE").length;
    const unknown = students.filter(
      (item) => !["PRESENT", "ABSENT", "LATE"].includes(item.status)
    ).length;

    return {
      total,
      present,
      absent,
      late,
      unknown,
    };
  }, [students]);

  const handleSelectSession = (value) => {
    setSelectedSessionId(value);
    setLoading(true);
    setSuccessMessage("");
    setMessage("");

    if (value) {
      navigate(`/teacher/attendance/${value}`);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setSuccessMessage("");
    setMessage("");
    setRefreshKey((prev) => prev + 1);
  };

  const ensureCanEdit = () => {
    if (!permission.canEdit) {
      setMessage(permission.reason);
      return false;
    }

    return true;
  };

  const updateLocalStudent = (studentId, status, checkInTime, method, note) => {
    setStudents((prev) =>
      prev.map((item) =>
        item.idStudent === studentId
          ? {
              ...item,
              status,
              checkInTime: checkInTime || "",
              method,
              note: note || item.note || "",
            }
          : item
      )
    );
  };

  const handleChangeStatus = async (student, status) => {
    if (!ensureCanEdit()) return;

    if (!activeSessionId) {
      setMessage("Thiếu sessionId, không thể cập nhật điểm danh.");
      return;
    }

    if (!student?.idStudent) {
      setMessage("Thiếu id_student, không thể cập nhật điểm danh.");
      return;
    }

    const oldStudents = students;
    const checkInTime = getManualCheckInTimeByStatus(status, session);
    const manualMethod = getManualMethodByStatus(status);
    const manualNote = getManualNoteByStatus(status);

    updateLocalStudent(
      student.idStudent,
      status,
      checkInTime,
      manualMethod,
      manualNote
    );

    try {
      /*
        Nếu đã có id_attendance:
        - update trực tiếp bản ghi đó.
      */
      if (student.idAttendance) {
        await updateTeacherAttendance(student.idAttendance, {
          status,
          check_in_time: checkInTime,
          note: manualNote,
        });
      } else {
        /*
          Nếu chưa có id_attendance:
          - dùng bulk để backend tạo mới bản ghi điểm danh.
          - backend cần hỗ trợ upsert theo id_session + id_student.
        */
        await updateTeacherAttendanceBulk(activeSessionId, {
          attendances: [
            {
              id_attendance: null,
              id_student: student.idStudent,
              status,
              check_in_time: checkInTime,
              note: manualNote,
            },
          ],
        });
      }

      setMessage("");

      setSuccessMessage(
        status === "PRESENT"
          ? "Đã chuyển sang Có mặt. Thời gian điểm danh được đặt bằng giờ bắt đầu buổi học."
          : status === "LATE"
            ? "Đã chuyển sang Đi trễ. Thời gian điểm danh được đặt bằng giờ hiện tại."
            : "Đã chuyển sang Vắng. Thời gian điểm danh đã được xóa."
      );

      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Lỗi cập nhật nhanh điểm danh:", error);

      setStudents(oldStudents);
      setMessage(error.message || "Không thể cập nhật trạng thái điểm danh.");
    }
  };

  const handleChangeNote = (studentId, note) => {
    if (!permission.canEdit) return;

    setStudents((prev) =>
      prev.map((item) =>
        item.idStudent === studentId
          ? {
              ...item,
              note,
            }
          : item
      )
    );
  };

  const handleSaveAll = async () => {
    if (!ensureCanEdit()) return;

    if (!activeSessionId) {
      setMessage("Thiếu sessionId, không thể lưu điểm danh.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setSuccessMessage("");

      const attendances = students
        .filter((item) => item.idStudent)
        .map((item) => {
          let checkInTime = null;

          if (item.status === "PRESENT") {
            checkInTime = item.checkInTime || padTime(session.startTime);
          } else if (item.status === "LATE") {
            checkInTime = item.checkInTime || getCurrentTime();
          }

          return {
            id_attendance: item.idAttendance || null,
            id_student: item.idStudent,
            status: item.status,
            check_in_time: checkInTime,
            note: item.note || getManualNoteByStatus(item.status),
          };
        });

      await updateTeacherAttendanceBulk(activeSessionId, {
        attendances,
      });

      setSuccessMessage("Lưu điểm danh thành công.");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Lỗi lưu điểm danh:", error);
      setMessage(error.message || "Không thể lưu điểm danh.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportReport = () => {
    if (!activeSessionId) {
      setMessage("Thiếu sessionId, không thể xuất báo cáo.");
      return;
    }

    navigate(`/teacher/attendance/report/${activeSessionId}`);
  };

  const handleLockAttendance = async () => {
    if (!activeSessionId) {
      setMessage("Thiếu sessionId, không thể khóa điểm danh.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setSuccessMessage("");

      await updateTeacherSessionStatus(activeSessionId, "FINISHED");

      setSuccessMessage("Đã khóa điểm danh và kết thúc buổi học.");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Lỗi khóa điểm danh:", error);
      setMessage(error.message || "Không thể khóa điểm danh.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar activePage="attendance" />

      <div className="flex min-h-screen flex-1 flex-col md:ml-[280px]">
        <Header teacher={teacher} />

        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 text-white shadow-lg shadow-blue-100">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm text-blue-100">
                  <button
                    type="button"
                    onClick={() => navigate("/teacher/sessions")}
                    className="font-semibold transition hover:text-white"
                  >
                    Buổi học
                  </button>

                  <span className="material-symbols-outlined text-[18px]">
                    chevron_right
                  </span>

                  <span>Điểm danh</span>
                </div>

                <h2 className="text-3xl font-bold tracking-tight">
                  Điểm danh lớp học
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-blue-100">
                  Có thể chỉnh thủ công Vắng / Có mặt / Đi trễ trong thời gian
                  cho phép. Khi chuyển sang Có mặt, thời gian sẽ lấy giờ bắt đầu
                  buổi học.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={loading || saving}
                  className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    refresh
                  </span>
                  Làm mới
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/teacher/sessions")}
                  className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/25"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    event_note
                  </span>
                  Buổi học
                </button>

                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={
                    saving ||
                    loading ||
                    students.length === 0 ||
                    !permission.canEdit
                  }
                  className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    save
                  </span>
                  {saving ? "Đang lưu..." : "Lưu điểm danh"}
                </button>
              </div>
            </div>
          </div>

          {sessionOptions.length > 0 && !routeSessionId && (
            <div className="mb-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Chọn buổi học cần điểm danh
              </label>

              <select
                value={selectedSessionId}
                onChange={(event) => handleSelectSession(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              >
                {sessionOptions.map((item) => (
                  <option key={item.idSession} value={item.idSession}>
                    {item.subjectName} - {item.classCode} -{" "}
                    {formatDate(item.sessionDate)} - {formatTime(item.startTime)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {message && (
            <div className="mb-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              <span className="material-symbols-outlined text-[20px]">
                error
              </span>
              <span>{message}</span>
            </div>
          )}

          {(successMessage || autoTimeMessage) && (
            <div className="mb-5 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              <span className="material-symbols-outlined text-[20px]">
                check_circle
              </span>
              <span>{successMessage || autoTimeMessage}</span>
            </div>
          )}

          {loading ? (
            <LoadingState />
          ) : (
            <>
              <AttendanceLockBanner permission={permission} />

              <SessionInfoCard
                session={session}
                stats={stats}
                permission={permission}
              />

              {students.length === 0 ? (
                <EmptyState />
              ) : (
                <AttendanceTable
                  students={students}
                  canEdit={permission.canEdit}
                  onChangeStatus={handleChangeStatus}
                  onChangeNote={handleChangeNote}
                />
              )}

              <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={handleExportReport}
                  disabled={!activeSessionId}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    print
                  </span>
                  Xuất báo cáo
                </button>

                <button
                  type="button"
                  onClick={handleLockAttendance}
                  disabled={saving || loading || !activeSessionId}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    lock
                  </span>
                  Khóa điểm danh
                </button>

                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={
                    saving ||
                    loading ||
                    students.length === 0 ||
                    !permission.canEdit
                  }
                  className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    save
                  </span>
                  {saving ? "Đang lưu..." : "Lưu điểm danh"}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}