export default function AccountModal({
  mode,
  formData,
  teachers,
  students,
  showPassword,
  saving,
  onChange,
  onTogglePassword,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="text-xl font-black">
                {mode === "add" ? "Thêm tài khoản mới" : "Chỉnh sửa tài khoản"}
              </h3>

              <p className="text-sm text-blue-100 mt-1">
                {mode === "add"
                  ? "Tạo tài khoản đăng nhập cho Admin, giáo viên hoặc sinh viên."
                  : "Cập nhật username, vai trò, trạng thái hoặc đổi mật khẩu."}
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
          <div className="p-6 flex flex-col gap-4">
            <FormSelect
              label="Vai trò"
              name="role"
              value={formData.role}
              onChange={onChange}
              required
            >
              <option value="STUDENT">Sinh viên</option>
              <option value="TEACHER">Giáo viên</option>
              <option value="ADMIN">Admin</option>
            </FormSelect>

            {formData.role === "TEACHER" && (
              <FormSelect
                label="Chọn giáo viên"
                name="teacher_id"
                value={formData.teacher_id}
                onChange={onChange}
                required
              >
                <option value="">Chọn giáo viên</option>

                {teachers.map((teacher) => (
                  <option key={teacher.id_teacher} value={teacher.id_teacher}>
                    {teacher.teacher_code} - {teacher.full_name}
                  </option>
                ))}

                {mode === "edit" && formData.teacher_id && (
                  <option value={formData.teacher_id}>
                    Giáo viên hiện tại
                  </option>
                )}
              </FormSelect>
            )}

            {formData.role === "STUDENT" && (
              <FormSelect
                label="Chọn sinh viên"
                name="student_id"
                value={formData.student_id}
                onChange={onChange}
                required
              >
                <option value="">Chọn sinh viên</option>

                {students.map((student) => (
                  <option key={student.id_student} value={student.id_student}>
                    {student.student_code} - {student.full_name}
                  </option>
                ))}

                {mode === "edit" && formData.student_id && (
                  <option value={formData.student_id}>
                    Sinh viên hiện tại
                  </option>
                )}
              </FormSelect>
            )}

            <Input
              label="Username"
              name="username"
              value={formData.username}
              onChange={onChange}
              placeholder="Nhập tên đăng nhập"
              required
            />

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                {mode === "add" ? "Mật khẩu" : "Mật khẩu mới"}
                {mode === "add" && <span className="text-red-600"> *</span>}
              </label>

              <div className="relative">
                <input
                  name="password"
                  value={formData.password}
                  onChange={onChange}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl py-3 pl-4 pr-12 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition"
                  placeholder={
                    mode === "add"
                      ? "Nhập mật khẩu"
                      : "Bỏ trống nếu không đổi mật khẩu"
                  }
                  type={showPassword ? "text" : "password"}
                />

                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
                  type="button"
                  onClick={onTogglePassword}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility" : "visibility_off"}
                  </span>
                </button>
              </div>

              <span className="text-xs text-slate-500 mt-2 block">
                Mật khẩu phải dài ít nhất 8 ký tự.
              </span>
            </div>

            <FormSelect
              label="Trạng thái"
              name="status"
              value={formData.status}
              onChange={onChange}
            >
              <option value="ACTIVE">Hoạt động</option>
              <option value="LOCKED">Bị khóa</option>
            </FormSelect>
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
                ? "Tạo tài khoản"
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
  value = "",
  onChange,
  placeholder = "",
  required = false,
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
        {label} {required && <span className="text-red-600">*</span>}
      </label>

      <input
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl py-3 px-4 text-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition"
        placeholder={placeholder}
        type="text"
      />
    </div>
  );
}