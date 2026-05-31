export default function BarChart() {
  const data = [
    { name: "K.10", height: "90%" },
    { name: "K.11", height: "85%" },
    { name: "K.12", height: "95%" },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border">
      <div className="mb-6 pb-3 border-b">
        <h3 className="text-xl font-semibold">Tham gia theo khối</h3>
      </div>

      <div className="flex items-end justify-around pt-4 gap-3">
        {data.map((bar, index) => (
          <div key={index} className="w-full flex flex-col items-center gap-2">
            <div className="w-full bg-blue-100 rounded-t h-[180px] relative">
              <div
                className="absolute bottom-0 w-full bg-blue-600 rounded-t"
                style={{ height: bar.height }}
              />
            </div>
            <span className="text-xs text-gray-500">{bar.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}