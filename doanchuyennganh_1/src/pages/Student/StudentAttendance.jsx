import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/student/Sidebar";
import Header from "../components/student/Header";

import { getMyStudentAttendanceHistory } from "../../api/studentApi";

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

function formatDate(value) {
  if (!value) return "--/--/----";

  try {
    return new Date(value).toLocaleDateString("vi-VN");
  } catch {
    return value;
  }
}

function formatDateTime(value) {
  if (!value) return "Chưa check-in";

  try {
    return new Date(value).toLocaleString("vi-VN");
  } catch {
    return value;
  }
}

function formatTime(value) {
  if (!value) return "--:--";
  return String(value).slice(0, 5);
}

function normalizeStatus(status) {
  if (!status) return "ABSENT";

  const value = String(status).toUpperCase();

  if (value === "PRESENT" || value === "CÓ MẶT" || value === "CO MAT") {
    return "PRESENT";
  }

  if (value === "LATE" || value === "ĐI MUỘN" || value === "DI MUON") {
    return "LATE";
  }

  return "ABSENT";
}

function getStatusInfo(status) {
  const value = normalizeStatus(status);

  if (value === "PRESENT") {
    return {
      text: "Có mặt",
      icon: "check_circle",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
    };
  }

  if (value === "LATE") {
    return {
      text: "Đi muộn",
      icon: "schedule",
      className:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
    };
  }

  return {
    text: "Vắng",
    icon: "cancel",
    className:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300",
  };
}

