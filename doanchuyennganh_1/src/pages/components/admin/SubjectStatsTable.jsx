export default function SubjectStatsTable({ subjects, getSubjectStatus }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-black text-slate-900">
          Thống kê theo môn học
        </h2>

        <p className="text-xs font-semibold text-slate-500 mt-1">
          Đánh giá tỷ lệ chuyên cần theo từng môn học.
        </p>
      </div>

      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 text-xs uppercase text-slate-500">
            <TableHead>Môn học</TableHead>
            <TableHead center>Tỷ lệ có mặt</TableHead>
            <TableHead right>Trạng thái</TableHead>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {subjects.length === 0 ? (
            <tr>
              <td colSpan="3" className="py-10 px-6 text-center text-sm text-slate-500">
                Không có dữ liệu môn học.
              </td>
            </tr>
          ) : (
            subjects.map((item) => {
              const status = getSubjectStatus(item.attendance_rate);

              return (
                <tr key={item.id_subject} className="hover:bg-blue-50/40 transition">
                  <td className="py-4 px-6">
                    <div className="text-sm font-black text-slate-900">
                      {item.subject_name}
                    </div>

                    <div className="text-xs font-semibold text-slate-500">
                      {item.subject_code}
                    </div>
                  </td>

                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 justify-center">
                      <span className="text-sm font-bold text-slate-700">
                        {Number(item.attendance_rate || 0).toFixed(1)}%
                      </span>

                      <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${status.barClass}`}
                          style={{
                            width: `${Math.min(
                              Number(item.attendance_rate || 0),
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-6 text-right">
                    <span
                      className={`inline-block px-3 py-1.5 rounded-xl text-xs font-bold ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function TableHead({ children, center = false, right = false }) {
  return (
    <th
      className={`py-3 px-6 font-black ${
        center ? "text-center" : right ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}