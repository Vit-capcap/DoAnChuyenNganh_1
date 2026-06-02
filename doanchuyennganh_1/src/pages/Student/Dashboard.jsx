// src/pages/Student/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "../components/StatCard";
import Bar from "../components/Bar";
import ClassItem from "../components/ClassItem";
import QuickButton from "../components/QuickButton";
import TableRow from "../components/TableRow";
import { getMyStudentProfile } from "../../api/studentApi";
import StudentLayout from "./components/StudentLayout";

export default function Dashboard() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("Bạn");

  useEffect(() => {
    const userRaw = localStorage.getItem("user");
    if (!userRaw) return; // StudentLayout đã xử lý redirect

    let user;
    try {
      user = JSON.parse(userRaw);
    } catch {
      return;
    }

    // Set tạm từ localStorage trước
    setUserName(user.full_name || user.username || "Bạn");

    // Gọi API profile để lấy full_name thật
    if (user.student_id) {
      getMyStudentProfile(user.student_id)
        .then((res) => {
          if (res && res.success && res.data) {
            const p = res.data;
            setUserName(p.full_name || user.username || "Bạn");
            // Cập nhật localStorage để lần sau không cần gọi API lại
            const updated = { ...user, full_name: p.full_name, avatar: p.avatar };
            localStorage.setItem("user", JSON.stringify(updated));
          }
        })
        .catch((err) => {
          console.warn("Dashboard: không thể tải profile:", err.message);
        });
    }
  }, []);

  const handleNotUnimplemented = (label) => {
    alert(`Chức năng "${label}" đang được phát triển.`);
  };

  return (
    <StudentLayout
      title="Student Portal"
      subtitle="Dashboard Overview"
      showSearch={true}
      searchDisabled={true}
    >
      {/* Welcome */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold">
            Chào mừng, {userName}!
          </h1>
          <p className="text-gray-500 mt-2">
            Đây là tổng quan điểm danh học kỳ này của bạn.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white border border-gray-200 px-5 py-3 rounded-full shadow-sm">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-semibold">
            AI Face Recognition:
            <span className="text-green-600 ml-1">Active</span>
          </span>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

        {/* Attendance Circle */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col items-center justify-center">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#E5E7EB" strokeWidth="3.5"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#2563EB" strokeWidth="3.5"
                strokeDasharray="92, 100" strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-blue-600">92%</span>
            </div>
          </div>
          <p className="mt-4 text-green-600 font-medium">+2% from last week</p>
        </div>

        <StatCard icon="check_circle" value="48" label="Present" color="green" />
        <StatCard icon="cancel" value="3" label="Absent" color="red" />
        <StatCard icon="schedule" value="1" label="Late" color="yellow" />
      </div>

      {/* CHART + ACTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Weekly Attendance Trends</h2>
            <button
              type="button"
              onClick={() => navigate("/student/attendance")}
              className="text-blue-600 font-semibold hover:underline"
            >
              This Week
            </button>
          </div>
          <div className="h-[300px] flex items-end justify-around gap-4">
            <Bar value="80%" day="Mon" />
            <Bar value="95%" day="Tue" />
            <Bar value="60%" day="Wed" />
            <Bar value="100%" day="Thu" />
            <Bar value="85%" day="Fri" />
          </div>
        </div>

        {/* Quick Action */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold mb-5">Quick Actions</h2>
            <div className="space-y-3">
              <div onClick={() => handleNotUnimplemented("Register Face")} className="cursor-pointer">
                <QuickButton icon="face_retouching_natural" title="Register Face" primary />
              </div>
              <div onClick={() => navigate("/student/schedule")} className="cursor-pointer">
                <QuickButton icon="calendar_month" title="View Schedule" />
              </div>
              <div onClick={() => handleNotUnimplemented("Download Report")} className="cursor-pointer">
                <QuickButton icon="download" title="Download Report" />
              </div>
            </div>
          </div>

          {/* Upcoming */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold mb-5">Upcoming Classes</h2>
            <div className="space-y-4">
              <div
                onClick={() => navigate("/student/schedule")}
                className="cursor-pointer hover:opacity-80 transition"
              >
                <ClassItem time="10:00" subject="Advanced AI Ethics" room="Room 402" />
              </div>
              <div
                onClick={() => navigate("/student/schedule")}
                className="cursor-pointer hover:opacity-80 transition"
              >
                <ClassItem time="01:30" subject="Data Structures" room="Lab 3" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">Recent Attendance History</h2>
          <button
            type="button"
            onClick={() => navigate("/student/attendance")}
            className="text-blue-600 font-semibold hover:underline"
          >
            View All
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="p-4">Subject</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Confidence</th>
              </tr>
            </thead>
            <tbody>
              <TableRow subject="Software Engineering" date="Oct 24, 2023" status="Present" percent="98%" />
              <TableRow subject="Calculus II" date="Oct 23, 2023" status="Present" percent="95%" />
              <TableRow subject="Literature" date="Oct 21, 2023" status="Late" percent="88%" />
            </tbody>
          </table>
        </div>
      </div>
    </StudentLayout>
  );
}
