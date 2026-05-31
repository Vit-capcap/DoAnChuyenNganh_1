import { useNavigate } from "react-router-dom";

export default function DashboardQuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      label: "Thêm học sinh",
      icon: "person_add",
      path: "/addstudent",
      iconClass: "text-blue-600",
    },
    {
      label: "Cập nhật FaceID",
      icon: "camera_alt",
      path: "/students",
      iconClass: "text-indigo-600",
    },
    {
      label: "Xử lý lỗi nhận diện",
      icon: "problem",
      path: "/cameras",
      iconClass: "text-orange-600",
      colSpan: true,
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
      <h3 className="text-xl font-black mb-4 text-slate-900">
        Thao tác nhanh
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-blue-50 rounded-2xl border border-slate-200 gap-2 transition ${
              item.colSpan ? "col-span-2" : ""
            }`}
          >
            <span className={`material-symbols-outlined ${item.iconClass}`}>
              {item.icon}
            </span>

            <span className="text-sm font-bold text-center text-slate-700">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}