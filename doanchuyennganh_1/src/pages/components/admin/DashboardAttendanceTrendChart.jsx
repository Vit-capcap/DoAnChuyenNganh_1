export default function DashboardAttendanceTrendChart({ data = [] }) {
  const chartData =
    Array.isArray(data) && data.length > 0
      ? data.map((item) => ({
          date: item.date || "",
          day: item.day || "",
          totalAttendance: Number(item.totalAttendance || 0),
          attendedCount: Number(item.attendedCount || 0),
          attendancePercent: Number(item.attendancePercent || 0),
        }))
      : [
          { day: "T2", totalAttendance: 0, attendedCount: 0, attendancePercent: 0 },
          { day: "T3", totalAttendance: 0, attendedCount: 0, attendancePercent: 0 },
          { day: "T4", totalAttendance: 0, attendedCount: 0, attendancePercent: 0 },
          { day: "T5", totalAttendance: 0, attendedCount: 0, attendancePercent: 0 },
          { day: "T6", totalAttendance: 0, attendedCount: 0, attendancePercent: 0 },
          { day: "T7", totalAttendance: 0, attendedCount: 0, attendancePercent: 0 },
          { day: "CN", totalAttendance: 0, attendedCount: 0, attendancePercent: 0 },
        ];

  const points = chartData.map((item, index) => {
    const x =
      chartData.length === 1 ? 50 : (index / (chartData.length - 1)) * 90 + 5;

    const percent = Math.min(
      100,
      Math.max(0, Number(item.attendancePercent || 0))
    );

    const y = 100 - percent;

    return {
      x,
      y,
      percent,
      day: item.day,
      date: item.date,
      totalAttendance: item.totalAttendance,
      attendedCount: item.attendedCount,
    };
  });

  const pathData = points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command} ${point.x} ${point.y}`;
    })
    .join(" ");

  const areaPath = pathData
    ? `${pathData} L ${points.at(-1)?.x || 100} 100 L ${points[0]?.x || 0} 100 Z`
    : "";

  const totalAttendance = chartData.reduce(
    (sum, item) => sum + item.totalAttendance,
    0
  );

  const totalAttended = chartData.reduce(
    (sum, item) => sum + item.attendedCount,
    0
  );

  const averagePercent =
    totalAttendance === 0
      ? 0
      : Number(((totalAttended / totalAttendance) * 100).toFixed(2));

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 lg:col-span-2">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-xl font-black text-slate-900">
            Xu hướng điểm danh
          </h3>

          <p className="text-xs font-semibold text-slate-500 mt-1">
            Tính theo trạng thái PRESENT và LATE trong 7 ngày gần nhất.
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-slate-400 block">
            7 ngày
          </span>

          <span className="text-sm font-black text-blue-600">
            TB: {averagePercent.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="relative min-h-[260px] px-8 pb-4">
        <div className="absolute inset-0 flex flex-col justify-between py-4">
          {[100, 75, 50, 25, 0].map((value) => (
            <div key={value} className="relative border-b border-slate-100">
              <span className="absolute -left-7 -top-2 text-[10px] text-slate-400">
                {value}%
              </span>
            </div>
          ))}
        </div>

        <svg
          className="absolute inset-0 h-full w-full z-10"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="dashboardTrendArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(37,99,235,0.18)" />
              <stop offset="100%" stopColor="rgba(37,99,235,0)" />
            </linearGradient>
          </defs>

          {areaPath && <path d={areaPath} fill="url(#dashboardTrendArea)" />}

          <path
            d={pathData}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div className="absolute inset-0 z-20">
          {points.map((point, index) => (
            <div
              key={index}
              className="absolute group"
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-blue-600 shadow-lg border-2 border-white cursor-pointer" />

              <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 -top-24 bg-slate-900 text-white text-xs rounded-xl px-3 py-2 whitespace-nowrap shadow-lg">
                <div className="font-bold">
                  {point.day} {point.date ? `- ${point.date}` : ""}
                </div>

                <div>Tỷ lệ: {point.percent.toFixed(2)}%</div>

                <div>
                  Có mặt: {point.attendedCount}/{point.totalAttendance}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between px-8 mt-2 text-xs text-slate-500">
        {chartData.map((item, index) => (
          <div key={index} className="text-center font-semibold">
            <div>{item.day}</div>

            {item.date && (
              <div className="text-[10px] text-slate-400">
                {item.date.slice(5)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}