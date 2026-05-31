export default function FaceDataModal({
  student,
  getInitials,
  onClose,
}) {
  if (!student) return null;

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
                Cập nhật dữ liệu khuôn mặt
              </h3>

              <p className="text-sm text-blue-100 mt-1">
                Tải ảnh rõ khuôn mặt để hệ thống nhận diện chính xác hơn.
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
          <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            {student.avatar ? (
              <img
                src={student.avatar}
                alt={student.full_name}
                className="w-14 h-14 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-black">
                {getInitials(student.full_name)}
              </div>
            )}

            <div>
              <div className="text-sm font-black text-slate-900">
                {student.full_name}
              </div>

              <div className="text-xs text-slate-500 mt-1">
                {student.student_code} • {student.class_name || "Chưa có lớp"}
              </div>
            </div>
          </div>

          <label className="border-2 border-dashed border-blue-200 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 bg-blue-50/50 hover:bg-blue-50 transition cursor-pointer text-center">
            <input type="file" accept="image/*" className="hidden" />

            <div className="w-14 h-14 rounded-2xl bg-white text-blue-600 flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-3xl">
                cloud_upload
              </span>
            </div>

            <div>
              <p className="text-sm font-black text-blue-700">
                Nhấn để tải ảnh khuôn mặt
              </p>

              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Hỗ trợ PNG, JPG. Nên dùng ảnh rõ mặt, đủ sáng, không che mặt và
                không đeo khẩu trang.
              </p>
            </div>
          </label>
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
            type="button"
            className="px-5 py-2.5 rounded-2xl text-sm font-bold bg-blue-600 text-white opacity-50 cursor-not-allowed"
          >
            Lưu dữ liệu
          </button>
        </div>
      </div>
    </div>
  );
}