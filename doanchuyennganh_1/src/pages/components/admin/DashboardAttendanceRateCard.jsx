export default function DashboardAttendanceRateCard({ dashboard }) {
  const attendancePercent = Number(
    dashboard?.attendancePercent ?? dashboard?.attendanceRate ?? 0
  );

  const attendedCount = Number(dashboard?.attendedCount || 0);
  const totalAttendance = Number(dashboard?.totalAttendance || 0);

  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-5 shadow-lg shadow-blue-100 relative overflow-hidden text-white">
      <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full blur-xl" />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <span className="material-symbols-outlined">fact_check</span>
          </div>

          <span className="text-xs font-bold text-blue-700 bg-white px-3 py-1.5 rounded-xl">
            Hôm nay
          </span>
        </div>

        <p className="text-xs font-bold text-white/80 uppercase mb-1">
          Tỷ lệ điểm danh
        </p>

        <h3 className="text-3xl font-black">{attendancePercent.toFixed(2)}%</h3>

        <div className="w-full h-2 rounded-full bg-white/20 mt-4 overflow-hidden">
          <div
            className="h-full rounded-full bg-white"
            style={{
              width: `${Math.min(attendancePercent, 100)}%`,
            }}
          />
        </div>

        <p className="text-xs font-semibold text-white/75 mt-3">
          {attendedCount}/{totalAttendance} lượt có mặt hoặc đi trễ
        </p>
      </div>
    </div>
  );
}