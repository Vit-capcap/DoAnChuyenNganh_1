export default function ScheduleTable({
  schedules = [],
  dayLabels = {},
  formatDateInput,
  formatTime,
  isToday,
  getTeacherAvatar,
  onEdit,
  onDelete,
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* HEADER */}
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              Danh sách lịch học
            </h3>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Hiển thị danh sách lịch học theo lớp, môn, giáo viên và phòng học.
            </p>
          </div>

          <p className="text-sm font-bold text-slate-500">
            Tổng số:{" "}
            <span className="font-black text-slate-900">
              {schedules.length}
            </span>{" "}
            lịch học
          </p>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] table-fixed text-left">
          <colgroup>
            <col className="w-[140px]" />
            <col className="w-[190px]" />
            <col className="w-[210px]" />
            <col className="w-[150px]" />
            <col className="w-[130px]" />
            <col className="w-[150px]" />
            <col className="w-[140px]" />
            <col className="w-[140px]" />
            <col className="w-[120px]" />
          </colgroup>

          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
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

          <tbody className="divide-y divide-slate-100 text-sm">
            {schedules.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-4 py-10 text-center">
                  <p className="text-base font-black text-slate-700">
                    Chưa có lịch học nào
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-400">
                    Hãy thêm lịch học mới hoặc thay đổi bộ lọc tìm kiếm.
                  </p>
                </td>
              </tr>
            ) : (
              schedules.map((item) => {
                const today = Boolean(isToday?.(item.day_of_week));
                const teacherAvatar = getTeacherAvatar?.(item);
                const teacherInitials = getTeacherInitials(item.teacher_name);

                return (
                  <tr
                    key={item.id_schedule}
                    className={`h-[68px] transition ${
                      today
                        ? "bg-blue-50/50 hover:bg-blue-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    {/* LỚP HỌC PHẦN */}
                    <td className="px-4 py-3">
                      <div className="truncate font-black text-slate-900">
                        {item.class_code || "-"}
                      </div>
                    </td>

                    {/* MÔN HỌC */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">
                        {item.subject_name || "-"}
                      </div>
                    </td>

                    {/* GIÁO VIÊN */}
                    <td className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {teacherAvatar ? (
                          <img
                            src={teacherAvatar}
                            alt={item.teacher_name || "Giáo viên"}
                            className="h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-600">
                            {teacherInitials}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="truncate font-bold text-slate-900">
                            {item.teacher_name || "-"}
                          </div>

                          <div className="mt-0.5 truncate text-xs font-semibold text-slate-400">
                            {item.teacher_code || "-"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* PHÒNG HỌC */}
                    <td className="px-4 py-3">
                      <div className="truncate font-bold text-slate-900">
                        {item.room_code || "-"}
                      </div>

                      <div className="mt-0.5 truncate text-xs font-semibold text-slate-400">
                        {item.room_name || "-"}
                      </div>
                    </td>

                    {/* THỨ */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex max-w-full rounded-full px-3 py-1 text-xs font-black ${
                          today
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <span className="truncate">
                          {dayLabels[item.day_of_week] || item.day_of_week}
                          {today ? " • Hôm nay" : ""}
                        </span>
                      </span>
                    </td>

                    {/* THỜI GIAN */}
                    <td className="px-4 py-3">
                      <div className="truncate font-bold text-slate-800">
                        {formatTime(item.start_time)} -{" "}
                        {formatTime(item.end_time)}
                      </div>
                    </td>

                    {/* NGÀY BẮT ĐẦU */}
                    <td className="px-4 py-3">
                      <div className="truncate font-semibold text-slate-500">
                        {formatDateInput(item.start_date) || "-"}
                      </div>
                    </td>

                    {/* NGÀY KẾT THÚC */}
                    <td className="px-4 py-3">
                      <div className="truncate font-semibold text-slate-500">
                        {formatDateInput(item.end_date) || "-"}
                      </div>
                    </td>

                    {/* THAO TÁC */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-blue-100 hover:bg-blue-50 hover:text-blue-700"
                          title="Sửa lịch học"
                        >
                          <span className="material-symbols-outlined text-[19px]">
                            edit
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                          title="Xóa lịch học"
                        >
                          <span className="material-symbols-outlined text-[19px]">
                            delete
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
    </section>
  );
}

function TableHead({ children, right = false }) {
  return (
    <th
      className={`whitespace-nowrap px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500 ${
        right ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}

function getTeacherInitials(name) {
  if (!name) return "GV";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}