export default function AccountFilters({
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  onReset,
  onPageReset,
}) {
  const updateFilter = (callback, value) => {
    callback(value);
    onPageReset();
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Bộ lọc tài khoản
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Tìm theo tên, email, username, vai trò hoặc trạng thái tài khoản.
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
            onChange={(e) => updateFilter(setSearch, e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition"
            placeholder="Tìm tên, email, username..."
            type="text"
          />
        </div>

        <FilterSelect
          value={roleFilter}
          onChange={(e) => updateFilter(setRoleFilter, e.target.value)}
        >
          <option value="">Tất cả vai trò</option>
          <option value="ADMIN">Admin</option>
          <option value="TEACHER">Giáo viên</option>
          <option value="STUDENT">Sinh viên</option>
        </FilterSelect>

        <FilterSelect
          value={statusFilter}
          onChange={(e) => updateFilter(setStatusFilter, e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="LOCKED">Bị khóa</option>
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