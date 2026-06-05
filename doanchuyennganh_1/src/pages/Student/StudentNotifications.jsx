import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/student/Sidebar";
import Header from "../components/student/Header";

const DEFAULT_NOTIFICATIONS = [
  {
    id_notification: 1,
    title: "Cảnh báo nhận diện khuôn mặt",
    content:
      "Hệ thống nhận diện khuôn mặt phát hiện độ tin cậy thấp trong lần điểm danh gần nhất. Vui lòng kiểm tra lại lịch sử điểm danh.",
    created_at: new Date().toISOString(),
    is_read: 0,
    type: "WARNING",
    action_path: "/student/attendance-history",
  },
  {
    id_notification: 2,
    title: "Lịch học sắp diễn ra",
    content:
      "Bạn có một buổi học sắp bắt đầu. Hãy chuẩn bị vào lớp và thực hiện điểm danh đúng giờ.",
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    is_read: 0,
    type: "SCHEDULE",
    action_path: "/student/schedule",
  },
  {
    id_notification: 3,
    title: "Cập nhật điểm danh",
    content:
      "Trạng thái điểm danh của bạn đã được cập nhật. Bạn có thể xem chi tiết trong lịch sử điểm danh.",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    is_read: 1,
    type: "ATTENDANCE",
    action_path: "/student/attendance-history",
  },
  {
    id_notification: 4,
    title: "Bảo trì hệ thống",
    content:
      "Hệ thống điểm danh và nhận diện khuôn mặt sẽ được bảo trì định kỳ. Một số chức năng có thể tạm thời gián đoạn.",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    is_read: 1,
    type: "SYSTEM",
    action_path: "/student/settings",
  },
];

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

function formatDateTime(value) {
  if (!value) return "--/--/----";

  try {
    return new Date(value).toLocaleString("vi-VN");
  } catch {
    return value;
  }
}

function getRelativeTime(value) {
  if (!value) return "Không rõ thời gian";

  const date = new Date(value);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (Number.isNaN(diffMs)) return formatDateTime(value);

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return formatDateTime(value);
}

function normalizeNotification(item, index) {
  return {
    id_notification:
      item.id_notification ||
      item.id ||
      `${Date.now()}-${index}`,
    title: item.title || "Thông báo",
    content: item.content || item.description || "Không có nội dung.",
    created_at: item.created_at || item.time || new Date().toISOString(),
    is_read: Number(item.is_read ?? item.read ?? 0),
    type: item.type || item.notification_type || "SYSTEM",
    action_path: item.action_path || item.path || "",
  };
}

function getNotificationStyle(type) {
  const value = String(type || "").toUpperCase();

  if (value.includes("WARNING") || value.includes("WARN")) {
    return {
      icon: "warning",
      iconClass:
        "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
      badgeClass:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
      label: "Cảnh báo",
    };
  }

  if (value.includes("SCHEDULE") || value.includes("CLASS")) {
    return {
      icon: "calendar_month",
      iconClass:
        "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
      badgeClass:
        "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300",
      label: "Lịch học",
    };
  }

  if (value.includes("ATTENDANCE")) {
    return {
      icon: "fact_check",
      iconClass:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
      badgeClass:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
      label: "Điểm danh",
    };
  }

  if (value.includes("ERROR") || value.includes("ABSENT")) {
    return {
      icon: "error",
      iconClass: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300",
      badgeClass:
        "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300",
      label: "Khẩn cấp",
    };
  }

  return {
    icon: "notifications",
    iconClass:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    badgeClass:
      "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300",
    label: "Hệ thống",
  };
}

