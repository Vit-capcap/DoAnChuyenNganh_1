import { useNavigate } from "react-router-dom";
export default function StudentTable({
  students,
  totalStudents,
  getInitials,
  getFaceBadge,
  getAccountBadge,
  onOpenFaceModal,
}) {

  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-200">
      <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Danh sách sinh viên
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Hiển thị {students.length} trong tổng số {totalStudents} sinh viên.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Đã cập nhật
          <span className="w-2 h-2 rounded-full bg-rose-500 ml-3" />
          Chưa cập nhật
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="py-4 px-5 text-xs font-black text-slate-500 uppercase">
                Sinh viên
              </th>
              <th className="py-4 px-5 text-xs font-black text-slate-500 uppercase">
                Mã SV
              </th>
              <th className="py-4 px-5 text-xs font-black text-slate-500 uppercase">
                Lớp / Khoa
              </th>
              <th className="py-4 px-5 text-xs font-black text-slate-500 uppercase">
                Liên hệ
              </th>
              <th className="py-4 px-5 text-xs font-black text-slate-500 uppercase">
                Khuôn mặt
              </th>
              <th className="py-4 px-5 text-xs font-black text-slate-500 uppercase">
                Tài khoản
              </th>
              <th className="py-4 px-5 text-xs font-black text-slate-500 uppercase text-right">
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {students.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-14 px-5 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                      <span className="material-symbols-outlined text-3xl">
                        search_off
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-700">
                      Không tìm thấy sinh viên phù hợp
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      Hãy thử đổi từ khóa hoặc xóa bộ lọc.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const faceBadge = getFaceBadge(student);
                const accountBadge = getAccountBadge(student);

                const hasFace = Boolean(
                  student.face_updated || student.face_status === "UPDATED"
                );

                return (
                  <tr
                    key={student.id_student}
                    className="hover:bg-blue-50/40 transition"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3 min-w-[220px]">
 <button
  type="button"
  onClick={() => navigate(`/studentdetail/${student.id_student}`)}
  className="flex items-center gap-3 min-w-[220px] text-left group/student"
>
  {student.avatar ? (
    <img
      src={student.avatar}
      alt={student.full_name}
      className="w-11 h-11 rounded-2xl object-cover ring-2 ring-white shadow-sm group-hover/student:ring-blue-200 transition"
    />
  ) : (
    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-black shadow-sm">
      {getInitials(student.full_name)}
    </div>
  )}

  <div>
    <div className="text-sm font-bold text-slate-900 group-hover/student:text-blue-600 transition">
      {student.full_name || "Chưa có tên"}
    </div>

    <div className="text-xs text-slate-500 mt-0.5">
      ID: {student.id_student}
    </div>
  </div>
</button>
                        {/* {student.avatar ? (
                          <img
                            src={student.avatar}
                            alt={student.full_name}
                            className="w-11 h-11 rounded-2xl object-cover ring-2 ring-white shadow-sm"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-black shadow-sm">
                            {getInitials(student.full_name)}
                          </div>
                        )}

                        <div>
                          <div className="text-sm font-bold text-slate-900">
                            {student.full_name || "Chưa có tên"}
                          </div>

                          <div className="text-xs text-slate-500 mt-0.5">
                            ID: {student.id_student}
                          </div> */}
                        {/* </div> */}
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                        {student.student_code || "Chưa có"}
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <div className="text-sm font-bold text-slate-800">
                        {student.class_name || "Chưa có lớp"}
                      </div>

                      <div className="text-xs text-slate-500 mt-1">
                        {student.faculty || "Chưa có khoa"}
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <div className="text-sm text-slate-700">
                        {student.email || "Chưa có email"}
                      </div>

                      <div className="text-xs text-slate-500 mt-1">
                        {student.phone || "Chưa có số điện thoại"}
                      </div>
                    </td>

                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${faceBadge.className}`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {faceBadge.icon}
                        </span>
                        {faceBadge.text}
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${accountBadge.className}`}
                      >
                        {accountBadge.text}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenFaceModal(student)}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                            hasFace
                              ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {hasFace ? "visibility" : "upload"}
                          </span>
                          {hasFace ? "Xem" : "Tải ảnh"}
                        </button>

                        <button
                          type="button"
                          className="w-9 h-9 inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-white hover:text-blue-600 transition"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            more_vert
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 px-5 py-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <span className="text-xs font-semibold text-slate-500">
          Hiển thị {students.length} / {totalStudents} sinh viên
        </span>
      </div>
    </div>
  );
}