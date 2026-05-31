export default function StatCard({ icon, value, label, color = "green" }) {
    const colorMap = {
      green: {
        text: "text-green-600",
        bg: "bg-green-100",
      },
      red: {
        text: "text-red-600",
        bg: "bg-red-100",
      },
      yellow: {
        text: "text-yellow-600",
        bg: "bg-yellow-100",
      },
      blue: {
        text: "text-blue-600",
        bg: "bg-blue-100",
      },
      purple: {
        text: "text-purple-600",
        bg: "bg-purple-100",
      },
    };

    const colorHover = {
        green: "hover:border-green-500",
        red: "hover:border-red-500",
        yellow: "hover:border-yellow-500",
    };
  
    return (
    <div className={`relative p-5 bg-white rounded-2xl shadow-md border border-transparent hover:shadow-xl transition-all duration-300 ${colorHover[color]}`}>        {/* ICON */}
        <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${colorMap[color].bg}`}>
          <span className={`material-symbols-outlined ${colorMap[color].text} text-2xl`}>
            {icon}
          </span>
        </div>
  
        {/* VALUE */}
        <h2 className="text-3xl font-bold mt-4 text-gray-900">
          {value}
        </h2>
  
        {/* LABEL */}
        <p className={`text-sm mt-1 font-medium ${colorMap[color].text}`}>
          {label}
        </p>
    </div>
    );
  }