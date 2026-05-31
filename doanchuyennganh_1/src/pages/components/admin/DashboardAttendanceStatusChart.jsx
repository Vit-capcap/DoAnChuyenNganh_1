export default function DashboardAttendanceStatusChart({
  present = 0,
  late = 0,
  absent = 0,
  total = 0,
}) {
  const totalNumber = Number(total || 0);

  const presentPercent =
    totalNumber === 0
      ? 0
      : Number(((Number(present) / totalNumber) * 100).toFixed(1));

  const latePercent =
    totalNumber === 0
      ? 0
      : Number(((Number(late) / totalNumber) * 100).toFixed(1));

  const absentPercent =
    totalNumber === 0
      ? 0
      : Number(((Number(absent) / totalNumber) * 100).toFixed(1));

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
      <div className="mb-6 pb-4 border-b border-slate-200">
        <h3 className="text-xl font-black text-slate-900">
          Trạng thái điểm danh
        </h3>

        <p className="text-xs font-semibold text-slate-500 mt-1">
          Tổng quan trong ngày.
        </p>
      </div>

      <div className="flex flex-col items-center">
        <div
          className="w-44 h-44 rounded-full relative"
          style={{
            background: `conic-gradient(
              #2563eb 0% ${presentPercent}%,
              #f59e0b ${presentPercent}% ${presentPercent + latePercent}%,
              #ef4444 ${presentPercent + latePercent}% 100%
            )`,
            boxShadow: "inset 0 0 0 20px #ffffff",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-black text-slate-900">
                {totalNumber}
              </div>
              <div className="text-xs font-semibold text-slate-500">lượt</div>
            </div>
          </div>
        </div>

        <div className="mt-6 w-full space-y-3">
          <StatusRow
            label="Có mặt"
            value={present}
            percent={presentPercent}
            color="bg-blue-600"
          />

          <StatusRow
            label="Đi trễ"
            value={late}
            percent={latePercent}
            color="bg-amber-500"
          />

          <StatusRow
            label="Vắng"
            value={absent}
            percent={absentPercent}
            color="bg-red-500"
          />
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, value, percent, color }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <span className="font-semibold text-slate-600">{label}</span>
      </div>

      <span className="font-black text-slate-900">
        {value} ({percent}%)
      </span>
    </div>
  );
}