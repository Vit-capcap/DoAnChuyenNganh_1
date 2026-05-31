export default function SidebarItem({ icon, title, active }) {
    return (
      <button
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
          active
            ? "bg-blue-600/20 text-blue-400"
            : "text-gray-500 hover:bg-white/10 hover:text-white/70"
        }`}
      >
        <span className="material-symbols-outlined">
          {icon}
        </span>
  
        {title}
      </button>
    );
  }