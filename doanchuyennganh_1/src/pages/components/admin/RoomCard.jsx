export default function RoomCard({ room, onEdit, onDelete }) {
  const isOnline = room.camera_status === "ONLINE";
  const isMaintenance = room.room_status === "MAINTENANCE";

  const statusBadge = isMaintenance
    ? {
        text: "Bảo trì",
        icon: "build",
        className: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
      }
    : {
        text: "Đang sử dụng",
        icon: "check_circle",
        className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
      };

  const cameraBadge = isOnline
    ? {
        text: "Online",
        icon: "videocam",
        className: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
      }
    : {
        text: "Offline",
        icon: "videocam_off",
        className: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
      };

  return (
    <div className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-100/70 transition overflow-hidden relative">
      <div
        className={`absolute left-0 top-0 h-full w-1.5 ${
          isMaintenance ? "bg-amber-500" : isOnline ? "bg-emerald-500" : "bg-rose-500"
        }`}
      />

      <div className="p-6 pl-7">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[24px]">
                  meeting_room
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900">
                  {room.room_code || "Chưa có mã"}
                </h3>

                <p className="text-sm font-semibold text-slate-500">
                  {room.room_name || "Chưa có tên phòng"}
                </p>
              </div>
            </div>

            <p className="text-xs font-semibold text-slate-400">
              {room.building || "Chưa có tòa nhà"}
              {room.floor ? ` • Tầng ${room.floor}` : ""}
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold ${statusBadge.className}`}
          >
            <span className="material-symbols-outlined text-[15px]">
              {statusBadge.icon}
            </span>
            {statusBadge.text}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-xs font-bold text-slate-400 uppercase">
              Sức chứa
            </p>

            <p className="text-2xl font-black text-slate-900 mt-1">
              {room.capacity || 0}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-xs font-bold text-slate-400 uppercase">
              Camera
            </p>

            <span
              className={`mt-2 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold ${cameraBadge.className}`}
            >
              <span className="material-symbols-outlined text-[15px]">
                {cameraBadge.icon}
              </span>
              {cameraBadge.text}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <InfoLine
            icon="photo_camera"
            label="Tên camera"
            value={room.camera_name || "Chưa gắn camera"}
          />

          <InfoLine
            icon="router"
            label="IP camera"
            value={room.camera_ip || "Chưa có"}
          />

          <InfoLine
            icon="location_on"
            label="Vị trí"
            value={room.camera_location || "Chưa cập nhật"}
          />
        </div>
      </div>

      <div className="border-t border-slate-200 px-5 py-4 bg-slate-50 flex items-center gap-2">
        {isOnline && !isMaintenance ? (
          <button
            type="button"
            onClick={() =>
              alert(
                room.camera_ip
                  ? `Camera IP: ${room.camera_ip}`
                  : "Camera chưa có địa chỉ IP"
              )
            }
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">
              videocam
            </span>
            Camera
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-slate-200 px-4 py-2.5 text-sm font-bold text-slate-400 cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">
              videocam_off
            </span>
            Không khả dụng
          </button>
        )}

        <button
          type="button"
          onClick={() => onEdit(room)}
          className="w-11 h-11 flex items-center justify-center border border-slate-200 rounded-2xl text-slate-500 hover:bg-white hover:text-blue-600 transition"
          title="Sửa phòng"
        >
          <span className="material-symbols-outlined text-[20px]">edit</span>
        </button>

        <button
          type="button"
          onClick={() => onDelete(room)}
          className="w-11 h-11 flex items-center justify-center border border-red-100 rounded-2xl text-red-500 hover:bg-red-50 transition"
          title="Xóa phòng"
        >
          <span className="material-symbols-outlined text-[20px]">delete</span>
        </button>
      </div>
    </div>
  );
}

function InfoLine({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
      <span className="material-symbols-outlined text-[20px] text-slate-400">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-400 uppercase">{label}</p>
        <p className="text-sm font-semibold text-slate-700 mt-0.5 truncate">
          {value}
        </p>
      </div>
    </div>
  );
}