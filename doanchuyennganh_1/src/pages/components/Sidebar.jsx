export default function Sidebar() {
  const menu = [
    "dashboard",
    "face",
    "calendar_month",
    "history",
    "leaderboard",
    "notifications",
    "settings",
  ];

  return (
    <aside className="hidden md:flex w-[280px] fixed h-full bg-white border-r p-4 flex-col">
      <h1 className="text-xl font-bold mb-6">EduFace AI</h1>

      {menu.map((item) => (
        <div
          key={item}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer"
        >
          <span className="material-symbols-outlined">{item}</span>
          <span className="capitalize">{item}</span>
        </div>
      ))}
    </aside>
  );
}