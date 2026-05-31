export default function RecentActivities() {
  const activities = [
    {
      name: "Nguyễn Văn A",
      text: "điểm danh thành công tại",
      room: "P.302",
      time: "Vừa xong",
      status: "Thành công",
      color: "green",
    },
    {
      name: "Trần Thị B",
      text: "điểm danh trễ tại",
      room: "P.105",
      time: "5 phút trước",
      status: "Đi trễ",
      color: "yellow",
    },
    {
      name: "",
      text: "Không nhận diện được khuôn mặt tại",
      room: "Cổng chính",
      time: "12 phút trước",
      status: "Cảnh báo",
      color: "red",
      warning: true,
    },
    {
      name: "GV. Lê Văn C",
      text: "điểm danh thành công tại",
      room: "P.Giáo Viên",
      time: "20 phút trước",
      status: "Thành công",
      color: "green",
    },
  ];

  const statusClass = {
    green: "bg-green-50 text-green-600 border-green-200",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
    red: "bg-red-50 text-red-600 border-red-200",
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border lg:col-span-2">
      <div className="flex justify-between items-center mb-4 pb-3 border-b">
        <h3 className="text-xl font-semibold">Hoạt động gần đây</h3>
        <button className="text-sm font-semibold text-blue-600 hover:underline">
          Xem tất cả
        </button>
      </div>

      <div className="flex flex-col">
        {activities.map((item, index) => (
          <div key={index}>
            <div className="flex items-start gap-4 py-3 hover:bg-gray-50 rounded-lg px-2">
              {item.warning ? (
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-red-600">
                    warning
                  </span>
                </div>
              ) : (
                <img
                  alt="Avatar"
                  className="w-10 h-10 rounded-full border"
                  src={`https://i.pravatar.cc/150?img=${index + 20}`}
                />
              )}

              <div className="flex-1">
                <p className="text-sm">
                  {item.name && <span className="font-bold">{item.name} </span>}
                  {item.text} <span className="font-bold">{item.room}</span>
                </p>

                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">
                    schedule
                  </span>
                  {item.time}
                </p>
              </div>

              <span
                className={`px-2 py-1 rounded text-xs font-semibold border ${
                  statusClass[item.color]
                }`}
              >
                {item.status}
              </span>
            </div>

            {index !== activities.length - 1 && (
              <div className="h-px bg-gray-200 ml-14" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}