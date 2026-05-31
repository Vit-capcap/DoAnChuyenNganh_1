export default function ScheduleStats({ stats }) {
  const cards = [
    {
      title: "Tổng lịch học",
      value: stats.total,
      icon: "calendar_month",
      textClass: "text-slate-900",
      bgClass: "bg-blue-50 text-blue-600",
    },
    {
      title: "Lịch hôm nay",
      value: stats.today,
      icon: "today",
      textClass: "text-emerald-600",
      bgClass: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Lớp học phần",
      value: stats.courseClasses,
      icon: "menu_book",
      textClass: "text-indigo-600",
      bgClass: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "Phòng học",
      value: stats.rooms,
      icon: "meeting_room",
      textClass: "text-amber-600",
      bgClass: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">
                {card.title}
              </p>

              <h3 className={`text-3xl font-black mt-1 ${card.textClass}`}>
                {card.value}
              </h3>
            </div>

            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.bgClass}`}
            >
              <span className="material-symbols-outlined">{card.icon}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}