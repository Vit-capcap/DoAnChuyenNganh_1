export default function AbsentStudentsTable({ students, getInitials }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-black text-slate-900">
          Top 10 sinh viên vắng nhiều nhất
        </h2>

        <p className="text-xs font-semibold text-slate-500 mt-1">
          Danh sách sinh viên có số buổi vắng cao trong khoảng thời gian lọc.
        </p>
      </div>

      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 text-xs uppercase text-slate-500">
            <TableHead>Sinh viên</TableHead>
            <TableHead>Lớp</TableHead>
            <TableHead right>Số buổi vắng</TableHead>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {students.length === 0 ? (
            <tr>
              <td colSpan="3" className="py-10 px-6 text-center text-sm text-slate-500">
                Không có dữ liệu sinh viên vắng.
              </td>
            </tr>
          ) : (
            students.map((student) => (
              <tr key={student.id_student} className="hover:bg-blue-50/40 transition">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">
                      {getInitials(student.full_name)}
                    </div>

                    <div>
                      <div className="text-sm font-black text-slate-900">
                        {student.full_name}
                      </div>

                      <div className="text-xs font-semibold text-slate-500">
                        {student.student_code}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="py-4 px-6 text-sm font-semibold text-slate-500">
                  {student.class_name || "-"}
                </td>

                <td className="py-4 px-6 text-right text-sm font-black text-rose-600">
                  {student.absent_count}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function TableHead({ children, right = false }) {
  return (
    <th className={`py-3 px-6 font-black ${right ? "text-right" : ""}`}>
      {children}
    </th>
  );
}