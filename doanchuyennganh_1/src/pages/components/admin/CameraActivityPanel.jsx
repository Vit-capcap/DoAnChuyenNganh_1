export default function CameraActivityPanel({
  activities,
  getStudentName,
  formatTime,
  safePercent,
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col min-h-[420px]">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Luồng hoạt động
          </h2>

          <p className="text-xs font-semibold text-slate-500 mt-1">
            Lịch sử nhận diện gần nhất.
          </p>
        </div>

        <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          Live
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {activities.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-6 text-center">
            <span className="material-symbols-outlined text-slate-400 text-4xl">
              history
            </span>

            <p className="text-sm font-semibold text-slate-500 mt-2">
              Chưa có lịch sử nhận diện.
            </p>
          </div>
        ) : (
          activities.map((item) => (
            <div
              key={item.id_history}
              className="flex items-start gap-3 p-3 rounded-2xl hover:bg-blue-50/50 transition"
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                  item.result === "SUCCESS"
                    ? "bg-cyan-50 border-cyan-100"
                    : "bg-rose-50 border-rose-100"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    item.result === "SUCCESS"
                      ? "text-cyan-600"
                      : "text-rose-600"
                  }`}
                >
                  {item.result === "SUCCESS" ? "face" : "warning"}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-900 truncate">
                  {getStudentName(item)}
                </p>

                <div className="flex flex-wrap items-center gap-1 text-slate-500 text-xs mt-1">
                  <span className="material-symbols-outlined text-[13px]">
                    schedule
                  </span>
                  {formatTime(item.capture_time)}

                  <span className="material-symbols-outlined text-[13px] ml-2">
                    location_on
                  </span>
                  {item.room_code || item.location || "Không rõ"}

                  {item.confidence !== null &&
                    item.confidence !== undefined && (
                      <span className="ml-2 text-blue-600 font-bold">
                        {safePercent(item.confidence)}%
                      </span>
                    )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}