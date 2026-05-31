export default function TeacherFilters({
  searchKeyword,
  setSearchKeyword,
  selectedDepartment,
  setSelectedDepartment,
  selectedStatus,
  setSelectedStatus,
  departmentOptions,
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
            Lọc nhanh theo tên, mã giáo viên, email, số điện thoại, khoa/bộ môn
            và trạng thái.
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>

          <input
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition"
            placeholder="Tìm tên, mã GV, email, số điện thoại..."
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>

        <div className="relative">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none appearance-none transition"
          >
            <option value="">Tất cả khoa/bộ môn</option>

            {departmentOptions.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>

          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            expand_more
          </span>
        </div>

        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none appearance-none transition"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang công tác</option>
            <option value="inactive">Tạm nghỉ / khác</option>
          </select>

          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            expand_more
          </span>
        </div>
      </div>
    </div>
  );
}