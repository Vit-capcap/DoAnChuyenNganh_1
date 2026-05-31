export default function RoomFilters({
  search,
  setSearch,
  buildingFilter,
  setBuildingFilter,
  roomStatusFilter,
  setRoomStatusFilter,
  cameraFilter,
  setCameraFilter,
  buildings,
  onReset,
}) {
  return (
    <div className="bg-white rounded-3xl shadow-sm p-5 mb-6 border border-slate-200">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Bộ lọc tìm kiếm
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Lọc nhanh theo mã phòng, tên phòng, tòa nhà, trạng thái phòng và
            trạng thái camera.
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition"
            placeholder="Tìm mã phòng, tên phòng, camera..."
            type="text"
          />
        </div>

        <div className="relative">
          <select
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none appearance-none transition"
          >
            <option value="">Tất cả tòa nhà</option>

            {buildings.map((building) => (
              <option key={building} value={building}>
                {building}
              </option>
            ))}
          </select>

          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            expand_more
          </span>
        </div>

        <div className="relative">
          <select
            value={roomStatusFilter}
            onChange={(e) => setRoomStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none appearance-none transition"
          >
            <option value="">Tất cả trạng thái phòng</option>
            <option value="ACTIVE">Đang sử dụng</option>
            <option value="MAINTENANCE">Bảo trì</option>
          </select>

          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            expand_more
          </span>
        </div>

        <div className="relative">
          <select
            value={cameraFilter}
            onChange={(e) => setCameraFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none appearance-none transition"
          >
            <option value="">Tất cả camera</option>
            <option value="ONLINE">Online</option>
            <option value="OFFLINE">Offline</option>
          </select>

          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            expand_more
          </span>
        </div>
      </div>
    </div>
  );
}