// src/pages/Student/NotificationsPage.jsx
import StudentLayout from "./components/StudentLayout";

const notifications = [
  {
    title: "AI Biometric Warning",
    time: "2 mins ago",
    icon: "warning",
    color: "bg-orange-100 text-orange-600",
    unread: true,
    description:
      "The facial recognition system detected a low-confidence match during your login attempt to the Advanced Physics portal.",
    action: "Review Event",
  },
  {
    title: "Upcoming Class: Data Structures",
    time: "1 hour ago",
    icon: "calendar_month",
    color: "bg-blue-100 text-blue-700",
    unread: true,
    description:
      "Your class CS-301 Data Structures begins in 30 minutes in Room 4B.",
  },
  {
    title: "Attendance Alert",
    time: "Yesterday, 14:30",
    icon: "face",
    color: "bg-red-100 text-red-600",
    unread: false,
    description:
      "You were marked absent for Applied Mathematics. If this is incorrect, submit a review request.",
  },
  {
    title: "System Maintenance",
    time: "Oct 12, 09:00",
    icon: "info",
    color: "bg-gray-100 text-gray-600",
    unread: false,
    description:
      "The Student Portal and AI Biometric servers will undergo maintenance this Sunday.",
  },
];

function NotificationCard({ title, time, icon, color, unread, description, action }) {
  return (
    <div
      className={`relative rounded-3xl border p-6 transition-all hover:shadow-lg ${
        unread
          ? "bg-white border-gray-200 shadow-sm"
          : "bg-gray-50 border-gray-100 opacity-80 hover:opacity-100"
      }`}
    >
      {/* UNREAD DOT */}
      {unread && (
        <div className="absolute top-6 right-6 w-3 h-3 rounded-full bg-blue-600 shadow-lg shadow-blue-300"></div>
      )}

      <div className="flex gap-5">

        {/* ICON */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
          <span className="material-symbols-outlined text-[28px]">{icon}</span>
        </div>

        {/* CONTENT */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            <span className={`text-sm font-medium ${unread ? "text-blue-700" : "text-gray-400"}`}>
              {time}
            </span>
          </div>

          <p className="text-gray-500 leading-relaxed">{description}</p>

          {action && (
            <button className="mt-4 text-blue-700 font-semibold hover:underline flex items-center gap-1">
              {action}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <StudentLayout
      title="Student Portal"
      subtitle="Notifications &amp; Alerts"
      showSearch={false}
    >
      <div className="max-w-[1400px] mx-auto">

        {/* PAGE HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Notifications</h1>
            <p className="text-gray-500">
              Stay updated with your latest alerts and academic activities.
            </p>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-wrap gap-4">
            <button className="px-5 py-3 rounded-2xl border border-gray-300 hover:border-blue-500 hover:text-blue-700 transition font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">done_all</span>
              Mark all as read
            </button>

            <button className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl font-medium shadow-lg shadow-blue-200 transition flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">tune</span>
              Notification Settings
            </button>
          </div>
        </div>

        {/* NOTIFICATIONS LIST */}
        <div className="max-w-5xl space-y-5">
          {notifications.map((item, index) => (
            <NotificationCard
              key={index}
              title={item.title}
              time={item.time}
              icon={item.icon}
              color={item.color}
              unread={item.unread}
              description={item.description}
              action={item.action}
            />
          ))}

          {/* LOAD MORE */}
          <div className="flex justify-center pt-6">
            <button className="px-8 py-3 rounded-full border border-gray-300 hover:border-blue-500 hover:text-blue-700 transition font-medium">
              Load Previous Notifications
            </button>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}