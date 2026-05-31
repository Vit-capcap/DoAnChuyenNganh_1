export default function TeacherCard({
  teacher,
  getInitials,
  getStatusBadge,
  onViewDetail,
}) {
  const statusBadge = getStatusBadge(teacher);

  return (
    <div className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-100/70 transition overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-4">
            {teacher.avatar ? (
              <img
                src={teacher.avatar}
                alt={teacher.full_name}
                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-blue-50 shadow-sm"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl font-black shadow-sm">
                {getInitials(teacher.full_name)}
              </div>
            )}

            <div className="min-w-0">
              <h3 className="text-base font-black text-slate-900 truncate">
                {teacher.full_name || "Chưa có tên"}
              </h3>

              <p className="text-xs font-semibold text-slate-500 mt-1">
                {teacher.teacher_code || "Chưa có mã GV"}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold ${statusBadge.className}`}
          >
            <span className="material-symbols-outlined text-[15px]">
              {statusBadge.icon}
            </span>
            {statusBadge.text}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
            <span className="material-symbols-outlined text-[20px] text-blue-600">
              apartment
            </span>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">
                Khoa/Bộ môn
              </p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {teacher.department_name || "Chưa cập nhật"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
            <span className="material-symbols-outlined text-[20px] text-indigo-600">
              mail
            </span>

            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-400 uppercase">
                Email
              </p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5 truncate">
                {teacher.email || "Chưa cập nhật"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
            <span className="material-symbols-outlined text-[20px] text-emerald-600">
              call
            </span>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">
                Số điện thoại
              </p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">
                {teacher.phone || "Chưa cập nhật"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 px-5 py-4 bg-slate-50 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">
          ID: {teacher.id_teacher}
        </span>

        <button
          type="button"
          onClick={() => onViewDetail(teacher)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-sm"
        >
          Xem chi tiết
          <span className="material-symbols-outlined text-[16px]">
            arrow_forward
          </span>
        </button>
      </div>
    </div>
  );
}