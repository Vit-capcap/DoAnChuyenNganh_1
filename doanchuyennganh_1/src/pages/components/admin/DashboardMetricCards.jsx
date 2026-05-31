export default function DashboardMetricCards({ cards }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <MetricCard
          key={card.title}
          icon={card.icon}
          title={card.title}
          value={card.value}
          tag={card.tag}
          iconClass={card.iconClass}
        />
      ))}
    </div>
  );
}

function MetricCard({ icon, title, value, tag, iconClass }) {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
      <div className="flex justify-between items-start mb-4">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            iconClass || "bg-blue-50 text-blue-600"
          }`}
        >
          <span className="material-symbols-outlined">{icon}</span>
        </div>

        {tag && (
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl ring-1 ring-blue-100">
            {tag}
          </span>
        )}
      </div>

      <p className="text-xs font-bold text-slate-400 uppercase mb-1">
        {title}
      </p>

      <h3 className="text-3xl font-black text-slate-900">{value}</h3>
    </div>
  );
}