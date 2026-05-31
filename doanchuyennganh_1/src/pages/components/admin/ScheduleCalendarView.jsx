export default function ScheduleCalendarView({
  groupedByDay,
  dayLabels,
  formatTime,
  isToday,
  onEdit,
  onDelete,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
      {Object.entries(dayLabels).map(([day, label]) => {
        const items = groupedByDay[day] || [];
        const today = isToday(day);

        return (
          <div
            key={day}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div
              className={`px-5 py-4 border-b border-slate-200 flex items-center justify-between ${
                today ? "bg-blue-50" : "bg-slate-50"
              }`}
            >
              <div>
                <h3
                  className={`font-black ${
                    today ? "text-blue-700" : "text-slate-900"
                  }`}
                >
                  {label}
                </h3>

                <p className="text-xs font-semibold text-slate-500 mt-1">
                  {today ? "Lịch học hôm nay" : "Lịch trong tuần"}
                </p>
              </div>

              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-xl ${
                  today
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-500 border border-slate-200"
                }`}
              >
                {items.length} lịch
              </span>
            </div>

            <div className="p-4 space-y-3 min-h-[150px]">
              {items.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 text-center">
                  <span className="material-symbols-outlined text-slate-300 text-3xl">
                    event_busy
                  </span>

                  <p className="text-sm font-semibold text-slate-400 mt-2">
                    Không có lịch học.
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id_schedule}
                    className="border border-slate-200 rounded-2xl p-4 hover:shadow-sm hover:border-blue-100 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {item.class_code || "-"}
                        </p>

                        <p className="text-xs font-semibold text-slate-500 mt-1">
                          {item.subject_name || "-"}
                        </p>
                      </div>

                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-xl whitespace-nowrap">
                        {formatTime(item.start_time)} -{" "}
                        {formatTime(item.end_time)}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-slate-500">
                      <p className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">
                          person
                        </span>
                        GV: {item.teacher_name || "-"}
                      </p>

                      <p className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">
                          meeting_room
                        </span>
                        Phòng: {item.room_code || "-"}
                        {item.room_name ? ` - ${item.room_name}` : ""}
                      </p>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          edit
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-red-100 text-red-500 hover:bg-red-50"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}