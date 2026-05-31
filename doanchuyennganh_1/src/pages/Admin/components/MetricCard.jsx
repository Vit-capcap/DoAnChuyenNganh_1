export default function MetricCard({ icon, title, value, tag }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition border">
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
          <span className="material-symbols-outlined text-blue-600">
            {icon}
          </span>
        </div>

        {tag && (
          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
            {tag}
          </span>
        )}
      </div>

      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <h3 className="text-3xl font-bold">{value}</h3>
    </div>
  );
}