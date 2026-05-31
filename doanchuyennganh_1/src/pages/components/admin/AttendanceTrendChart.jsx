export default function AttendanceTrendChart({
  trend,
  trendPoints,
  trendAreaPath,
  fromDate,
  toDate,
  formatDate,
}) {
  return (
    <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 h-[400px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Biểu đồ xu hướng điểm danh
          </h2>

          <p className="text-xs font-semibold text-slate-500 mt-1">
            Tỷ lệ chuyên cần theo thời gian.
          </p>
        </div>

        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
          {formatDate(fromDate)} - {formatDate(toDate)}
        </span>
      </div>

      <div className="relative h-[280px] border-l border-b border-slate-200">
        <div className="absolute inset-0 flex flex-col justify-between">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border-b border-slate-100 h-1/4" />
          ))}
        </div>

        {trend.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-sm text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-2">
              monitoring
            </span>
            Không có dữ liệu xu hướng
          </div>
        ) : (
          <svg
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <defs>
              <linearGradient id="lineGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(37,99,235,0.2)" />
                <stop offset="100%" stopColor="rgba(37,99,235,0)" />
              </linearGradient>
            </defs>

            {trendAreaPath && <path d={trendAreaPath} fill="url(#lineGrad)" />}

            <polyline
              points={trendPoints}
              fill="none"
              stroke="#2563EB"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />

            {trend.map((item, index) => {
              const x =
                trend.length === 1
                  ? 50
                  : (index / Math.max(trend.length - 1, 1)) * 100;

              const y =
                100 -
                Math.min(Math.max(Number(item.attendance_rate || 0), 0), 100);

              return <circle key={index} cx={x} cy={y} r="3" fill="#2563EB" />;
            })}
          </svg>
        )}

        <div className="absolute -bottom-8 left-0 right-0 flex justify-between text-xs text-slate-500 px-2">
          {trend.length === 0 ? (
            <span>Không có dữ liệu</span>
          ) : (
            trend.map((item) => (
              <span key={item.report_date}>
                {formatDate(item.report_date).slice(0, 5)}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}