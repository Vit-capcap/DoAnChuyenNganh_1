export default function CameraStats({ stats, statCards, safePercent }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      {statCards.map((item) => (
        <div
          key={item.title}
          className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">
                {item.title}
              </p>

              <h3 className={`text-3xl font-black mt-1 ${item.textClass}`}>
                {item.value}
              </h3>
            </div>

            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.bgClass}`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
            </div>
          </div>
        </div>
      ))}

      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm sm:col-span-2 xl:col-span-2">
        <div className="flex items-center justify-between gap-5">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">
              Khuôn mặt nhận diện hôm nay
            </p>

            <h3 className="text-3xl font-black text-slate-900 mt-1">
              {stats.today_faces || 0}
            </h3>
          </div>

          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase">
              AI Accuracy
            </p>

            <h3 className="text-2xl font-black text-blue-600 mt-1">
              {safePercent(stats.today_accuracy)}%
            </h3>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <span className="material-symbols-outlined">neurology</span>
          </div>
        </div>
      </div>
    </div>
  );
}