function formatTime(value) {
  if (!value) return "--:--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 5) || "--:--";
  }

  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardTodaySchedule({ data = [] }) {
  const schedules =
    Array.isArray(data) && data.length > 0
      ? data
      : [
          {
            start_time: "07:00",
            end_time: "07:30",
            subject_name: "Chưa có lịch học",
            room_code: "Toàn trường",
          },
        ];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
      <div className="mb-4 pb-4 border-b border-slate-200">
        <h3 className="text-xl font-black text-slate-900">
          Lịch trình hôm nay
        </h3>

        <p className="text-xs font-semibold text-slate-500 mt-1">
          Các buổi học hoặc ca điểm danh trong ngày.
        </p>
      </div>

      <div className="flex flex-col gap-4 relative">
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200" />

        {schedules.map((item, index) => (
          <div
            key={item.id_schedule || index}
            className="flex items-start gap-4 relative z-10"
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center mt-1 ${
                index === 0
                  ? "bg-blue-600"
                  : "bg-white border border-slate-300"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  index === 0 ? "bg-white" : "bg-slate-500"
                }`}
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl flex-1 border border-slate-200">
              <p
                className={`text-xs font-bold mb-1 ${
                  index === 0 ? "text-blue-600" : "text-slate-500"
                }`}
              >
                {formatTime(item.start_time)} - {formatTime(item.end_time)}
              </p>

              <p className="text-sm font-black text-slate-900">
                {item.subject_name || item.title || "Lịch học"}
              </p>

              <p className="text-xs font-semibold text-slate-500 mt-1">
                {item.room_code ||
                  item.room_name ||
                  item.desc ||
                  "Chưa có phòng"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}