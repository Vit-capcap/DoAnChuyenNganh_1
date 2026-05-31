export default function TodaySchedule({ data = [] }) {
    // Lấy ngày hiện tại
    const getToday = () => {
      return new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
      });
    };
  
    return (
      <aside className="xl:col-span-1 space-y-4">
  
        <div className="bg-gray-200 p-4 rounded-xl shadow">
  
          {/* Header */}
          <div className="flex justify-between items-center">
            <h3 className="font-bold">Today</h3>
  
            <span className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm">
              {getToday()}
            </span>
          </div>
  
          {/* List schedule */}
          <div className="mt-4 space-y-3">
  
            {data && data.length > 0 ? (
              data.map((item, index) => (
                <div
                  key={index}
                  className={`border-l-4 pl-3 p-2 bg-gray-50 rounded ${item.border || "border-blue-500"}`}
                >
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.time}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">
                No schedule today
              </p>
            )}
  
          </div>
        </div>
  
      </aside>
    );
  }
