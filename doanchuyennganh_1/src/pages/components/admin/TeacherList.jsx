import TeacherCard from "./TeacherCard";

export default function TeacherList({
  teachers,
  totalTeachers,
  getInitials,
  getStatusBadge,
  onViewDetail,
}) {
  if (teachers.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-slate-400 text-3xl">
            person_off
          </span>
        </div>

        <h3 className="font-black text-slate-900">
          Không tìm thấy giáo viên phù hợp
        </h3>

        <p className="text-sm text-slate-500 mt-2">
          Hãy kiểm tra lại từ khóa tìm kiếm hoặc bộ lọc khoa/bộ môn.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">
          Hiển thị{" "}
          <span className="font-black text-slate-900">{teachers.length}</span>{" "}
          trong số{" "}
          <span className="font-black text-slate-900">{totalTeachers}</span>{" "}
          giáo viên
        </p>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Đang công tác
          <span className="w-2 h-2 rounded-full bg-amber-500 ml-3" />
          Khác
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {teachers.map((teacher) => (
          <TeacherCard
            key={teacher.id_teacher}
            teacher={teacher}
            getInitials={getInitials}
            getStatusBadge={getStatusBadge}
            onViewDetail={onViewDetail}
          />
        ))}
      </div>
    </div>
  );
}