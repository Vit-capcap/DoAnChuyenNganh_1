export default function CameraFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  roomFilter,
  setRoomFilter,
  rooms,
  onReset,
}) {
  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Bộ lọc camera
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Tìm kiếm theo tên camera, địa chỉ IP, phòng học hoặc trạng thái.
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-600 hover:bg-slate-100 transition"
        >
          Xóa lọc
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm camera, IP, phòng..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition"
          />
        </div>

        <FilterSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ONLINE">Online</option>
          <option value="OFFLINE">Offline</option>
        </FilterSelect>

        <FilterSelect
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
        >
          <option value="">Tất cả phòng</option>

          {rooms.map((room) => (
            <option key={room.id_room} value={room.id_room}>
              {room.room_code} - {room.room_name || "Không tên"}
            </option>
          ))}
        </FilterSelect>
      </div>
    </div>
  );
}

function FilterSelect({ value, onChange, children }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none appearance-none transition"
      >
        {children}
      </select>

      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        expand_more
      </span>
    </div>
  );
}