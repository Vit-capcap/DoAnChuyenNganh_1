export default function ScheduleTable({
  schedules,
  dayLabels,
  formatDateInput,
  formatTime,
  isToday,
  getTeacherAvatar,
  onEdit,
  onDelete,
}) {
  return (
    <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-200">
      <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-3 bg-white">
        <div>
          <h3 className="text-xl font-black text-slate-900">
            Danh sách lịch học
          </h3>

          <p className="text-xs font-semibold text-slate-500 mt-1">
            Hiển thị danh sách lịch học theo dạng bảng.
          </p>
        </div>

        <span className="text-sm font-bold text-slate-500">
          Tổng số: {schedules.length} lịch học
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <TableHead>Lớp học phần</TableHead>
              <TableHead>Môn học</TableHead>
              <TableHead>Giáo viên</TableHead>
              <TableHead>Phòng học</TableHead>
              <TableHead>Thứ</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Ngày bắt đầu</TableHead>
              <TableHead>Ngày kết thúc</TableHead>
              <TableHead right>Thao tác</TableHead>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {schedules.map((item) => {
              const today = isToday(item.day_of_week);

              return (
                <tr
                  key={item.id_schedule}
                  className={`hover:bg-blue-50/40 transition h-[72px] ${
                    today ? "bg-blue-50/60 border-l-4 border-blue-600" : ""
                  }`}
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-slate-900">
                      {item.class_code || "-"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-900 font-bold">
                      {item.subject_name || "-"}
                    </div>

                    <div className="text-xs text-slate-500">
                      {item.subject_code || "-"} - {item.credits || 0} tín chỉ
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={getTeacherAvatar(item)}
                        alt={item.teacher_name || "Giáo viên"}
                        className="w-10 h-10 rounded-2xl object-cover ring-2 ring-white shadow-sm"
                      />

                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {item.teacher_name || "-"}
                        </div>

                        <div className="text-xs text-slate-500">
                          {item.teacher_code || "-"}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
                      <span className="material-symbols-outlined text-[14px]">
                        meeting_room
                      </span>
                      {item.room_code || "-"}
                      {item.room_name ? ` - ${item.room_name}` : ""}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${
                        today
                          ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {dayLabels[item.day_of_week] || item.day_of_week}
                      {today ? " • Hôm nay" : ""}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-700">
                      {formatTime(item.start_time)} - {formatTime(item.end_time)}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-500">
                    {formatDateInput(item.start_date) || "-"}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-500">
                    {formatDateInput(item.end_date) || "-"}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="w-10 h-10 flex items-center justify-center rounded-2xl border border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition"
                        title="Sửa lịch học"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          edit
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="w-10 h-10 flex items-center justify-center rounded-2xl border border-red-100 text-red-500 hover:bg-red-50 transition"
                        title="Xóa lịch học"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          delete
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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