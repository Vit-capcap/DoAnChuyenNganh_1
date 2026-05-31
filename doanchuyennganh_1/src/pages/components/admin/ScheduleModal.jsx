export default function ScheduleModal({
  mode,
  formData,
  courseClasses,
  rooms,
  dayLabels,
  saving,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl relative z-10 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="text-xl font-black">
                {mode === "add" ? "Thêm lịch học" : "Chỉnh sửa lịch học"}
              </h3>

              <p className="text-sm text-blue-100 mt-1">
                Chọn lớp học phần, phòng học và thời gian giảng dạy.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-2xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit}>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormSelect
              label="Lớp học phần"
              name="id_course_class"
              value={formData.id_course_class}
              onChange={onChange}
              required
            >
              <option value="">Chọn lớp học phần</option>
              {courseClasses.map((item) => (
                <option key={item.id_course_class} value={item.id_course_class}>
                  {item.class_code} - {item.subject_name} - {item.teacher_name}
                </option>
              ))}
            </FormSelect>

            <FormSelect
              label="Phòng học"
              name="id_room"
              value={formData.id_room}
              onChange={onChange}
              required
            >
              <option value="">Chọn phòng học</option>
              {rooms.map((item) => (
                <option key={item.id_room} value={item.id_room}>
                  {item.room_code} - {item.room_name} - {item.building}
                </option>
              ))}
            </FormSelect>

            <FormSelect
              label="Thứ"
              name="day_of_week"
              value={formData.day_of_week}
              onChange={onChange}
              required
            >
              {Object.entries(dayLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </FormSelect>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Giờ bắt đầu"
                name="start_time"
                type="time"
                value={formData.start_time}
                onChange={onChange}
                required
              />

              <Input
                label="Giờ kết thúc"
                name="end_time"
                type="time"
                value={formData.end_time}
                onChange={onChange}
                required
              />
            </div>

            <Input
              label="Ngày bắt đầu"
              name="start_date"
              type="date"
              value={formData.start_date}
              onChange={onChange}
            />

            <Input
              label="Ngày kết thúc"
              name="end_date"
              type="date"
              value={formData.end_date}
              onChange={onChange}
            />
          </div>

          <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl text-sm font-bold border border-slate-300 text-slate-700 hover:bg-white transition"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-2xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <span
                className={`material-symbols-outlined text-[18px] ${
                  saving ? "animate-spin" : ""
                }`}
              >
                {saving ? "progress_activity" : "save"}
              </span>

              {saving
                ? "Đang lưu..."
                : mode === "add"
                ? "Thêm lịch"
                : "Cập nhật"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormSelect({
  label,
  name,
  value,
  onChange,
  children,
  required = false,
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
        {label} {required && <span className="text-red-600">*</span>}
      </label>

      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl py-3 px-4 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none appearance-none transition"
        >
          {children}
        </select>

        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          expand_more
        </span>
      </div>
    </div>
  );
}

function Input({
  label,
  name,
  type = "text",
  value = "",
  onChange,
  required = false,
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
        {label} {required && <span className="text-red-600">*</span>}
      </label>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl py-3 px-4 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition"
      />
    </div>
  );
}