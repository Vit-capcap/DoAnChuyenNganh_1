export default function AttendanceDistributionChart({ distribution, attendanceRate }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 h-[400px]">
      <div className="mb-6">
        <h2 className="text-xl font-black text-slate-900">
          Tỷ lệ điểm danh
        </h2>

        <p className="text-xs font-semibold text-slate-500 mt-1">
          Phân bổ Có mặt / Đi muộn / Vắng mặt.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center">
        <div
          className="w-48 h-48 rounded-full relative"
          style={{
            background: `conic-gradient(
              #2563EB 0% ${distribution.presentPercent}%,
              #f59e0b ${distribution.presentPercent}% ${
              distribution.presentPercent + distribution.latePercent
            }%,
              #ef4444 ${
                distribution.presentPercent + distribution.latePercent
              }% 100%
            )`,
            boxShadow: "inset 0 0 0 20px #ffffff",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="block text-3xl font-black text-slate-900">
                {attendanceRate.toFixed(1)}%
              </span>

              <span className="block text-xs font-semibold text-slate-500">
                Chuyên cần
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 w-full space-y-3">
          {[
            ["Có mặt", distribution.presentPercent, "bg-blue-600"],
            ["Đi muộn", distribution.latePercent, "bg-amber-500"],
            ["Vắng mặt", distribution.absentPercent, "bg-red-500"],
          ].map(([label, value, color]) => (
            <div
              key={label}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span className="font-semibold text-slate-600">{label}</span>
              </div>

              <span className="font-black text-slate-900">{value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}