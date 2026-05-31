export default function ScheduleFilters({
  search,
  setSearch,
  courseClassFilter,
  setCourseClassFilter,
  teacherFilter,
  setTeacherFilter,
  roomFilter,
  setRoomFilter,
  dayFilter,
  setDayFilter,
  courseClasses,
  teachers,
  rooms,
  dayLabels,
  onReset,
}) {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 mb-6">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Bộ lọc lịch học
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Lọc theo môn học, lớp học phần, giáo viên, phòng học và thứ trong
            tuần.
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
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition"
            placeholder="Môn, lớp, GV, phòng..."
          />
        </div>

        <FilterSelect
          value={courseClassFilter}
          onChange={(e) => setCourseClassFilter(e.target.value)}
        >
          <option value="">Tất cả lớp học phần</option>
          {courseClasses.map((item) => (
            <option key={item.id_course_class} value={item.id_course_class}>
              {item.class_code} - {item.subject_name}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={teacherFilter}
          onChange={(e) => setTeacherFilter(e.target.value)}
        >
          <option value="">Tất cả giáo viên</option>
          {teachers.map((item) => (
            <option key={item.id_teacher} value={item.id_teacher}>
              {item.full_name}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
        >
          <option value="">Tất cả phòng</option>
          {rooms.map((item) => (
            <option key={item.id_room} value={item.id_room}>
              {item.room_code} - {item.room_name}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}>
          <option value="">Tất cả các ngày</option>
          {Object.entries(dayLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
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