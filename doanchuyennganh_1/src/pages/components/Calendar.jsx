// import React from "react";

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

// ================= DATA =================
const scheduleData = {
  Mon: [
    {
      start: 1,
      duration: 2,
      title: "Data Structures",
      color: "bg-blue-100",
    },
  ],
  Tue: [
    {
      start: 3,
      duration: 1,
      title: "Algorithms",
      color: "bg-purple-100",
    },
  ],
  Wed: [
    {
      start: 2,
      duration: 3,
      title: "Machine Learning",
      color: "bg-blue-600 text-white",
    },
    {
      start: 6,
      duration: 2,
      title: "CV Lab",
      color: "bg-purple-100",
    },
  ],
  Fri: [
    {
      start: 6,
      duration: 4,
      title: "Ethics in AI",
      color: "bg-gray-200",
    },
  ],
};

// ================= HELPERS =================
const getToday = () =>
  new Date().toLocaleDateString("en-US", { weekday: "short" });

const getClass = (day, periodIndex) => {
  return scheduleData[day]?.find(
    (item) => item.start === periodIndex
  );
};

const SLOT_HEIGHT = 44;

export default function Calendar() {
  const today = getToday();

  return (
    <section className="bg-gray-200 p-3 rounded-xl shadow overflow-x-auto">

      <div className="min-w-[900px]">

        {/* ================= HEADER ================= */}
        <div className="grid grid-cols-8 text-center font-semibold border-b border-gray-300 pb-2">
          <div>Period</div>

          {days.map((d) => (
            <div
              key={d}
              className={d === today ? "text-blue-600 font-bold" : ""}
            >
              {d}
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
              className={`relative ${
                day === today ? "bg-blue-50" : ""
              }`}
            >

              {periods.map((_, index) => {
                const period = index + 1;
                const item = getClass(day, period);

                return (
                  <div
                    key={period}
                    className="h-12 border-b border-gray-300 relative"
                  >
                    {/* CLASS BLOCK */}
                    {item && (
                      <div
                        className={`absolute left-1 right-1 top-1 rounded p-2 text-xs shadow ${item.color} border border-blue-300`}
                        style={{
                          height: `${item.duration * SLOT_HEIGHT}px`,
                          zIndex: 20,
                        }}
                      >
                        <div className="font-semibold">
                          {item.title}
                        </div>
                        <div className="opacity-80">
                          Tiết {item.start} - {item.duration} tiết
                        </div>
                      </div>
                    )}
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