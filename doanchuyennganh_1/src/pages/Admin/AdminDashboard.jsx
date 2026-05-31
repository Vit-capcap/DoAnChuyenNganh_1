import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/admin/Sidebar";
import Header from "../components/admin/Header";

import DashboardMetricCards from "../components/admin/DashboardMetricCards";
import AttendanceRateCard from "../components/admin/DashboardAttendanceRateCard";
import AttendanceTrendChart from "../components/admin/DashboardAttendanceTrendChart";
import AttendanceStatusChart from "../components/admin/DashboardAttendanceStatusChart";
import RecentActivities from "../components/admin/DashboardRecentActivities";
import TodaySchedule from "../components/admin/DashboardTodaySchedule";
import QuickActions from "../components/admin/DashboardQuickActions";

import { getAdminDashboard } from "../../api/dashboardApi";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        const data = await getAdminDashboard();

        if (!isMounted) return;

        setDashboard(data || {});
        setMessage("");
      } catch (error) {
        console.error("Lỗi lấy dashboard:", error);

        if (isMounted) {
          setMessage(error.message || "Không thể tải dashboard");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const cards = useMemo(
    () => [
      {
        icon: "group",
        title: "Tổng học sinh",
        value: dashboard?.totalStudents || 0,
        tag: "Student",
        iconClass: "bg-blue-50 text-blue-600",
      },
      {
        icon: "school",
        title: "Tổng giáo viên",
        value: dashboard?.totalTeachers || 0,
        tag: "Teacher",
        iconClass: "bg-purple-50 text-purple-600",
      },
      {
        icon: "meeting_room",
        title: "Tổng phòng học",
        value: dashboard?.totalRooms || 0,
        tag: "Room",
        iconClass: "bg-emerald-50 text-emerald-600",
      },
      {
        icon: "menu_book",
        title: "Môn học",
        value: dashboard?.totalSubjects || 0,
        tag: "Subject",
        iconClass: "bg-amber-50 text-amber-600",
      },
    ],
    [dashboard]
  );

  const exportCSV = () => {
    const headers = ["Chỉ số", "Giá trị"];

    const attendancePercent = Number(
      dashboard?.attendancePercent ?? dashboard?.attendanceRate ?? 0
    );

    const rows = [
      ["Tổng học sinh", dashboard?.totalStudents || 0],
      ["Tổng giáo viên", dashboard?.totalTeachers || 0],
      ["Tổng phòng học", dashboard?.totalRooms || 0],
      ["Tổng môn học", dashboard?.totalSubjects || 0],
      ["Tổng lượt điểm danh", dashboard?.totalAttendance || 0],
      ["Lượt có mặt/đi trễ", dashboard?.attendedCount || 0],
      ["Tỷ lệ điểm danh", `${attendancePercent.toFixed(2)}%`],
    ];

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "dashboard-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-700 flex">
        <Sidebar activePage="dashboard" />

        <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
          <Header />

          <main className="flex-1 p-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm flex flex-col items-center justify-center min-h-[320px]">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />

              <p className="text-sm font-semibold text-slate-600">
                Đang tải dữ liệu dashboard...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar activePage="dashboard" />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 text-white shadow-lg shadow-blue-100">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 text-blue-100 text-sm mb-2">
                  <span className="material-symbols-outlined text-[18px]">
                    dashboard
                  </span>
                  Bảng điều khiển quản trị
                </div>

                <h2 className="text-3xl font-bold tracking-tight">
                  Tổng quan
                </h2>

                <p className="text-sm text-blue-100 mt-2 max-w-2xl">
                  Hệ thống điểm danh khuôn mặt AI, thống kê nhanh sinh viên,
                  giáo viên, phòng học và tình hình điểm danh.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setRefreshKey((prev) => prev + 1)}
                  className="bg-white/15 hover:bg-white/25 text-white border border-white/20 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 transition"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    refresh
                  </span>
                  Tải lại
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/attendance")}
                  className="bg-white/15 hover:bg-white/25 text-white border border-white/20 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 transition"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    calendar_today
                  </span>
                  Hôm nay
                </button>

                <button
                  type="button"
                  onClick={exportCSV}
                  className="bg-white text-blue-700 px-5 py-3 rounded-2xl flex items-center gap-2 text-sm font-bold hover:bg-blue-50 transition shadow-sm"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    download
                  </span>
                  Xuất báo cáo
                </button>
              </div>
            </div>
          </div>

          {message && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 flex items-start gap-2">
              <span className="material-symbols-outlined text-[20px]">
                error
              </span>
              <span>{message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 mb-6">
            <div className="xl:col-span-4">
              <DashboardMetricCards cards={cards} />
            </div>

            <AttendanceRateCard dashboard={dashboard} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <AttendanceTrendChart data={dashboard?.attendanceTrend || []} />

            <AttendanceStatusChart
              present={dashboard?.presentCount || 0}
              late={dashboard?.lateCount || 0}
              absent={dashboard?.absentCount || 0}
              total={dashboard?.totalAttendance || 0}
            />
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