export default function ReportKpiCards({ kpis }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {kpis.map((item) => (
        <div
          key={item.title}
          className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200"
        >
          <div className="flex justify-between items-start mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.iconClass}`}>
              <span className="material-symbols-outlined">{item.icon}</span>
            </div>
          </div>

          <p className="text-xs font-bold text-slate-400 uppercase mb-1">
            {item.title}
          </p>

          <h3 className="text-3xl font-black text-slate-900">
            {item.value}
          </h3>
        </div>
      ))}
    </div>
  );
}