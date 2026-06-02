// src/pages/components/Calendar.jsx

// ================= PERIODS =================
const periods = [
  "Tiết 1",
  "Tiết 2",
  "Tiết 3",
  "Tiết 4",
  "Tiết 5",
  "Tiết 6",
  "Tiết 7",
  "Tiết 8",
  "Tiết 9",
  "Tiết 10",
];

// ================= DAYS =================
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Map từ day_of_week database (English) sang tên cột
const dayMap = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

// Tên tiếng Việt cho các thứ
const dayViName = {
  Mon: "Thứ 2",
  Tue: "Thứ 3",
  Wed: "Thứ 4",
  Thu: "Thứ 5",
  Fri: "Thứ 6",
  Sat: "Thứ 7",
  Sun: "CN",
};

// Màu theo index
const colorList = [
  "bg-blue-100 text-blue-800 border-blue-300",
  "bg-purple-100 text-purple-800 border-purple-300",
  "bg-emerald-100 text-emerald-800 border-emerald-300",
  "bg-orange-100 text-orange-800 border-orange-300",
  "bg-cyan-100 text-cyan-800 border-cyan-300",
  "bg-pink-100 text-pink-800 border-pink-300",
  "bg-yellow-100 text-yellow-800 border-yellow-300",
  "bg-indigo-100 text-indigo-800 border-indigo-300",
];

// ================= HELPERS =================
const getToday = () =>
  new Date().toLocaleDateString("en-US", { weekday: "short" });

/**
 * Chuyển start_time (HH:MM:SS) sang period number (1-10)
 * Tiết 1 bắt đầu 7:00, mỗi tiết + nghỉ = 60 phút
 */
function timeToPeriod(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  const totalMin = h * 60 + m;
  const startMin = 7 * 60; // 7:00
  const periodLength = 60;
  const period = Math.round((totalMin - startMin) / periodLength) + 1;
  if (period < 1) return 1;
  if (period > 10) return 10;
  return period;
}

/**
 * Tính số tiết từ start_time đến end_time
 */
function calcDuration(startTime, endTime) {
  if (!startTime || !endTime) return 1;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const diffMin = eh * 60 + em - (sh * 60 + sm);
  return Math.max(1, Math.round(diffMin / 60));
}

const SLOT_HEIGHT = 44;

/**
 * @param {Array}    scheduleRows     - mảng lịch học từ API
 * @param {Function} onSelectSubject  - callback khi click vào môn học (truyền row gốc)
 */
export default function Calendar({ scheduleRows = [], onSelectSubject }) {
  const today = getToday();

  // Xây dựng scheduleData từ API rows
  // Mỗi slot lưu thêm rawRow để truyền vào callback
  const scheduleData = {};
  const colorMap = {};
  let colorIdx = 0;

  scheduleRows.forEach((row) => {
    const dayKey = dayMap[row.day_of_week];
    if (!dayKey) return;

    const start = timeToPeriod(row.start_time);
    const duration = calcDuration(row.start_time, row.end_time);
    const subjectCode = row.subject_code || row.id_subject;

    if (!colorMap[subjectCode]) {
      colorMap[subjectCode] = colorList[colorIdx % colorList.length];
      colorIdx++;
    }

    if (!scheduleData[dayKey]) scheduleData[dayKey] = [];

    scheduleData[dayKey].push({
      start,
      duration,
      title: row.subject_name || "—",
      subjectCode: row.subject_code,
      classCode: row.class_code,
      teacher: row.teacher_name,
      room: row.room_name || row.room_code || "—",
      startTime: row.start_time?.slice(0, 5),
      endTime: row.end_time?.slice(0, 5),
      color: colorMap[subjectCode],
      rawRow: row, // giữ nguyên row gốc để mở modal
    });
  });

  // Trả về tất cả môn trùng cùng slot (khắc phục mất môn)
  const getClasses = (day, periodIndex) => {
    return scheduleData[day]?.filter((item) => item.start === periodIndex) || [];
  };

  // Nếu không có lịch
  const hasData = scheduleRows.length > 0;

  if (!hasData) {
    return (
      <section className="bg-gray-200 p-6 rounded-xl shadow text-center">
        <span className="material-symbols-outlined text-5xl text-gray-400">event_busy</span>
        <p className="mt-3 text-gray-500 font-medium">Bạn chưa có lịch học nào.</p>
      </section>
    );
  }

  return (
    <section className="bg-gray-200 p-3 rounded-xl shadow overflow-x-auto">
      <div className="min-w-[900px]">

        {/* ================= HEADER ================= */}
        <div className="grid grid-cols-8 text-center font-semibold border-b border-gray-300 pb-2">
          <div>Tiết</div>
          {days.map((d) => (
            <div key={d} className={d === today ? "text-blue-600 font-bold" : ""}>
              <div>{d}</div>
              <div className="text-xs text-gray-400 font-normal">{dayViName[d]}</div>
            </div>
          ))}
        </div>

        {/* ================= BODY ================= */}
        <div className="grid grid-cols-8">

          {/* PERIOD COLUMN */}
          <div className="text-xs text-gray-500">
            {periods.map((p) => (
              <div
                key={p}
                className="h-12 flex items-center justify-center border-b border-gray-300"
              >
                {p}
              </div>
            ))}
          </div>

          {/* DAYS */}
          {days.map((day) => (
            <div
              key={day}
              className={`relative ${day === today ? "bg-blue-50" : ""}`}
            >
              {periods.map((_, index) => {
                const period = index + 1;
                const items = getClasses(day, period);

                return (
                  <div
                    key={period}
                    className="h-12 border-b border-gray-300 relative"
                  >
                    {/* Render tất cả môn trong cùng slot */}
                    {items.map((item, itemIdx) => {
                      // Nếu nhiều môn trùng slot: chia nhỏ height, xếp nọng dọc
                      const isMulti = items.length > 1;
                      const blockHeight = isMulti
                        ? Math.floor((item.duration * SLOT_HEIGHT) / items.length)
                        : item.duration * SLOT_HEIGHT;
                      const topOffset = isMulti ? itemIdx * blockHeight : 0;

                      return (
                        <div
                          key={itemIdx}
                          title={`${item.title}\n${item.teacher}\nPhòng: ${item.room}\n${item.startTime} - ${item.endTime}\nBấm để xem chi tiết`}
                          className={`absolute left-1 right-1 rounded p-1 text-xs shadow border cursor-pointer hover:shadow-md hover:brightness-95 transition ${item.color}`}
                          style={{
                            top: `${topOffset + 4}px`,
                            height: `${blockHeight - 2}px`,
                            zIndex: 20 + itemIdx,
                          }}
                          onClick={() => {
                            if (onSelectSubject) onSelectSubject(item.rawRow);
                          }}
                        >
                          <div className="font-semibold leading-tight truncate">
                            {item.title}
                          </div>
                          {!isMulti && (
                            <>
                              <div className="opacity-80 truncate text-[10px]">
                                {item.startTime} - {item.endTime}
                              </div>
                              <div className="opacity-70 truncate text-[10px]">
                                {item.room}
                              </div>
                            </>
                          )}
                          {isMulti && (
                            <div className="opacity-75 truncate text-[9px]">
                              {item.startTime} • {item.room}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}