function getDateRangeValue(type) {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);

  if (type === "7") {
    start.setDate(now.getDate() - 7);
  } else if (type === "30") {
    start.setDate(now.getDate() - 30);
  } else if (type === "90") {
    start.setDate(now.getDate() - 90);
  } else {
    return {
      startDate: "",
      endDate: "",
    };
  }

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function downloadCsv(rows) {
  const headers = [
    "Môn học",
    "Mã lớp",
    "Giảng viên",
    "Ngày học",
    "Giờ học",
    "Giờ check-in",
    "Trạng thái",
    "Độ tin cậy",
    "Ghi chú",
  ];

  const csvRows = rows.map((item) => {
    const status = getStatusInfo(item.status);

    return [
      item.subject_name || "",
      item.class_code || "",
      item.teacher_name || "",
      formatDate(item.session_date),
      `${formatTime(item.start_time)} - ${formatTime(item.end_time)}`,
      item.check_in_time ? formatDateTime(item.check_in_time) : "",
      status.text,
      item.confidence_score != null ? `${Number(item.confidence_score).toFixed(1)}%` : "",
      item.note || "",
    ];
  });

  const csvContent = [headers, ...csvRows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob([`\uFEFF${csvContent}`], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `lich-su-diem-danh-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

function AttendanceMetricCards({ rows = [] }) {
  const total = rows.length;
  const present = rows.filter((item) => normalizeStatus(item.status) === "PRESENT").length;
  const late = rows.filter((item) => normalizeStatus(item.status) === "LATE").length;
  const absent = rows.filter((item) => normalizeStatus(item.status) === "ABSENT").length;

  const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  const cards = [
    {
      icon: "fact_check",
      title: "Tổng bản ghi",
      value: total,
      tag: "Số buổi đã có dữ liệu",
      iconClass: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
    },
    {
      icon: "check_circle",
      title: "Có mặt",
      value: present,
      tag: "Trạng thái PRESENT",
      iconClass:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
    },
    {
      icon: "schedule",
      title: "Đi muộn",
      value: late,
      tag: "Trạng thái LATE",
      iconClass:
        "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
    },
    {
      icon: "percent",
      title: "Tỷ lệ chuyên cần",
      value: `${rate}%`,
      tag: "Có mặt + đi muộn",
      iconClass:
        "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300",
    },
    {
      icon: "cancel",
      title: "Vắng",
      value: absent,
      tag: "Trạng thái ABSENT",
      iconClass: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
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

function ConfidenceBar({ value }) {
  if (value == null) {
    return <span className="text-sm font-semibold text-slate-400">N/A</span>;
  }

  const percent = Math.max(0, Math.min(100, Number(value || 0)));

  return (
    <div className="flex items-center justify-end gap-3">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{ width: `${percent}%` }}
        />
      </div>

      <span className="min-w-[50px] text-right text-sm font-bold text-slate-700 dark:text-slate-200">
        {percent.toFixed(1)}%
      </span>
    </div>
  );
}

function AttendanceTable({ rows = [] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Danh sách lịch sử điểm danh
          </h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Theo dõi trạng thái điểm danh, giờ check-in và độ tin cậy AI
          </p>
        </div>

        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
          {rows.length} bản ghi
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px]">
          <thead className="bg-slate-50 dark:bg-slate-950">
            <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <th className="px-5 py-4">Môn học</th>
              <th className="px-5 py-4">Ngày học</th>
              <th className="px-5 py-4">Giờ học</th>
              <th className="px-5 py-4">Check-in</th>
              <th className="px-5 py-4">Trạng thái</th>
              <th className="px-5 py-4 text-right">Độ tin cậy AI</th>
              <th className="px-5 py-4">Ghi chú</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((item) => {
              const status = getStatusInfo(item.status);

              return (
                <tr
                  key={
                    item.id_attendance ||
                    `${item.id_session}-${item.id_student}-${item.subject_name}`
                  }
                  className="border-t border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950"
                >
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-800 dark:text-slate-100">
                      {item.subject_name || "Chưa có môn học"}
                    </p>

                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {item.subject_code || "--"} · {item.class_code || "--"}
                    </p>

                    {item.teacher_name && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="material-symbols-outlined text-[14px]">
                          person
                        </span>
                        {item.teacher_name}
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {formatDate(item.session_date)}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {formatTime(item.start_time)} - {formatTime(item.end_time)}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {item.check_in_time ? formatDateTime(item.check_in_time) : "Chưa check-in"}
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

                  <td className="px-5 py-4">
                    <ConfidenceBar value={item.confidence_score} />
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">
                    {item.note || "--"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <span className="material-symbols-outlined mb-3 text-[58px] text-slate-300 dark:text-slate-600">
            search_off
          </span>

          <p className="text-lg font-bold text-slate-600 dark:text-slate-300">
            Không tìm thấy lịch sử điểm danh
          </p>

          <p className="mt-1 text-sm text-slate-400">
            Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.
          </p>
        </div>
      )}
    </div>
  );
}

export default function StudentAttendance() {
  const navigate = useNavigate();

  const [student] = useState(() => getStudentInfo());

  const [attendanceRows, setAttendanceRows] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadAttendanceHistory = async () => {
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

        const range = getDateRangeValue(dateRange);

        const res = await getMyStudentAttendanceHistory(sid, {
          status: statusFilter === "ALL" ? "" : statusFilter,
          startDate: range.startDate,
          endDate: range.endDate,
        });

        const rows = res?.success ? res.data || [] : res || [];

        if (!isMounted) return;

        setAttendanceRows(Array.isArray(rows) ? rows : []);
      } catch (error) {
        console.error("Lỗi tải lịch sử điểm danh:", error);

        if (isMounted) {
          setMessage(error.message || "Không thể tải lịch sử điểm danh.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAttendanceHistory();

    return () => {
      isMounted = false;
    };
  }, [dateRange, statusFilter, refreshKey]);

  const filteredRows = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return attendanceRows.filter((item) => {
      const subject = String(item.subject_name || "").toLowerCase();
      const code = String(item.subject_code || "").toLowerCase();
      const teacher = String(item.teacher_name || "").toLowerCase();
      const classCode = String(item.class_code || "").toLowerCase();

      return (
        !keyword ||
        subject.includes(keyword) ||
        code.includes(keyword) ||
        teacher.includes(keyword) ||
        classCode.includes(keyword)
      );
    });
  }, [attendanceRows, searchText]);

  const resetFilters = () => {
    setSearchText("");
    setStatusFilter("ALL");
    setDateRange("ALL");
  };

  const hasFilter =
    searchText.trim() || statusFilter !== "ALL" || dateRange !== "ALL";

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
        <Sidebar activePage="attendance-history" />

        <div className="flex min-h-screen flex-1 flex-col md:ml-[280px]">
          <Header student={student} />

          <main className="flex-1 p-4 md:p-6">
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Đang tải lịch sử điểm danh...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar activePage="attendance-history" />

      <div className="flex min-h-screen flex-1 flex-col md:ml-[280px]">
        <Header student={student} />

        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 text-white shadow-lg shadow-blue-100 dark:shadow-none">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm text-blue-100">
                  <span className="material-symbols-outlined text-[18px]">
                    history
                  </span>
                  Lịch sử điểm danh
                </div>

                <h2 className="text-3xl font-bold tracking-tight">
                  Lịch sử điểm danh cá nhân
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-blue-100">
                  Theo dõi trạng thái điểm danh, thời gian check-in và độ tin
                  cậy nhận diện khuôn mặt qua từng buổi học.
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
                  className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/25"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    refresh
                  </span>
                  Tải lại
                </button>

                <button
                  type="button"
                  onClick={() => downloadCsv(filteredRows)}
                  disabled={filteredRows.length === 0}
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
            <div className="mb-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              <span className="material-symbols-outlined text-[20px]">
                error
              </span>
              <span>{message}</span>
            </div>
          )}

          {!message && (
            <div className="space-y-6">
              <AttendanceMetricCards rows={attendanceRows} />

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Bộ lọc dữ liệu
                    </h3>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Tìm theo môn học, mã môn, lớp hoặc giảng viên.
                    </p>
                  </div>

                  {hasFilter && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="flex w-fit items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        filter_alt_off
                      </span>
                      Xóa lọc
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                  <div className="lg:col-span-2">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Tìm kiếm
                    </label>

                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-slate-400">
                        search
                      </span>

                      <input
                        type="text"
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
                        placeholder="Nhập tên môn, mã môn, lớp hoặc giảng viên..."
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-950"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Khoảng thời gian
                    </label>

                    <select
                      value={dateRange}
                      onChange={(event) => setDateRange(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-950"
                    >
                      <option value="ALL">Tất cả thời gian</option>
                      <option value="7">7 ngày gần nhất</option>
                      <option value="30">30 ngày gần nhất</option>
                      <option value="90">90 ngày gần nhất</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Trạng thái
                    </label>

                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-950"
                    >
                      <option value="ALL">Tất cả trạng thái</option>
                      <option value="PRESENT">Có mặt</option>
                      <option value="LATE">Đi muộn</option>
                      <option value="ABSENT">Vắng</option>
                    </select>
                  </div>
                </div>
              </div>

              <AttendanceTable rows={filteredRows} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}