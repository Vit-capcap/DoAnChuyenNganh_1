export default function TeacherDetailModal({
  teacher,
  getInitials,
  formatGender,
  getStatusBadge,
  onClose,
  onEdit,
}) {
  if (!teacher) return null;

  const statusBadge = getStatusBadge(teacher);

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
              <h3 className="text-xl font-black">Chi tiết giáo viên</h3>

              <p className="text-sm text-blue-100 mt-1">
                Thông tin hồ sơ, liên hệ và khoa/bộ môn phụ trách.
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

        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            {teacher.avatar ? (
              <img
                src={teacher.avatar}
                alt={teacher.full_name}
                className="w-24 h-24 rounded-3xl object-cover mb-3 ring-4 ring-blue-50"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-black mb-3">
                {getInitials(teacher.full_name)}
              </div>
            )}

            <h4 className="text-lg font-black text-slate-900">
              {teacher.full_name || "Chưa có tên"}
            </h4>

            <p className="text-sm font-semibold text-slate-500 mt-1">
              {teacher.teacher_code || "Chưa có mã giáo viên"}
            </p>

            <span
              className={`mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold ${statusBadge.className}`}
            >
              <span className="material-symbols-outlined text-[15px]">
                {statusBadge.icon}
              </span>
              {statusBadge.text}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <InfoRow
              label="Khoa/Bộ môn"
              value={teacher.department_name || "Chưa cập nhật"}
            />
            <InfoRow label="Email" value={teacher.email || "Chưa cập nhật"} />
            <InfoRow
              label="Số điện thoại"
              value={teacher.phone || "Chưa cập nhật"}
            />
            <InfoRow
              label="Giới tính"
              value={formatGender(teacher.gender)}
            />
            <InfoRow
              label="Ngày sinh"
              value={teacher.date_of_birth || "Chưa cập nhật"}
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl text-sm font-bold border border-slate-300 text-slate-700 hover:bg-white transition"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="px-5 py-2.5 rounded-2xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Chỉnh sửa
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
      <span className="text-slate-500 font-semibold">{label}</span>
      <span className="font-bold text-slate-900 text-right">{value}</span>
    </div>
  );
}