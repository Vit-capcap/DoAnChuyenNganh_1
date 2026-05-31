export default function AttendanceTable({
  attendances,
  loading,
  pagination,
  page,
  setPage,
  attendanceLabels,
  statusClass,
  formatDate,
  formatTime,
  getStudentImage,
  onEdit,
  onDelete,
  onViewStudent,
}) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-3 bg-white">
        <div>
          <h3 className="text-xl font-black text-slate-900">
            Danh sách điểm danh
          </h3>

          <p className="text-xs font-semibold text-slate-500 mt-1">
            Theo dõi trạng thái điểm danh của sinh viên theo từng buổi học.
          </p>
        </div>

        <span className="text-sm font-bold text-slate-500">
          Tổng số: {pagination.total || 0} bản ghi
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <TableHead>Sinh viên</TableHead>
              <TableHead>Lớp</TableHead>
              <TableHead>Môn học</TableHead>
              <TableHead>Phòng</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>AI Accuracy</TableHead>
              <TableHead right>Hành động</TableHead>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td
                  colSpan="9"
                  className="px-6 py-12 text-center text-sm font-semibold text-slate-500"
                >
                  Đang tải dữ liệu điểm danh...
                </td>
              </tr>
            ) : attendances.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                      <span className="material-symbols-outlined text-3xl">
                        event_busy
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-700">
                      Không có dữ liệu điểm danh
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      Hãy thử đổi bộ lọc hoặc ngày điểm danh.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              attendances.map((item) => (
                <tr
                  key={item.id_attendance}
                  className="hover:bg-blue-50/40 transition group"
                >
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => onViewStudent(item)}
                      className="flex items-center gap-3 text-left group/student"
                    >
                      <img
                        src={getStudentImage(item)}
                        alt={item.full_name || "Sinh viên"}
                        className="w-11 h-11 rounded-2xl object-cover ring-2 ring-white shadow-sm"
                      />

                      <div>
                        <p className="text-sm font-black text-slate-900 group-hover/student:text-blue-600 transition">
                          {item.full_name || "-"}
                        </p>

                        <p className="text-xs font-semibold text-slate-500">
                          {item.student_code || "-"}
                        </p>
                      </div>
                    </button>
                  </td>

                  <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                    {item.class_name || "-"}
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-900">
                      {item.subject_name || "-"}
                    </div>

                    <div className="text-xs text-slate-500">
                      {item.class_code || "-"}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-500">
                    {item.room_code || "-"}
                    {item.room_name ? ` - ${item.room_name}` : ""}
                  </td>

                  <td className="px-6 py-4 text-sm font-semibold text-slate-500">
                    {formatDate(item.session_date)}
                  </td>

                  <td className="px-6 py-4 text-sm font-mono text-slate-700">
                    {formatTime(item.check_in_time)}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-3 py-1.5 rounded-xl text-xs font-bold ${
                        statusClass[item.status] ||
                        "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {attendanceLabels[item.status] || item.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {item.confidence_score !== null &&
                    item.confidence_score !== undefined ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-2 rounded-full bg-blue-600"
                            style={{
                              width: `${Math.min(
                                Number(item.confidence_score),
                                100
                              )}%`,
                            }}
                          />
                        </div>

                        <span className="text-xs font-bold text-slate-600">
                          {Number(item.confidence_score).toFixed(1)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm italic text-slate-400">N/A</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="w-10 h-10 flex items-center justify-center rounded-2xl border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition"
                        title="Sửa điểm danh"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          edit
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onViewStudent(item)}
                        className="w-10 h-10 flex items-center justify-center rounded-2xl border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition"
                        title="Xem sinh viên"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          visibility
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="w-10 h-10 flex items-center justify-center rounded-2xl border border-red-100 text-red-500 hover:bg-red-50 transition"
                        title="Xóa điểm danh"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          delete
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50">
        <span className="text-sm font-semibold text-slate-500">
          Hiển thị {attendances.length} trong tổng số {pagination.total || 0}{" "}
          bản ghi
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            className="w-10 h-10 rounded-2xl border border-slate-200 bg-white text-slate-500 disabled:text-slate-300 disabled:cursor-not-allowed flex items-center justify-center hover:bg-slate-100 transition"
          >
            <span className="material-symbols-outlined text-[18px]">
              chevron_left
            </span>
          </button>

          <span className="px-4 py-2 rounded-2xl bg-blue-600 text-white text-sm font-bold">
            {page} / {pagination.totalPages || 1}
          </span>

          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() =>
              setPage((prev) => Math.min(prev + 1, pagination.totalPages || 1))
            }
            className="w-10 h-10 rounded-2xl border border-slate-200 bg-white text-slate-500 disabled:text-slate-300 disabled:cursor-not-allowed flex items-center justify-center hover:bg-slate-100 transition"
          >
            <span className="material-symbols-outlined text-[18px]">
              chevron_right
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function TableHead({ children, right = false }) {
  return (
    <th
      className={`px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wide whitespace-nowrap ${
        right ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}