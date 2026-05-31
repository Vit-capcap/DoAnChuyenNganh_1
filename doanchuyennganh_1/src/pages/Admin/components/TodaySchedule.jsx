export default function TodaySchedule() {
  const schedules = [
    {
      time: "07:00 - 07:30",
      title: "Điểm danh đầu giờ",
      desc: "Toàn trường",
      active: true,
    },
    {
      time: "09:15 - 09:30",
      title: "Điểm danh ca 2",
      desc: "Khối 11, 12",
    },
    {
      time: "13:00 - 13:30",
      title: "Điểm danh ca chiều",
      desc: "Toàn trường",
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border">
      <div className="mb-4 pb-3 border-b">
        <h3 className="text-xl font-semibold">Lịch trình hôm nay</h3>
      </div>

      <div className="flex flex-col gap-4 relative">
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-300" />

        {schedules.map((item, index) => (
          <div key={index} className="flex items-start gap-4 relative z-10">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center mt-1 ${
                item.active
                  ? "bg-blue-600"
                  : "bg-gray-100 border border-gray-300"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  item.active ? "bg-white" : "bg-gray-500"
                }`}
              />
            </div>

            <div className="bg-gray-50 p-3 rounded-lg flex-1 border">
              <p
                className={`text-xs font-semibold mb-1 ${
                  item.active ? "text-blue-600" : "text-gray-500"
                }`}
              >
                {item.time}
              </p>
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}