
import { useEffect, useState } from "react";


import Sidebar from "../components/admin/Sidebar";
import Header from "../components/admin/Header";

import MetricCard from "./components/MetricCard";
import AttendanceChart from "./components/AttendanceChart";
import BarChart from "./components/BarChart";
import RecentActivities from "./components/RecentActivities";
import TodaySchedule from "./components/TodaySchedule";
import QuickActions from "./components/QuickActions";

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3060/api/admin/dashboard")
      .then((res) => res.json())
      .then((data) => {
        setDashboard(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi lấy dashboard:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Đang tải dữ liệu dashboard...
      </div>
    );
  }

  const cards = [
    {
      icon: "group",
      title: "Tổng học sinh",
      value: dashboard?.totalStudents || 0,
    },
    {
      icon: "school",
      title: "Tổng giáo viên",
      value: dashboard?.totalTeachers || 0,
    },
    {
      icon: "meeting_room",
      title: "Tổng phòng học",
      value: dashboard?.totalRooms || 0,
    },
    {
      icon: "menu_book",
      title: "Môn học",
      value: dashboard?.totalSubjects || 0,
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-[Inter] text-gray-800">
      <Sidebar activePage="dashboard" />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 p-4 md:p-6 max-w-[1440px] mx-auto w-full">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-4xl font-bold text-gray-900">Tổng quan</h2>
              <p className="text-gray-500 mt-1">
                Hệ thống điểm danh khuôn mặt AI
              </p>
            </div>

            <div className="hidden md:flex gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-semibold hover:bg-gray-50">
                <span className="material-symbols-outlined text-[18px]">
                  calendar_today
                </span>
                Hôm nay
              </button>

              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700">
                <span className="material-symbols-outlined text-[18px]">
                  download
                </span>
                Xuất báo cáo
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            {cards.map((card, index) => (
              <MetricCard
                key={index}
                icon={card.icon}
                title={card.title}
                value={card.value}
              />
            ))}

            <div className="bg-blue-600 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition relative overflow-hidden text-white">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined">fact_check</span>
                </div>

                <span className="text-xs text-blue-600 bg-white px-2 py-1 rounded-full">
                  Hôm nay
                </span>
              </div>

              <p className="text-sm text-white/80 mb-1">Tỷ lệ điểm danh</p>
              <h3 className="text-3xl font-bold">
                {Number(dashboard?.attendancePercent ?? 0).toFixed(2)}%
              </h3>

              <p className="text-xs text-white/70 mt-2">
                {dashboard?.attendedCount ?? 0}/{dashboard?.totalAttendance ?? 0} lượt có mặt
              </p>
              
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <AttendanceChart />
            <BarChart />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RecentActivities data={dashboard?.recentActivities || []} />

            <div className="flex flex-col gap-6">
              <TodaySchedule data={dashboard?.todaySchedule || []} />
              <QuickActions />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}