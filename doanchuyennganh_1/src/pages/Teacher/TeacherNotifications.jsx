import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/teacher/Sidebar";
import Header from "../components/teacher/Header";

import {
  getTeacherNotifications,
  markTeacherNotificationAsRead,
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

function normalizeNotification(item = {}) {
  const title = item.title || item.notification_title || "Thông báo";
  const content = item.content || item.message || item.notification_content || "";

  return {
    id:
      item.id_notification ||
      item.id ||
      item.notification_id ||
      `${title}-${item.created_at}`,
    title,
    content,
    receiverId: item.receiver_id || item.receiverId || null,
    receiverRole: item.receiver_role || item.receiverRole || "TEACHER",
    type: normalizeType(item.type || item.category || title || content),
    isRead:
      item.is_read === 1 ||
      item.is_read === true ||
      item.isRead === true ||
      item.status === "READ",
    createdAt: item.created_at || item.createdAt || item.time || null,
  };
}

function normalizeType(value = "") {
  const text = String(value).toLowerCase();

  if (
    text.includes("schedule") ||
    text.includes("lịch") ||
    text.includes("buổi học") ||
    text.includes("lớp")
  ) {
    return "SCHEDULE";
  }

  if (
    text.includes("attendance") ||
    text.includes("điểm danh") ||
    text.includes("vắng") ||
    text.includes("nhận diện")
  ) {
    return "ATTENDANCE";
  }

  if (
    text.includes("request") ||
    text.includes("yêu cầu") ||
    text.includes("duyệt")
  ) {
    return "REQUEST";
  }

  return "SYSTEM";
}

function getNotificationConfig(type) {
  if (type === "SCHEDULE") {
    return {
      label: "Lịch dạy",
      icon: "calendar_today",
      iconClass: "bg-blue-50 text-blue-600",
      chipClass: "bg-blue-50 text-blue-700 border-blue-100",
    };
  }

  if (type === "ATTENDANCE") {
    return {
      label: "Điểm danh",
      icon: "face",
      iconClass: "bg-amber-50 text-amber-600",
      chipClass: "bg-amber-50 text-amber-700 border-amber-100",
    };
  }

  if (type === "REQUEST") {
    return {
      label: "Yêu cầu",
      icon: "pending_actions",
      iconClass: "bg-purple-50 text-purple-600",
      chipClass: "bg-purple-50 text-purple-700 border-purple-100",
    };
  }

  return {
    label: "Hệ thống",
    icon: "campaign",
    iconClass: "bg-slate-100 text-slate-600",
    chipClass: "bg-slate-50 text-slate-600 border-slate-200",
  };
}

function formatDateTime(value) {
  if (!value) return "Chưa có thời gian";

  try {
    const date = new Date(value);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString("vi-VN");
  } catch {
    return value;
  }
}

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

function NotificationTabs({ activeFilter, unreadCount, onChange }) {
  const tabs = [
    {
      key: "ALL",
      label: "Tất cả",
      icon: "notifications",
    },
    {
      key: "UNREAD",
      label: "Chưa đọc",
      icon: "mark_email_unread",
      badge: unreadCount,
    },
    {
      key: "SCHEDULE",
      label: "Lịch dạy",
      icon: "calendar_today",
    },
    {
      key: "ATTENDANCE",
      label: "Điểm danh",
      icon: "face",
    },
    {
      key: "SYSTEM",
      label: "Hệ thống",
      icon: "campaign",
    },
  ];

  return (
    <div className="mb-6 overflow-x-auto">
      <div className="flex min-w-max gap-2 border-b border-slate-200">
        {tabs.map((tab) => {
          const active = activeFilter === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
                active
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {tab.icon}
              </span>
              {tab.label}

              {tab.badge > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NotificationItem({ item, onMarkRead }) {
  const config = getNotificationConfig(item.type);

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border p-5 shadow-sm transition hover:shadow-md ${
        item.isRead
          ? "border-slate-200 bg-white opacity-80 hover:opacity-100"
          : "border-blue-100 bg-white"
      }`}
    >
      {!item.isRead && (
        <div className="absolute bottom-0 left-0 top-0 w-1 bg-blue-600" />
      )}

      <div className="flex gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${config.iconClass}`}
        >
          <span className="material-symbols-outlined">{config.icon}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h3 className="line-clamp-1 text-base font-bold text-slate-900">
              {item.title}
            </h3>

            <span className="shrink-0 text-xs font-semibold text-slate-400">
              {formatDateTime(item.createdAt)}
            </span>
          </div>

          <p className="mb-3 text-sm font-medium leading-6 text-slate-500">
            {item.content || "Không có nội dung thông báo."}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span
              className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1 text-xs font-bold ${config.chipClass}`}
            >
              <span className="material-symbols-outlined text-[15px]">
                {config.icon}
              </span>
              {config.label}
            </span>

            {!item.isRead ? (
              <button
                type="button"
                onClick={() => onMarkRead(item.id)}
                className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
              >
                <span className="material-symbols-outlined text-[16px]">
                  done
                </span>
                Đánh dấu đã đọc
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400">
                <span className="material-symbols-outlined text-[16px]">
                  done_all
                </span>
                Đã đọc
              </span>
            )}
          </div>
        </div>

        {!item.isRead && (
          <div
            className="mt-2 h-3 w-3 shrink-0 rounded-full bg-blue-600"
            title="Chưa đọc"
          />
        )}
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
          Đang tải thông báo...
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
          notifications_off
        </span>
      </div>

      <h2 className="text-xl font-bold text-slate-900">
        Không có thông báo
      </h2>

      <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-slate-500">
        Hiện tại chưa có thông báo phù hợp với bộ lọc đang chọn.
      </p>
    </div>
  );
}

export default function TeacherNotifications() {
  const navigate = useNavigate();

  const teacher = useMemo(() => getTeacherInfo(), []);
  const teacherId = useMemo(() => getTeacherId(), []);

  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchNotifications() {
      if (!teacherId) {
        if (isMounted) {
          setNotifications([]);
          setMessage(
            "Không tìm thấy teacherId. Vui lòng đăng nhập lại bằng tài khoản giáo viên."
          );
          setLoading(false);
        }

        return;
      }

      try {
        const data = await getTeacherNotifications(teacherId);

        if (!isMounted) return;

        const rawNotifications =
          data?.notifications ||
          data?.data ||
          data ||
          [];

        setNotifications(rawNotifications.map(normalizeNotification));
        setMessage("");
      } catch (error) {
        console.error("Lỗi tải thông báo giáo viên:", error);

        if (isMounted) {
          setNotifications([]);
          setMessage(error.message || "Không thể tải thông báo giáo viên.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchNotifications();

    return () => {
      isMounted = false;
    };
  }, [teacherId, refreshKey]);

  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter((item) => !item.isRead).length;
    const schedule = notifications.filter(
      (item) => item.type === "SCHEDULE"
    ).length;
    const attendance = notifications.filter(
      (item) => item.type === "ATTENDANCE"
    ).length;

    return {
      total,
      unread,
      schedule,
      attendance,
    };
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return notifications.filter((item) => {
      const matchFilter =
        activeFilter === "ALL" ||
        (activeFilter === "UNREAD" && !item.isRead) ||
        item.type === activeFilter;

      const matchSearch =
        !keyword ||
        item.title.toLowerCase().includes(keyword) ||
        item.content.toLowerCase().includes(keyword);

      return matchFilter && matchSearch;
    });
  }, [notifications, activeFilter, search]);

  const handleRefresh = () => {
    setLoading(true);
    setSuccessMessage("");
    setRefreshKey((prev) => prev + 1);
  };

  const handleMarkRead = async (notificationId) => {
    if (!notificationId) {
      setMessage("Thiếu mã thông báo cần đánh dấu đã đọc.");
      return;
    }

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notificationId
          ? {
              ...item,
              isRead: true,
            }
          : item
      )
    );

    try {
      await markTeacherNotificationAsRead(notificationId);
      setMessage("");
      setSuccessMessage("Đã đánh dấu thông báo là đã đọc.");
    } catch (error) {
      console.error("Lỗi đánh dấu thông báo đã đọc:", error);
      setMessage(error.message || "Không thể đánh dấu thông báo đã đọc.");
      setRefreshKey((prev) => prev + 1);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadItems = notifications.filter((item) => !item.isRead);

    if (unreadItems.length === 0) {
      setSuccessMessage("Tất cả thông báo đã được đọc.");
      return;
    }

    try {
      setMessage("");
      setSuccessMessage("");

      await Promise.all(
        unreadItems.map((item) => markTeacherNotificationAsRead(item.id))
      );

      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          isRead: true,
        }))
      );

      setSuccessMessage("Đã đánh dấu tất cả thông báo là đã đọc.");
    } catch (error) {
      console.error("Lỗi đánh dấu tất cả thông báo:", error);
      setMessage(error.message || "Không thể đánh dấu tất cả thông báo.");
      setRefreshKey((prev) => prev + 1);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar activePage="notifications" />

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

                  <span>Thông báo</span>
                </div>

                <h2 className="text-3xl font-bold tracking-tight">
                  Thông báo giáo viên
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-blue-100">
                  Theo dõi thông báo từ hệ thống, lịch dạy, điểm danh và các
                  cảnh báo liên quan đến lớp học.
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
                  onClick={handleMarkAllRead}
                  disabled={loading || stats.unread === 0}
                  className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    done_all
                  </span>
                  Đánh dấu tất cả
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

          {successMessage && (
            <div className="mb-5 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              <span className="material-symbols-outlined text-[20px]">
                check_circle
              </span>
              <span>{successMessage}</span>
            </div>
          )}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon="notifications"
              title="Tổng thông báo"
              value={stats.total}
              tag="Tất cả"
              iconClass="bg-blue-50 text-blue-600"
            />

            <StatCard
              icon="mark_email_unread"
              title="Chưa đọc"
              value={stats.unread}
              tag="Cần xem"
              iconClass="bg-red-50 text-red-600"
            />

            <StatCard
              icon="calendar_today"
              title="Lịch dạy"
              value={stats.schedule}
              tag="Schedule"
              iconClass="bg-cyan-50 text-cyan-600"
            />

            <StatCard
              icon="face"
              title="Điểm danh"
              value={stats.attendance}
              tag="Attendance"
              iconClass="bg-amber-50 text-amber-600"
            />
          </div>

          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                search
              </span>

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm kiếm thông báo..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />
            </div>
          </div>

          <NotificationTabs
            activeFilter={activeFilter}
            unreadCount={stats.unread}
            onChange={setActiveFilter}
          />

          {loading ? (
            <LoadingState />
          ) : filteredNotifications.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((item) => (
                <NotificationItem
                  key={item.id}
                  item={item}
                  onMarkRead={handleMarkRead}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}