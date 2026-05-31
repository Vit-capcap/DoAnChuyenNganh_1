export default function ReportFilters({
  period,
  fromDate,
  toDate,
  classFilter,
  subjectFilter,
  classes,
  subjects,
  onPeriodChange,
  onFromDateChange,
  onToDateChange,
  onClassChange,
  onSubjectChange,
  onReset,
  onExportCSV,
  onPrint,
}) {
  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-6 print:hidden">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Bộ lọc báo cáo
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Lọc dữ liệu theo thời gian, lớp học và môn học.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            value={period}
            onChange={(e) => onPeriodChange(e.target.value)}
          >
            <option value="month">Tháng này</option>
            <option value="week">Tuần này</option>
            <option value="semester">Học kỳ gần đây</option>
            <option value="custom">Tùy chỉnh</option>
          </FilterSelect>

          {period === "custom" && (
            <>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => onFromDateChange(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition"
              />

              <input
                type="date"
                value={toDate}
                onChange={(e) => onToDateChange(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition"
              />
            </>
          )}

          <FilterSelect
            value={classFilter}
            onChange={(e) => onClassChange(e.target.value)}
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
            onChange={(e) => onSubjectChange(e.target.value)}
          >
            <option value="">Tất cả môn học</option>
            {subjects.map((item) => (
              <option key={item.id_subject} value={item.id_subject}>
                {item.subject_name}
              </option>
            ))}
          </FilterSelect>

          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-3 bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-200 text-sm font-bold transition"
          >
            <span className="material-symbols-outlined text-[18px]">
              restart_alt
            </span>
            Xóa lọc
          </button>

          <button
            type="button"
            onClick={onExportCSV}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 text-sm font-bold transition"
          >
            <span className="material-symbols-outlined text-[18px]">
              table_view
            </span>
            Xuất CSV
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 text-sm font-bold shadow-sm transition"
          >
            <span className="material-symbols-outlined text-[18px]">
              print
            </span>
            In báo cáo
          </button>
        </div>
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
        className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 pr-10 text-sm text-slate-700 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none appearance-none transition min-w-[160px]"
      >
        {children}
      </select>

      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        expand_more
      </span>
    </div>
  );
}