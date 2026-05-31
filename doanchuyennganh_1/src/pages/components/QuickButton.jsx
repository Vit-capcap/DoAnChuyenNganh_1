export default function QuickButton({ icon, title, primary }) {
    return (
      <button
        className={`w-full flex items-center justify-between px-4 py-4 rounded-xl transition ${
          primary
            ? "bg-blue-600 text-white"
            : "bg-gray-100 hover:bg-gray-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined">
            {icon}
          </span>
  
          {title}
        </div>
  
        <span className="material-symbols-outlined">
          arrow_forward
        </span>
      </button>
    );
  }
  