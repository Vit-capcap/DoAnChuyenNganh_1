export default function ManualAttendanceModal({
  formData,
  sessions,
  students,
  studentSearch,
  onStudentSearch,
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
              <h3 className="text-xl font-black">Điểm danh thủ công</h3>

              <p className="text-sm text-blue-100 mt-1">
                Chọn buổi học, sinh viên và trạng thái điểm danh.
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
          <div className="p-6 space-y-5">
            <FormSelect
              label="Buổi học"
              name="id_session"
              value={formData.id_session}
              onChange={onChange}
              required
            >
              <option value="">Chọn buổi học</option>
              {sessions.map((item) => (
                <option key={item.id_session} value={item.id_session}>
                  {formatDate(item.session_date)} - {item.class_code} -{" "}
                  {item.subject_name} - {item.room_code}
                </option>
              ))}
            </FormSelect>

            <Input
              label="Tìm sinh viên"
              value={studentSearch}
              onChange={(e) => onStudentSearch(e.target.value)}
              placeholder="Nhập mã sinh viên hoặc họ tên..."
            />

            <FormSelect
              label="Sinh viên"
              name="id_student"
              value={formData.id_student}
              onChange={onChange}
              required
            >
              <option value="">Chọn sinh viên</option>
              {students.map((item) => (
                <option key={item.id_student} value={item.id_student}>
                  {item.student_code} - {item.full_name} - {item.class_name}
                </option>
              ))}
            </FormSelect>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect
                label="Trạng thái"
                name="status"
                value={formData.status}
                onChange={onChange}
                required
              >
                <option value="PRESENT">Có mặt</option>
                <option value="LATE">Đi trễ</option>
                <option value="ABSENT">Vắng mặt</option>
              </FormSelect>

              <Input
                label="Thời gian check-in"
                name="check_in_time"
                type="datetime-local"
                value={formData.check_in_time}
                onChange={onChange}
              />

              <Input
                label="Độ chính xác AI"
                name="confidence_score"
                type="number"
                value={formData.confidence_score}
                onChange={onChange}
                placeholder="Ví dụ: 98.5"
              />

              <Input
                label="Ghi chú"
                name="note"
                value={formData.note}
                onChange={onChange}
                placeholder="Nhập ghi chú nếu có"
              />
            </div>
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
              className="px-5 py-2.5 rounded-2xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Lưu điểm danh
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("vi-VN");
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
  placeholder = "",
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
        {label}
      </label>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl py-3 px-4 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition"
      />
    </div>
  );
}