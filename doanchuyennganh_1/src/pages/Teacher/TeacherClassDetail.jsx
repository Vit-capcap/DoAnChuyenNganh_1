import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import Sidebar from "../components/teacher/Sidebar";
import Header from "../components/teacher/Header";

import {
  getTeacherClassDetail,
  getTeacherClassSchedules,
  getTeacherClassSessions,
  getTeacherClassStudents,
} from "../../api/teacherApi";

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

function getInitials(name = "?") {
  return String(name)
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

function getAttendanceColor(percent) {
  if (percent >= 90) return "bg-emerald-500";
  if (percent >= 70) return "bg-blue-500";
  if (percent >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function getStatusBadge(status) {
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

function getSessionStatus(status) {
  const normalizedStatus = String(status || "NOT_STARTED").toUpperCase();

  if (normalizedStatus === "FINISHED") {
    return {
      text: "Đã kết thúc",
      className: "bg-emerald-50 text-emerald-700",
    };
  }

  if (normalizedStatus === "ONGOING") {
    return {
      text: "Đang diễn ra",
      className: "bg-blue-50 text-blue-700",
    };
  }

  return {
    text: "Chưa bắt đầu",
    className: "bg-slate-100 text-slate-600",
  };
}

function formatDate(value) {
  if (!value) return "Chưa có ngày";

  try {
    return new Date(value).toLocaleDateString("vi-VN");
  } catch {
    return value;
  }
}

function formatTime(value) {
  if (!value) return "--:--";

  try {
    return String(value).slice(0, 5);
  } catch {
    return value;
  }
}

function normalizeClassDetail(data = {}) {
  return {
    id: data.id_course_class || data.id || data.course_class_id || "",
    classCode: data.class_code || data.classCode || "Chưa có mã lớp",
    subjectName: data.subject_name || data.subjectName || "Chưa có môn học",
    subjectCode: data.subject_code || data.subjectCode || "N/A",
    credits: safeNumber(data.credits),
    teacherName: data.teacher_name || data.teacherName || "",
    semester: data.semester || "Chưa có học kỳ",
    schoolYear: data.school_year || data.schoolYear || "Chưa có năm học",
    groupNumber: data.group_number || data.groupNumber || "",
    roomName:
      data.room_name ||
      data.roomName ||
      data.room_code ||
      data.roomCode ||
      "Chưa có phòng",
    roomCode: data.room_code || data.roomCode || "",
    building: data.building || "",
    floor: data.floor || "",
    totalStudents: safeNumber(
      data.total_students || data.totalStudents || data.student_count
    ),
    maxStudent: safeNumber(data.max_student || data.maxStudent || 0),
    totalAttendance: safeNumber(data.total_attendance || data.totalAttendance),
    attendedCount: safeNumber(data.attended_count || data.attendedCount),
    presentCount: safeNumber(data.present_count || data.presentCount),
    lateCount: safeNumber(data.late_count || data.lateCount),
    absentCount: safeNumber(data.absent_count || data.absentCount),
    attendancePercent: safeNumber(
      data.attendance_percent ||
        data.attendancePercent ||
        data.avg_attendance_percent ||
        data.attendanceRate
    ),
    status: String(data.status || data.course_status || "OPEN").toUpperCase(),
  };
}

function normalizeStudent(item = {}) {
  const totalAttendance = safeNumber(
    item.total_attendance || item.totalAttendance
  );

  const attendedCount =
    safeNumber(item.present_count || item.presentCount) +
    safeNumber(item.late_count || item.lateCount);

  const attendancePercent =
    item.attendance_percent !== undefined || item.attendancePercent !== undefined
      ? safeNumber(item.attendance_percent || item.attendancePercent)
      : totalAttendance > 0
        ? (attendedCount / totalAttendance) * 100
        : 0;

  return {
    id: item.id_student || item.student_id || item.id || item.student_code,
    studentCode: item.student_code || item.studentCode || "N/A",
    fullName: item.full_name || item.fullName || "Chưa có tên",
    gender: item.gender || "",
    phone: item.phone || "",
    email: item.email || "Chưa có email",
    avatar: item.avatar || "",
    className: item.class_name || item.className || "",
    faculty: item.faculty || "",
    courseYear: item.course_year || item.courseYear || "",
    enrollmentStatus: item.enrollment_status || item.status || "STUDYING",
    faceRegistered:
      item.face_registered === true ||
      item.has_face === true ||
      Boolean(item.id_face) ||
      Boolean(item.face_image) ||
      Boolean(item.face_embedding),
    totalAttendance,
    presentCount: safeNumber(item.present_count || item.presentCount),
    lateCount: safeNumber(item.late_count || item.lateCount),
    absentCount: safeNumber(item.absent_count || item.absentCount),
    attendancePercent,
  };
}

function normalizeSchedule(item = {}) {
  return {
    id: item.id_schedule || item.id || "",
    dayOfWeek: item.day_of_week || item.dayOfWeek || "",
    startTime: item.start_time || item.startTime || "",
    endTime: item.end_time || item.endTime || "",
    startDate: item.start_date || item.startDate || "",
    endDate: item.end_date || item.endDate || "",
    roomCode: item.room_code || item.roomCode || "",
    roomName: item.room_name || item.roomName || "Chưa có phòng",
    building: item.building || "",
    floor: item.floor || "",
  };
}

function normalizeSession(item = {}) {
  const totalStudents = safeNumber(item.totalStudents || item.total_students);
  const attendedStudents = safeNumber(
    item.attendedStudents || item.attended_students
  );

  const attendancePercent =
    totalStudents > 0 ? (attendedStudents / totalStudents) * 100 : 0;

  return {
    id: item.id_session || item.id || "",
    scheduleId: item.id_schedule || item.scheduleId || "",
    sessionDate: item.session_date || item.sessionDate || "",
    sessionNumber: item.session_number || item.sessionNumber || "",
    status: item.session_status || item.status || "NOT_STARTED",
    dayOfWeek: item.day_of_week || item.dayOfWeek || "",
    startTime: item.start_time || item.startTime || "",
    endTime: item.end_time || item.endTime || "",
    totalStudents,
    attendedStudents,
    presentCount: safeNumber(item.present_count || item.presentCount),
    lateCount: safeNumber(item.late_count || item.lateCount),
    absentCount: safeNumber(item.absent_count || item.absentCount),
    attendancePercent,
  };
}

function OverviewItem({ label, value, icon }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <div className="flex items-center gap-2">
        {icon && (
          <span className="material-symbols-outlined text-[18px] text-blue-600">
            {icon}
          </span>
        )}

        <p className="truncate text-sm font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, iconClass, tag }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <span className="material-symbols-outlined text-[24px]">{icon}</span>
        </div>

        <p className="text-3xl font-black text-slate-900">{value}</p>
      </div>

      <p className="text-sm font-bold text-slate-600">{title}</p>
      <p className="mt-1 text-xs font-semibold text-slate-400">{tag}</p>
    </div>
  );
}

function TabButton({ active, icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
        active
          ? "border-blue-600 text-blue-700"
          : "border-transparent text-slate-500 hover:border-blue-200 hover:text-blue-600"
      }`}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      {label}
    </button>
  );
}

function FaceBadge({ registered }) {
  if (registered) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
        Đã đăng ký
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Chưa đăng ký
    </span>
  );
}

function StudentsTable({ students = [], onViewStudent }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-6 py-4 font-bold">Mã SV</th>
              <th className="px-6 py-4 font-bold">Họ tên</th>
              <th className="px-6 py-4 font-bold">Email</th>
              <th className="px-6 py-4 font-bold">Khuôn mặt</th>
              <th className="px-6 py-4 text-center font-bold">Có mặt</th>
              <th className="px-6 py-4 text-center font-bold">Vắng</th>
              <th className="px-6 py-4 text-center font-bold">Chuyên cần</th>
              <th className="px-6 py-4 text-right font-bold">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {students.map((student) => {
              const percent = Math.min(
                Math.max(student.attendancePercent, 0),
                100
              );

              return (
                <tr
                  key={student.id}
                  className="border-t border-slate-100 transition hover:bg-blue-50/50"
                >
                  <td className="px-6 py-4 text-sm font-bold text-blue-700">
                    {student.studentCode}
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
                        <p className="text-sm font-bold text-slate-800">
                          {student.fullName}
                        </p>
                        <p className="text-xs font-medium text-slate-400">
                          {student.className || "Sinh viên"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm font-medium text-slate-500">
                    {student.email}
                  </td>

                  <td className="px-6 py-4">
                    <FaceBadge registered={student.faceRegistered} />
                  </td>

                  <td className="px-6 py-4 text-center text-sm font-black text-emerald-600">
                    {student.presentCount + student.lateCount}
                  </td>

                  <td className="px-6 py-4 text-center text-sm font-black text-red-600">
                    {student.absentCount}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <span
                        className={`text-sm font-bold ${
                          percent < 70 ? "text-red-600" : "text-slate-700"
                        }`}
                      >
                        {percent.toFixed(0)}%
                      </span>

                      <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${getAttendanceColor(
                            percent
                          )}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onViewStudent(student)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-blue-600 transition hover:bg-blue-50"
                      title="Xem chi tiết"
                    >
                      <span className="material-symbols-outlined text-[21px]">
                        visibility
                      </span>
                    </button>
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

function ClassInfoPanel({ classDetail, schedules }) {
  const statusBadge = getStatusBadge(classDetail.status);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-black text-slate-900">
              Thông tin lớp học phần
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Thông tin được lấy từ CourseClass, Subject, Teacher và Schedule.
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadge.className}`}
          >
            {statusBadge.text}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <OverviewItem
            label="Mã lớp học phần"
            value={classDetail.classCode}
            icon="class"
          />
          <OverviewItem
            label="Tên môn học"
            value={classDetail.subjectName}
            icon="menu_book"
          />
          <OverviewItem
            label="Mã môn học"
            value={classDetail.subjectCode}
            icon="badge"
          />
          <OverviewItem
            label="Số tín chỉ"
            value={`${classDetail.credits || 0} tín chỉ`}
            icon="workspace_premium"
          />
          <OverviewItem
            label="Giảng viên"
            value={classDetail.teacherName || "Chưa có dữ liệu"}
            icon="person"
          />
          <OverviewItem
            label="Nhóm"
            value={classDetail.groupNumber || "Không có"}
            icon="groups"
          />
          <OverviewItem
            label="Học kỳ"
            value={`${classDetail.semester} - ${classDetail.schoolYear}`}
            icon="calendar_month"
          />
          <OverviewItem
            label="Sĩ số tối đa"
            value={
              classDetail.maxStudent
                ? `${classDetail.maxStudent} sinh viên`
                : "Chưa thiết lập"
            }
            icon="group"
          />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-black text-slate-900">Phòng học</h3>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Phòng học lấy từ Schedule và ClassRoom.
        </p>

        <div className="mt-5 space-y-3">
          <OverviewItem
            label="Phòng"
            value={classDetail.roomName}
            icon="meeting_room"
          />
          <OverviewItem
            label="Mã phòng"
            value={classDetail.roomCode || "N/A"}
            icon="door_front"
          />
          <OverviewItem
            label="Tòa nhà"
            value={classDetail.building || "N/A"}
            icon="apartment"
          />
          <OverviewItem
            label="Tầng"
            value={classDetail.floor || "N/A"}
            icon="stairs"
          />
          <OverviewItem
            label="Số lịch học"
            value={`${schedules.length} lịch`}
            icon="event"
          />
        </div>
      </div>
    </div>
  );
}

function SchedulePanel({ schedules }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
        <h3 className="text-lg font-black text-slate-900">Lịch học</h3>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Danh sách lịch học cố định của lớp học phần.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-6 py-4 font-bold">Thứ</th>
              <th className="px-6 py-4 font-bold">Thời gian</th>
              <th className="px-6 py-4 font-bold">Phòng</th>
              <th className="px-6 py-4 font-bold">Ngày bắt đầu</th>
              <th className="px-6 py-4 font-bold">Ngày kết thúc</th>
            </tr>
          </thead>

          <tbody>
            {schedules.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm font-semibold text-slate-400"
                >
                  Chưa có lịch học cho lớp này.
                </td>
              </tr>
            ) : (
              schedules.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-slate-100 transition hover:bg-blue-50/50"
                >
                  <td className="px-6 py-4 text-sm font-bold text-blue-700">
                    {item.dayOfWeek}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-700">
                    {formatTime(item.startTime)} - {formatTime(item.endTime)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                    {item.roomName}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                    {formatDate(item.startDate)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                    {formatDate(item.endDate)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SessionsPanel({ sessions, onOpenAttendance }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
        <h3 className="text-lg font-black text-slate-900">Buổi học</h3>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Các buổi học đã được tạo từ lịch học.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-6 py-4 font-bold">Ngày học</th>
              <th className="px-6 py-4 font-bold">Tiết/Buổi</th>
              <th className="px-6 py-4 font-bold">Thời gian</th>
              <th className="px-6 py-4 font-bold">Trạng thái</th>
              <th className="px-6 py-4 text-center font-bold">Có mặt</th>
              <th className="px-6 py-4 text-center font-bold">Vắng</th>
              <th className="px-6 py-4 text-center font-bold">Tỷ lệ</th>
              <th className="px-6 py-4 text-right font-bold">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-10 text-center text-sm font-semibold text-slate-400"
                >
                  Chưa có buổi học nào được tạo.
                </td>
              </tr>
            ) : (
              sessions.map((item) => {
                const statusBadge = getSessionStatus(item.status);

                return (
                  <tr
                    key={item.id}
                    className="border-t border-slate-100 transition hover:bg-blue-50/50"
                  >
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">
                      {formatDate(item.sessionDate)}
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                      Buổi {item.sessionNumber || "N/A"}
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                      {formatTime(item.startTime)} - {formatTime(item.endTime)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadge.className}`}
                      >
                        {statusBadge.text}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center text-sm font-black text-emerald-600">
                      {item.presentCount + item.lateCount}
                    </td>

                    <td className="px-6 py-4 text-center text-sm font-black text-red-600">
                      {item.absentCount}
                    </td>

                    <td className="px-6 py-4 text-center text-sm font-black text-blue-600">
                      {item.attendancePercent.toFixed(0)}%
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenAttendance(item)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                      >
                        Điểm danh
                        <span className="material-symbols-outlined text-[18px]">
                          fact_check
                        </span>
                      </button>
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

function StatisticsPanel({ classDetail, students, sessions }) {
  const registeredFaceCount = students.filter(
    (student) => student.faceRegistered
  ).length;

  const avgAttendance =
    students.length > 0
      ? students.reduce(
          (sum, student) => sum + Number(student.attendancePercent || 0),
          0
        ) / students.length
      : 0;

  const lowAttendanceStudents = students.filter(
    (student) => student.attendancePercent < 70
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Tổng sinh viên"
          value={students.length}
          icon="groups"
          iconClass="bg-blue-50 text-blue-600"
          tag="Enrollment"
        />

        <StatCard
          title="Đã có khuôn mặt"
          value={registeredFaceCount}
          icon="face"
          iconClass="bg-emerald-50 text-emerald-600"
          tag="FaceData"
        />

        <StatCard
          title="Buổi học"
          value={sessions.length}
          icon="event_note"
          iconClass="bg-indigo-50 text-indigo-600"
          tag="Session"
        />

        <StatCard
          title="Chuyên cần TB"
          value={`${avgAttendance.toFixed(0)}%`}
          icon="percent"
          iconClass="bg-amber-50 text-amber-600"
          tag="Attendance"
        />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              Tổng quan chuyên cần
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Dựa trên số liệu điểm danh của lớp {classDetail.classCode}.
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              lowAttendanceStudents > 0
                ? "bg-red-50 text-red-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {lowAttendanceStudents} sinh viên dưới 70%
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${getAttendanceColor(
              avgAttendance
            )}`}
            style={{ width: `${Math.min(Math.max(avgAttendance, 0), 100)}%` }}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <OverviewItem
            label="PRESENT"
            value={`${classDetail.presentCount} lượt`}
            icon="check_circle"
          />
          <OverviewItem
            label="LATE"
            value={`${classDetail.lateCount} lượt`}
            icon="schedule"
          />
          <OverviewItem
            label="ABSENT"
            value={`${classDetail.absentCount} lượt`}
            icon="cancel"
          />
        </div>
      </div>
    </div>
  );
}

function EmptyStudents() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
        <span className="material-symbols-outlined text-[34px]">group_off</span>
      </div>

      <h2 className="text-xl font-bold text-slate-900">
        Không tìm thấy sinh viên
      </h2>

      <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-slate-500">
        Danh sách sinh viên trống hoặc không khớp với từ khóa tìm kiếm hiện tại.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
      <div className="flex min-h-[260px] flex-col items-center justify-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

        <p className="text-sm font-semibold text-slate-600">
          Đang tải chi tiết lớp học...
        </p>
      </div>
    </div>
  );
}

export default function TeacherClassDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const courseClassId =
    params.courseClassId || params.id || params.classId || "";

  const teacher = useMemo(() => getTeacherInfo(), []);

  const [classDetail, setClassDetail] = useState(() =>
    normalizeClassDetail(location.state?.classData || {})
  );
  const [students, setStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeTab, setActiveTab] = useState("students");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadClassDetail() {
      if (!courseClassId) {
        if (isMounted) {
          setMessage("Không tìm thấy id lớp học phần.");
          setLoading(false);
        }

        return;
      }

      try {
        setLoading(true);
        setMessage("");

        const [detailData, studentData, scheduleData, sessionData] =
          await Promise.all([
            getTeacherClassDetail(courseClassId),
            getTeacherClassStudents(courseClassId),
            getTeacherClassSchedules(courseClassId),
            getTeacherClassSessions(courseClassId),
          ]);

        if (!isMounted) return;

        const detail =
          detailData?.classDetail ||
          detailData?.courseClass ||
          detailData?.data ||
          detailData ||
          location.state?.classData ||
          {};

        const rawStudents =
          studentData?.students ||
          studentData?.data ||
          studentData?.enrollments ||
          [];

        const rawSchedules =
          scheduleData?.schedules ||
          scheduleData?.data ||
          [];

        const rawSessions =
          sessionData?.sessions ||
          sessionData?.data ||
          [];

        setClassDetail(normalizeClassDetail(detail));
        setStudents(rawStudents.map(normalizeStudent));
        setSchedules(rawSchedules.map(normalizeSchedule));
        setSessions(rawSessions.map(normalizeSession));
      } catch (error) {
        console.error("Lỗi tải chi tiết lớp học:", error);

        if (isMounted) {
          setMessage(error.message || "Không thể tải chi tiết lớp học.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadClassDetail();

    return () => {
      isMounted = false;
    };
  }, [courseClassId, location.state, refreshKey]);

  const filteredStudents = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return students;

    return students.filter((student) => {
      return (
        student.studentCode.toLowerCase().includes(keyword) ||
        student.fullName.toLowerCase().includes(keyword) ||
        student.email.toLowerCase().includes(keyword) ||
        student.phone.toLowerCase().includes(keyword)
      );
    });
  }, [students, search]);

  const registeredFaceCount = useMemo(() => {
    return students.filter((student) => student.faceRegistered).length;
  }, [students]);

  const avgAttendance = useMemo(() => {
    if (students.length === 0) return 0;

    const total = students.reduce(
      (sum, student) => sum + Number(student.attendancePercent || 0),
      0
    );

    return total / students.length;
  }, [students]);

  const handleRefresh = () => {
    setLoading(true);
    setRefreshKey((prev) => prev + 1);
  };

  const handleViewStudent = (student) => {
    navigate(`/teacher/students/${student.id}`, {
      state: {
        student,
        classData: classDetail,
      },
    });
  };

  const handleOpenAttendance = (session) => {
    if (session?.id) {
      navigate(`/teacher/attendance/${session.id}`, {
        state: {
          session,
          classData: classDetail,
        },
      });
      return;
    }

    navigate("/teacher/attendance");
  };

  const handleExportCsv = () => {
    const rows = [
      [
        "Mã sinh viên",
        "Họ tên",
        "Email",
        "Lớp",
        "Đã đăng ký khuôn mặt",
        "Có mặt",
        "Đi trễ",
        "Vắng",
        "Tỷ lệ chuyên cần",
      ],
      ...filteredStudents.map((student) => [
        student.studentCode,
        student.fullName,
        student.email,
        student.className,
        student.faceRegistered ? "Đã đăng ký" : "Chưa đăng ký",
        student.presentCount,
        student.lateCount,
        student.absentCount,
        `${student.attendancePercent.toFixed(2)}%`,
      ]),
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `students-${classDetail.classCode || courseClassId}.csv`;
    link.click();

    URL.revokeObjectURL(url);
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
                    onClick={() => navigate("/teacher/classes")}
                    className="font-semibold transition hover:text-white"
                  >
                    Lớp học
                  </button>

                  <span className="material-symbols-outlined text-[18px]">
                    chevron_right
                  </span>

                  <span>Chi tiết lớp học</span>
                </div>

                <h2 className="text-3xl font-bold tracking-tight">
                  {classDetail.subjectName}
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-blue-100">
                  Quản lý thông tin lớp học phần, danh sách sinh viên, lịch học,
                  buổi học và tỷ lệ chuyên cần của từng sinh viên.
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

          {loading ? (
            <LoadingState />
          ) : (
            <>
              <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <OverviewItem
                    label="Tên lớp"
                    value={classDetail.subjectName}
                    icon="menu_book"
                  />

                  <OverviewItem
                    label="Mã lớp"
                    value={classDetail.classCode}
                    icon="class"
                  />

                  <OverviewItem
                    label="Môn học"
                    value={classDetail.subjectCode}
                    icon="badge"
                  />

                  <OverviewItem
                    label="Sĩ số"
                    value={`${students.length || classDetail.totalStudents}${
                      classDetail.maxStudent
                        ? `/${classDetail.maxStudent}`
                        : ""
                    } SV`}
                    icon="groups"
                  />

                  <OverviewItem
                    label="Học kỳ"
                    value={`${classDetail.semester} - ${classDetail.schoolYear}`}
                    icon="calendar_month"
                  />
                </div>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Tổng sinh viên"
                  value={students.length}
                  icon="groups"
                  iconClass="bg-blue-50 text-blue-600"
                  tag="Enrollment"
                />

                <StatCard
                  title="Đã đăng ký khuôn mặt"
                  value={registeredFaceCount}
                  icon="face"
                  iconClass="bg-emerald-50 text-emerald-600"
                  tag="FaceData"
                />

                <StatCard
                  title="Buổi học"
                  value={sessions.length}
                  icon="event_note"
                  iconClass="bg-indigo-50 text-indigo-600"
                  tag="Session"
                />

                <StatCard
                  title="Chuyên cần TB"
                  value={`${avgAttendance.toFixed(0)}%`}
                  icon="percent"
                  iconClass="bg-amber-50 text-amber-600"
                  tag="Attendance"
                />
              </div>

              <div className="mb-6 rounded-3xl border border-slate-200 bg-white px-4 shadow-sm">
                <div className="flex flex-wrap">
                  <TabButton
                    active={activeTab === "info"}
                    icon="info"
                    label="Thông tin lớp"
                    onClick={() => setActiveTab("info")}
                  />

                  <TabButton
                    active={activeTab === "students"}
                    icon="groups"
                    label="Danh sách sinh viên"
                    onClick={() => setActiveTab("students")}
                  />

                  <TabButton
                    active={activeTab === "schedule"}
                    icon="calendar_today"
                    label="Lịch học"
                    onClick={() => setActiveTab("schedule")}
                  />

                  <TabButton
                    active={activeTab === "attendance"}
                    icon="fact_check"
                    label="Điểm danh"
                    onClick={() => setActiveTab("attendance")}
                  />

                  <TabButton
                    active={activeTab === "statistics"}
                    icon="leaderboard"
                    label="Thống kê"
                    onClick={() => setActiveTab("statistics")}
                  />
                </div>
              </div>

              {activeTab === "info" && (
                <ClassInfoPanel
                  classDetail={classDetail}
                  schedules={schedules}
                />
              )}

              {activeTab === "students" && (
                <>
                  <div className="mb-5 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative w-full lg:max-w-md">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        search
                      </span>

                      <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Tìm sinh viên theo mã, tên, email hoặc SĐT..."
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleExportCsv}
                        className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          download
                        </span>
                        Xuất CSV
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/teacher/classes/${courseClassId}/students`)
                        }
                        className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          group
                        </span>
                        Xem sinh viên
                      </button>
                    </div>
                  </div>

                  {filteredStudents.length === 0 ? (
                    <EmptyStudents />
                  ) : (
                    <StudentsTable
                      students={filteredStudents}
                      onViewStudent={handleViewStudent}
                    />
                  )}

                  <div className="mt-5 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      Hiển thị{" "}
                      <span className="font-bold text-slate-800">
                        {filteredStudents.length}
                      </span>{" "}
                      trong số{" "}
                      <span className="font-bold text-slate-800">
                        {students.length}
                      </span>{" "}
                      sinh viên
                    </span>
                  </div>
                </>
              )}

              {activeTab === "schedule" && (
                <SchedulePanel schedules={schedules} />
              )}

              {activeTab === "attendance" && (
                <SessionsPanel
                  sessions={sessions}
                  onOpenAttendance={handleOpenAttendance}
                />
              )}

              {activeTab === "statistics" && (
                <StatisticsPanel
                  classDetail={classDetail}
                  students={students}
                  sessions={sessions}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}