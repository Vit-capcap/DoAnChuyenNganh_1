// src/pages/Student/Statistics.jsx
import StudentLayout from "./components/StudentLayout";

export default function Statistics() {
  return (
    <StudentLayout
      title="Student Portal"
      subtitle="Attendance Statistics"
      showSearch={false}
    >
      <h2 className="text-3xl font-bold mb-2">Attendance Analytics</h2>
      <p className="text-gray-500 mb-6">
        Biometric attendance records and trends
      </p>

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">

        <div className="p-5 bg-white rounded-xl shadow">
          <h3 className="font-bold">Improving</h3>
          <p className="text-gray-500">Software Engineering</p>
          <p className="text-blue-600 text-2xl font-bold">+15%</p>
        </div>

        <div className="p-5 bg-white rounded-xl shadow">
          <h3 className="font-bold">Needs Attention</h3>
          <p className="text-gray-500">Calculus III</p>
          <p className="text-red-500 text-2xl font-bold">-8%</p>
        </div>

        <div className="p-5 bg-blue-600 text-white rounded-xl shadow">
          <h3>Total Biometric Scans</h3>
          <p className="text-4xl font-bold">142</p>
        </div>
      </div>

      {/* Attendance */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Pie */}
        <div className="bg-white p-5 rounded-xl shadow">
          <h3 className="font-bold mb-4">Overall Breakdown</h3>

          <div
            className="w-40 h-40 mx-auto rounded-full"
            style={{
              background: "conic-gradient(#2563eb 0% 75%, #e5e7eb 75% 85%, #ef4444 85% 100%)"
            }}
          />

          <p className="text-center mt-3 font-bold">75% Present</p>
        </div>

        {/* Bars */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow">
          <h3 className="font-bold mb-4">Subject Attendance</h3>

          {[
            ["Software Engineering", 92],
            ["Database", 85],
            ["Machine Learning", 78],
            ["Calculus III", 65],
            ["Literature", 95],
          ].map(([name, val], i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between text-sm">
                <span>{name}</span>
                <span>{val}%</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded">
                <div
                  className="h-2 bg-blue-500 rounded"
                  style={{ width: `${val}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </StudentLayout>
  );
}