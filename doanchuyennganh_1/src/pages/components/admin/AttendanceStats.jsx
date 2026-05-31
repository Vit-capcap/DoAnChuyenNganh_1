export default function AttendanceStats({ statCards }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
      {statCards.map((item) => (
        <div
          key={item.title}
          className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
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

          {item.sub && (
            <p className="text-xs font-semibold text-slate-500">{item.sub}</p>
          )}

          {item.progress && (
            <div className="w-full h-2 rounded-full bg-slate-100 mt-4 overflow-hidden">
              <div
                className="h-2 rounded-full bg-blue-600"
                style={{ width: item.progress }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}