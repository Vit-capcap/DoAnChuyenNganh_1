function formatDateTime(value) {
  if (!value) return "Chưa có dữ liệu";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa có dữ liệu";
  }

  return date.toLocaleString("vi-VN");
}

function getInitials(name) {
  if (!name) return "ND";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function DashboardRecentActivities({ data = [] }) {
  const activities = Array.isArray(data) ? data : [];

  const statusClass = {
    SUCCESS: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    LATE: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    FAILED: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 lg:col-span-2">
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-xl font-black text-slate-900">
            Hoạt động gần đây
          </h3>

          <p className="text-xs font-semibold text-slate-500 mt-1">
            Luồng nhận diện và điểm danh mới nhất.
          </p>
        </div>

        <button
          type="button"
          className="text-sm font-bold text-blue-600 hover:underline"
        >
          Xem tất cả
        </button>
      </div>

      <div className="flex flex-col">
        {activities.length === 0 ? (
          <div className="text-sm text-slate-500 py-8 text-center">
            Chưa có hoạt động gần đây.
          </div>
        ) : (
          activities.map((item, index) => {
            const isWarning = item.result === "FAILED";
            const name = item.full_name || item.name || "Không xác định";
            const room =
              item.room_code || item.room_name || item.location || "Không rõ";
            const status = item.status || item.result || "SUCCESS";

            return (
              <div key={item.id_history || index}>
                <div className="flex items-start gap-4 py-3 hover:bg-blue-50/40 rounded-2xl px-2 transition">
                  {isWarning ? (
                    <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center">
                      <span className="material-symbols-outlined text-rose-600">
                        warning
                      </span>
                    </div>
                  ) : (
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
                      {getInitials(name)}
                    </div>
                  )}

                  <div className="flex-1">
                    <p className="text-sm text-slate-700">
                      <span className="font-black text-slate-900">{name}</span>{" "}
                      {isWarning
                        ? "không nhận diện được tại"
                        : "điểm danh tại"}{" "}
                      <span className="font-black text-slate-900">{room}</span>
                    </p>

                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        schedule
                      </span>
                      {formatDateTime(item.capture_time || item.check_in_time)}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                      statusClass[status] || statusClass.SUCCESS
                    }`}
                  >
                    {isWarning
                      ? "Cảnh báo"
                      : status === "LATE"
                      ? "Đi trễ"
                      : "Thành công"}
                  </span>
                </div>

                {index !== activities.length - 1 && (
                  <div className="h-px bg-slate-100 ml-16" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}