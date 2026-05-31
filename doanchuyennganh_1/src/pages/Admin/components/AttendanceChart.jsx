// export default function AttendanceChart() {
//   return (
//     <div className="bg-white rounded-2xl p-6 shadow-sm border lg:col-span-2">
//       <div className="flex justify-between items-center mb-6 pb-3 border-b">
//         <h3 className="text-xl font-semibold">Xu hướng điểm danh</h3>
//         <span className="text-xs text-gray-500">7 ngày qua</span>
//       </div>

//       <div className="relative min-h-[240px] flex items-end justify-between px-4 pb-4">
//         <div className="absolute inset-0 flex flex-col justify-between py-4">
//           {[1, 2, 3, 4].map((i) => (
//             <div key={i} className="border-b border-gray-200" />
//           ))}
//         </div>

//         {[40, 60, 55, 80, 75, 90, 95].map((point, i) => (
//           <div
//             key={i}
//             className="w-2 h-2 rounded-full bg-blue-600 relative z-10 shadow-lg"
//             style={{ bottom: `${point}%` }}
//           />
//         ))}

//         <svg
//           className="absolute inset-0 h-full w-full"
//           preserveAspectRatio="none"
//         >
//           <path
//             d="M 5% 60% L 20% 40% L 35% 45% L 50% 20% L 65% 25% L 80% 10% L 95% 5%"
//             fill="none"
//             stroke="#2563eb"
//             strokeWidth="2"
//           />
//         </svg>
//       </div>

//       <div className="flex justify-between px-4 mt-2 text-xs text-gray-500">
//         <span>T2</span>
//         <span>T3</span>
//         <span>T4</span>
//         <span>T5</span>
//         <span>T6</span>
//         <span>T7</span>
//         <span>CN</span>
//       </div>
//     </div>
//   );
// }


export default function AttendanceChart({ data = [] }) {
  /*
    Component này nhận dữ liệu từ AdminDashboard.jsx:

    <AttendanceChart data={dashboard?.attendanceTrend || []} />

    Dữ liệu backend cần có dạng:

    attendanceTrend: [
      {
        date: "2025-11-12",
        day: "T4",
        totalAttendance: 25,
        attendedCount: 20,
        attendancePercent: 80
      },
      ...
    ]
  */

  // =========================
  // 1. Chuẩn hóa dữ liệu đầu vào
  // =========================
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
          {
            date: "",
            day: "T2",
            totalAttendance: 0,
            attendedCount: 0,
            attendancePercent: 0,
          },
          {
            date: "",
            day: "T3",
            totalAttendance: 0,
            attendedCount: 0,
            attendancePercent: 0,
          },
          {
            date: "",
            day: "T4",
            totalAttendance: 0,
            attendedCount: 0,
            attendancePercent: 0,
          },
          {
            date: "",
            day: "T5",
            totalAttendance: 0,
            attendedCount: 0,
            attendancePercent: 0,
          },
          {
            date: "",
            day: "T6",
            totalAttendance: 0,
            attendedCount: 0,
            attendancePercent: 0,
          },
          {
            date: "",
            day: "T7",
            totalAttendance: 0,
            attendedCount: 0,
            attendancePercent: 0,
          },
          {
            date: "",
            day: "CN",
            totalAttendance: 0,
            attendedCount: 0,
            attendancePercent: 0,
          },
        ];

  // =========================
  // 2. Chuyển dữ liệu thành tọa độ vẽ biểu đồ
  // =========================
  const points = chartData.map((item, index) => {
    /*
      Trục X:
      - Điểm đầu nằm ở 5%
      - Điểm cuối nằm ở 95%
      - Các điểm còn lại chia đều ở giữa
    */
    const x =
      chartData.length === 1
        ? 50
        : (index / (chartData.length - 1)) * 90 + 5;

    /*
      Trục Y trong SVG ngược với biểu đồ thường:
      - y = 0 nằm trên cùng
      - y = 100 nằm dưới cùng

      Nếu attendancePercent = 80
      => y = 20
    */
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

  // =========================
  // 3. Tạo đường nối các điểm trong SVG
  // =========================
  const pathData = points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command} ${point.x} ${point.y}`;
    })
    .join(" ");

  // =========================
  // 4. Tính tỷ lệ trung bình 7 ngày
  // =========================
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
    <div className="bg-white rounded-2xl p-6 shadow-sm border lg:col-span-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-3 border-b">
        <div>
          <h3 className="text-xl font-semibold">Xu hướng điểm danh</h3>

          <p className="text-xs text-gray-400 mt-1">
            Tính theo trạng thái PRESENT và LATE
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-gray-500 block">7 ngày</span>
          <span className="text-sm font-semibold text-blue-600">
            TB: {averagePercent.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative min-h-[240px] px-8 pb-4">
        {/* Đường kẻ nền */}
        <div className="absolute inset-0 flex flex-col justify-between py-4">
          {[100, 75, 50, 25, 0].map((value) => (
            <div key={value} className="relative border-b border-gray-200">
              <span className="absolute -left-7 -top-2 text-[10px] text-gray-400">
                {value}%
              </span>
            </div>
          ))}
        </div>

        {/* Đường biểu đồ */}
        <svg
          className="absolute inset-0 h-full w-full z-10"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d={pathData}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Các điểm tròn */}
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
              <div className="w-3 h-3 rounded-full bg-blue-600 shadow-lg border-2 border-white cursor-pointer" />

              {/* Tooltip */}
              <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 -top-20 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                <div className="font-semibold">
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

      {/* Nhãn ngày */}
      <div className="flex justify-between px-8 mt-2 text-xs text-gray-500">
        {chartData.map((item, index) => (
          <div key={index} className="text-center">
            <div>{item.day}</div>
            {item.date && (
              <div className="text-[10px] text-gray-400">
                {item.date.slice(5)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}