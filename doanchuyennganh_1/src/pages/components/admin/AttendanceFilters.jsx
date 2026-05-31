export default function AttendanceFilters({
  search,
  setSearch,
  dateFilter,
  setDateFilter,
  classFilter,
  setClassFilter,
  subjectFilter,
  setSubjectFilter,
  statusFilter,
  setStatusFilter,
  classes,
  subjects,
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
            Bộ lọc điểm danh
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Lọc theo ngày, lớp, môn học, trạng thái hoặc tìm kiếm sinh viên.
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="relative xl:col-span-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>

          <input
            type="text"
            value={search}
            onChange={(e) => updateFilter(setSearch, e.target.value)}
            placeholder="Tìm mã SV, họ tên, lớp..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition"
          />
        </div>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => updateFilter(setDateFilter, e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition"
        />

        <FilterSelect
          value={classFilter}
          onChange={(e) => updateFilter(setClassFilter, e.target.value)}
        >
          <option value="">Tất cả lớp</option>
          {classes.map((item) => (
            <option key={item.class_name} value={item.class_name}>
              {item.class_name}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={subjectFilter}
          onChange={(e) => updateFilter(setSubjectFilter, e.target.value)}
        >
          <option value="">Tất cả môn học</option>
          {subjects.map((item) => (
            <option key={item.id_subject} value={item.id_subject}>
              {item.subject_name}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={statusFilter}
          onChange={(e) => updateFilter(setStatusFilter, e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PRESENT">Có mặt</option>
          <option value="LATE">Đi trễ</option>
          <option value="ABSENT">Vắng mặt</option>
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