function NotificationMetricCards({ rows = [] }) {
  const total = rows.length;
  const unread = rows.filter((item) => Number(item.is_read) === 0).length;
  const read = total - unread;
  const warnings = rows.filter((item) =>
    String(item.type || "").toUpperCase().includes("WARNING")
  ).length;

  const cards = [
    {
      icon: "notifications",
      title: "Tổng thông báo",
      value: total,
      tag: "Tất cả thông báo",
      iconClass:
        "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
    },
    {
      icon: "mark_email_unread",
      title: "Chưa đọc",
      value: unread,
      tag: "Cần kiểm tra",
      iconClass:
        "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
    },
    {
      icon: "drafts",
      title: "Đã đọc",
      value: read,
      tag: "Đã xử lý",
      iconClass:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
    },
    {
      icon: "warning",
      title: "Cảnh báo",
      value: warnings,
      tag: "Cần chú ý",
      iconClass: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300",
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

function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
  onOpenAction,
}) {
  const style = getNotificationStyle(notification.type);
  const unread = Number(notification.is_read) === 0;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md ${
        unread
          ? "border-blue-200 bg-white shadow-sm dark:border-blue-900 dark:bg-slate-900"
          : "border-slate-200 bg-white opacity-90 dark:border-slate-800 dark:bg-slate-900"
      }`}
    >
      {unread && (
        <span className="absolute right-5 top-5 h-3 w-3 rounded-full bg-blue-600 shadow-lg shadow-blue-300" />
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${style.iconClass}`}
        >
          <span className="material-symbols-outlined text-[28px]">
            {style.icon}
          </span>
        </div>

        <div className="min-w-0 flex-1 pr-2">
          <div className="mb-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {notification.title}
              </h3>

              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${style.badgeClass}`}
              >
                {style.label}
              </span>

              {unread && (
                <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                  Mới
                </span>
              )}
            </div>

            <span className="text-sm font-semibold text-slate-400">
              {getRelativeTime(notification.created_at)}
            </span>
          </div>

          <p className="leading-relaxed text-slate-500 dark:text-slate-400">
            {notification.content}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {notification.action_path && (
              <button
                type="button"
                onClick={() => onOpenAction(notification)}
                className="flex items-center gap-1 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Xem chi tiết
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            )}

            {unread && (
              <button
                type="button"
                onClick={() => onMarkRead(notification.id_notification)}
                className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-blue-950"
              >
                <span className="material-symbols-outlined text-[18px]">
                  done
                </span>
                Đánh dấu đã đọc
              </button>
            )}

            <button
              type="button"
              onClick={() => onDelete(notification.id_notification)}
              className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            >
              <span className="material-symbols-outlined text-[18px]">
                delete
              </span>
              Xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentNotifications() {
  const navigate = useNavigate();

  const [student] = useState(() => getStudentInfo());
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("studentNotifications") || "[]"
      );

      if (Array.isArray(saved) && saved.length > 0) {
        return saved.map(normalizeNotification);
      }

      return DEFAULT_NOTIFICATIONS.map(normalizeNotification);
    } catch {
      return DEFAULT_NOTIFICATIONS.map(normalizeNotification);
    }
  });

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [message, setMessage] = useState("");

  useEffect(() => {
    localStorage.setItem("studentNotifications", JSON.stringify(notifications));
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return notifications.filter((item) => {
      const title = String(item.title || "").toLowerCase();
      const content = String(item.content || "").toLowerCase();
      const type = String(item.type || "").toUpperCase();
      const isUnread = Number(item.is_read) === 0;

      const matchKeyword =
        !keyword || title.includes(keyword) || content.includes(keyword);

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "UNREAD" && isUnread) ||
        (statusFilter === "READ" && !isUnread);

      const matchType = typeFilter === "ALL" || type.includes(typeFilter);

      return matchKeyword && matchStatus && matchType;
    });
  }, [notifications, searchText, statusFilter, typeFilter]);

  const hasFilter =
    searchText.trim() || statusFilter !== "ALL" || typeFilter !== "ALL";

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id_notification === id ? { ...item, is_read: 1 } : item
      )
    );
    setMessage("Đã đánh dấu thông báo là đã đọc.");
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        is_read: 1,
      }))
    );
    setMessage("Đã đánh dấu tất cả thông báo là đã đọc.");
  };

  const deleteNotification = (id) => {
    setNotifications((prev) =>
      prev.filter((item) => item.id_notification !== id)
    );
    setMessage("Đã xóa thông báo khỏi danh sách.");
  };

  const resetFilters = () => {
    setSearchText("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setMessage("");
  };

  const reloadDemoNotifications = () => {
    const rows = DEFAULT_NOTIFICATIONS.map(normalizeNotification);
    setNotifications(rows);
    setMessage("Đã tải lại dữ liệu thông báo mẫu.");
  };

  const openAction = (notification) => {
    if (notification.action_path) {
      markAsRead(notification.id_notification);
      navigate(notification.action_path);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar activePage="notifications" />

      <div className="flex min-h-screen flex-1 flex-col md:ml-[280px]">
        <Header student={student} />

        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 text-white shadow-lg shadow-blue-100 dark:shadow-none">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm text-blue-100">
                  <span className="material-symbols-outlined text-[18px]">
                    notifications
                  </span>
                  Trung tâm thông báo
                </div>

                <h2 className="text-3xl font-bold tracking-tight">
                  Thông báo & cảnh báo
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-blue-100">
                  Theo dõi thông báo lịch học, điểm danh, cảnh báo nhận diện
                  khuôn mặt và thông tin hệ thống.
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
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/25"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    done_all
                  </span>
                  Đọc tất cả
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/student/settings")}
                  className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    tune
                  </span>
                  Cài đặt
                </button>
              </div>
            </div>
          </div>

          {message && (
            <div className="mb-5 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              <span className="material-symbols-outlined text-[20px]">
                check_circle
              </span>
              <span>{message}</span>
            </div>
          )}

          <div className="mx-auto max-w-[1500px] space-y-6">
            <NotificationMetricCards rows={notifications} />

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Bộ lọc thông báo
                  </h3>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Tìm kiếm theo tiêu đề, nội dung, trạng thái hoặc loại thông
                    báo.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {hasFilter && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        filter_alt_off
                      </span>
                      Xóa lọc
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={reloadDemoNotifications}
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      refresh
                    </span>
                    Tải lại mẫu
                  </button>
                </div>
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
                      placeholder="Nhập tiêu đề hoặc nội dung thông báo..."
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-950"
                    />
                  </div>
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
                    <option value="ALL">Tất cả</option>
                    <option value="UNREAD">Chưa đọc</option>
                    <option value="READ">Đã đọc</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Loại thông báo
                  </label>

                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-950"
                  >
                    <option value="ALL">Tất cả loại</option>
                    <option value="WARNING">Cảnh báo</option>
                    <option value="SCHEDULE">Lịch học</option>
                    <option value="ATTENDANCE">Điểm danh</option>
                    <option value="SYSTEM">Hệ thống</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="max-w-5xl space-y-5">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((item) => (
                  <NotificationCard
                    key={item.id_notification}
                    notification={item}
                    onMarkRead={markAsRead}
                    onDelete={deleteNotification}
                    onOpenAction={openAction}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <span className="material-symbols-outlined mb-4 text-[64px] text-slate-300 dark:text-slate-600">
                    notifications_off
                  </span>

                  <p className="text-lg font-bold text-slate-600 dark:text-slate-300">
                    Không có thông báo phù hợp
                  </p>

                  <p className="mt-2 text-sm text-slate-400">
                    Hãy thử xóa bộ lọc hoặc tải lại dữ liệu mẫu.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}