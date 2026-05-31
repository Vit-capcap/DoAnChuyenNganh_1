export default function TeacherStats({ stats }) {
  const cards = [
    {
      title: "Tổng giáo viên",
      value: stats.total,
      icon: "groups",
      textClass: "text-slate-900",
      bgClass: "bg-blue-50 text-blue-600",
    },
    {
      title: "Đang công tác",
      value: stats.active,
      icon: "verified_user",
      textClass: "text-emerald-600",
      bgClass: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Khoa/Bộ môn",
      value: stats.departments,
      icon: "apartment",
      textClass: "text-indigo-600",
      bgClass: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "Thiếu email",
      value: stats.missingEmail,
      icon: "mark_email_unread",
      textClass: "text-rose-600",
      bgClass: "bg-rose-50 text-rose-600",
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