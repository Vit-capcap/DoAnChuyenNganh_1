// src/pages/Student/RealtimeAttendancePage.jsx
import StudentLayout from "./components/StudentLayout";

export default function RealtimeAttendancePage() {
  return (
    <StudentLayout
      title="Realtime Attendance"
      subtitle="AI-powered biometric classroom monitoring"
      showSearch={false}
    >
      {/* Header Info */}
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-blue-600">location_on</span>
            <h3 className="text-2xl font-bold">Room 402 - Advanced AI</h3>
          </div>
          <p className="text-gray-500">
            Prof. Alan Turing | CS-401 | 10:00 AM - 11:30 AM
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white rounded-full px-5 py-3 border border-gray-200 shadow-sm">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
          <span className="font-semibold">Camera Active</span>
          <span className="material-symbols-outlined text-gray-500">videocam</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Camera Feed */}
        <div className="xl:col-span-2 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-lg">
          {/* Top */}
          <div className="flex items-center justify-between px-5 py-4 bg-black/80 backdrop-blur text-white">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sky-400">memory</span>
              <span className="uppercase tracking-widest text-sm font-bold text-sky-400">Bio Scan Active</span>
            </div>
            <span className="text-sm text-white/70">Feed: CAM-04-NORTH</span>
          </div>

          {/* Camera */}
          <div className="relative h-[520px] overflow-hidden bg-black">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1600&auto=format&fit=crop"
              alt=""
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-black/20"></div>

            {/* Scan box */}
            <div className="absolute top-[28%] left-[42%] w-32 h-40 border-2 border-sky-400 rounded-md shadow-[0_0_20px_rgba(56,189,248,0.7)]">
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur px-3 py-1 rounded-xl text-white text-xs whitespace-nowrap border border-sky-400/30">
                Emma Carter (98%)
              </div>
            </div>

            {/* Scan line */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-sky-400 shadow-[0_0_20px_#38BDF8] animate-pulse"></div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-blue-600 animate-ping"></span>
              <span className="text-sm text-gray-500">Processing 24 faces/sec</span>
            </div>
            <span className="text-sm text-gray-400">Engine: Tensor-V4</span>
          </div>
        </div>

        {/* Right Side */}
        <div className="space-y-6">
          {/* Progress */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg">
            <h4 className="uppercase tracking-widest text-sm text-gray-500 mb-4">Session Progress</h4>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-6xl font-black text-blue-600">42</span>
              <span className="text-gray-500 mb-2">/ 50 Present</span>
            </div>
            <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full w-[84%] bg-blue-600 rounded-full"></div>
            </div>
            <div className="flex justify-between mt-3 text-sm text-gray-400">
              <span>84% Attendance Rate</span>
              <span>8 Missing</span>
            </div>
          </div>

          {/* Detection List */}
          <div className="rounded-3xl border border-gray-200 bg-white shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h4 className="font-bold">Recent Detections</h4>
              <button className="text-blue-600 text-sm hover:underline">View All</button>
            </div>

            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {[
                ["Emma Carter", "98%", "Just now"],
                ["Liam Johnson", "95%", "2 mins ago"],
                ["Aisha Patel", "Late", "15 mins ago"],
              ].map(([name, status, time], index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 transition"
                >
                  <img
                    src={`https://i.pravatar.cc/100?img=${index + 10}`}
                    alt=""
                    className="w-12 h-12 rounded-2xl object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{name}</p>
                    <p className="text-xs text-gray-400">CS-2024-0{index + 89}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-600 font-bold">
                      {status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Missing */}
      <div className="mt-8">
        <h3 className="text-2xl font-bold mb-5">Awaiting Arrival (8)</h3>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {["S. Davis", "M. Chen", "J. Smith", "L. Brown"].map((student, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-2 py-2 min-w-fit opacity-70"
            >
              <img
                src={`https://i.pravatar.cc/100?img=${index + 30}`}
                alt=""
                className="w-10 h-10 rounded-full grayscale"
              />
              <span className="pr-3 text-sm">{student}</span>
            </div>
          ))}
          <button className="rounded-full border border-dashed border-gray-300 px-5 text-gray-500 hover:bg-gray-100 transition">
            +5 More
          </button>
        </div>
      </div>
    </StudentLayout>
  );
}