import RoomCard from "./RoomCard";

export default function RoomList({ rooms, loading, totalRooms, onEdit, onDelete }) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm flex flex-col items-center justify-center min-h-[260px]">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />

        <p className="text-sm font-semibold text-slate-600">
          Đang tải danh sách phòng học...
        </p>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-slate-400 text-3xl">
            meeting_room
          </span>
        </div>

        <h3 className="font-black text-slate-900">
          Không tìm thấy phòng học phù hợp
        </h3>

        <p className="text-sm text-slate-500 mt-2">
          Hãy kiểm tra lại từ khóa tìm kiếm hoặc bộ lọc phòng học.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">
          Hiển thị{" "}
          <span className="font-black text-slate-900">{rooms.length}</span>{" "}
          trong số{" "}
          <span className="font-black text-slate-900">{totalRooms}</span>{" "}
          phòng học
        </p>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Đang sử dụng
          <span className="w-2 h-2 rounded-full bg-amber-500 ml-3" />
          Bảo trì
          <span className="w-2 h-2 rounded-full bg-rose-500 ml-3" />
          Offline
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <RoomCard
            key={room.id_room}
            room={room}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}