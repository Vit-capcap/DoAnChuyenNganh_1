// src/pages/Student/AttendanceHistoryPage.jsx
import { useMemo, useState } from "react";
import StudentLayout from "./components/StudentLayout";

export default function AttendanceHistoryPage() {

  /* =========================
        TABLE DATA
  ========================= */
  const attendanceData = [
    {
      id: 1,
      subject: "Neural Networks 101",
      teacher: "Prof. Alan Turing",
      date: "Oct 24, 2023",
      time: "08:55 AM",
      status: "Present",
      confidence: 98.5,
    },
    {
      id: 2,
      subject: "Data Structures",
      teacher: "Prof. Grace Hopper",
      date: "Oct 23, 2023",
      time: "10:15 AM",
      status: "Late",
      confidence: 95.2,
    },
    {
      id: 3,
      subject: "Machine Learning Lab",
      teacher: "Dr. Yann LeCun",
      date: "Oct 21, 2023",
      time: "--:--",
      status: "Absent",
      confidence: null,
    },
    {
      id: 4,
      subject: "Computer Vision",
      teacher: "Prof. Fei-Fei Li",
      date: "Oct 20, 2023",
      time: "08:45 AM",
      status: "Present",
      confidence: 99.1,
    },
  ];

  /* =========================
        FILTER STATES
  ========================= */
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  /* =========================
        FILTER LOGIC
  ========================= */
  const filteredData = useMemo(() => {
    return attendanceData.filter((item) => {
      const matchSearch = item.subject
        .toLowerCase()
        .includes(searchText.toLowerCase());
      const matchStatus =
        statusFilter === "All" ? true : item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [searchText, statusFilter]);

  /* =========================
        STATUS STYLE
  ========================= */
  const getStatusStyle = (status) => {
    switch (status) {
      case "Present": return "bg-blue-100 text-blue-700";
      case "Late":    return "bg-orange-100 text-orange-700";
      case "Absent":  return "bg-red-100 text-red-700";
      default:        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <StudentLayout
      title="Student Portal"
      subtitle="Attendance History"
      showSearch={true}
      searchValue={searchText}
      onSearchChange={(e) => setSearchText(e.target.value)}
      searchPlaceholder="Search subject..."
    >
      <div className="max-w-7xl mx-auto">

        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-blue-700">
              Attendance History
            </h1>
            <p className="text-gray-500 mt-2">
              Review your attendance records and AI confidence scores.
            </p>
          </div>

          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl transition shadow-lg shadow-blue-500/20">
            <span className="material-symbols-outlined">download</span>
            Export CSV
          </button>
        </div>

        {/* FILTERS */}
        <div className="bg-gray-200 rounded-3xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

            {/* SEARCH SUBJECT */}
            <div className="lg:col-span-2">
              <label className="text-sm font-semibold text-gray-600 mb-2 block">
                Search Subject
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  search
                </span>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="e.g. Advanced AI Models"
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-300 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            {/* DATE */}
            <div>
              <label className="text-sm font-semibold text-gray-600 mb-2 block">
                Date Range
              </label>
              <select className="w-full py-3 px-4 rounded-2xl border border-gray-300 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none transition">
                <option>Last 30 Days</option>
                <option>This Semester</option>
                <option>Last Semester</option>
                <option>Custom Range</option>
              </select>
            </div>

            {/* STATUS */}
            <div>
              <label className="text-sm font-semibold text-gray-600 mb-2 block">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full py-3 px-4 rounded-2xl border border-gray-300 focus:ring-4 focus:ring-blue-200 focus:border-blue-500 outline-none transition"
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-gray-200 rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">

              {/* TABLE HEAD */}
              <thead className="bg-blue-900/100 border-b border-gray-200">
                <tr>
                  {[
                    "Subject",
                    "Date",
                    "Check-in Time",
                    "Status",
                    "AI Confidence",
                  ].map((head, index) => (
                    <th
                      key={index}
                      className={`px-6 py-4 text-white font-semibold ${
                        head === "AI Confidence" ? "text-right" : "text-left"
                      }`}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* TABLE BODY */}
              <tbody className="divide-y divide-gray-100">
                {filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50 transition">

                    {/* SUBJECT */}
                    <td className="px-6 py-5">
                      <h3 className="font-semibold text-gray-800">{row.subject}</h3>
                      <p className="text-sm text-gray-500">{row.teacher}</p>
                    </td>

                    {/* DATE */}
                    <td className="px-6 py-5 text-gray-600">{row.date}</td>

                    {/* TIME */}
                    <td className="px-6 py-5 text-gray-600">{row.time}</td>

                    {/* STATUS */}
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusStyle(row.status)}`}
                      >
                        <span className="w-2 h-2 rounded-full bg-current"></span>
                        {row.status}
                      </span>
                    </td>

                    {/* CONFIDENCE */}
                    <td className="px-6 py-5">
                      {row.confidence !== null ? (
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600"
                              style={{ width: `${row.confidence}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold text-gray-700">
                            {row.confidence}%
                          </span>
                        </div>
                      ) : (
                        <div className="text-right text-gray-400">N/A</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* EMPTY */}
            {filteredData.length === 0 && (
              <div className="py-20 text-center text-gray-400">
                <span className="material-symbols-outlined text-6xl mb-4">search_off</span>
                <p className="text-lg">No attendance records found</p>
              </div>
            )}
          </div>

          {/* PAGINATION */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 border-t border-gray-200">
            <p className="text-gray-500">Showing {filteredData.length} entries</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  className={`w-10 h-10 rounded-xl transition font-semibold ${
                    page === 1
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  {page}
                </button>
              ))}
              <span className="px-2 text-gray-500">...</span>
              <button className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 transition">9</button>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}