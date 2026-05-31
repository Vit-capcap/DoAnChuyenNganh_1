import { useEffect, useMemo, useState } from "react";

import Sidebar from "../components/admin/Sidebar";
import Header from "../components/admin/Header";

import ReportFilters from "../components/admin/ReportFilters";
import ReportKpiCards from "../components/admin/ReportKpiCards";
import AttendanceTrendChart from "../components/admin/AttendanceTrendChart";
import AttendanceDistributionChart from "../components/admin/AttendanceDistributionChart";
import AbsentStudentsTable from "../components/admin/AbsentStudentsTable";
import SubjectStatsTable from "../components/admin/SubjectStatsTable";

import { getReportOptions, getReportData } from "../../api/reportApi";

function getTodayInput() {
  return new Date().toISOString().slice(0, 10);
}

function getMonthStartInput() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("vi-VN");
}

function getSubjectStatus(rate) {
  const numberRate = Number(rate || 0);

  if (numberRate >= 90) {
    return {
      label: "Tốt",
      className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
      barClass: "bg-emerald-500",
    };
  }

  if (numberRate >= 75) {
    return {
      label: "Cảnh báo",
      className: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
      barClass: "bg-amber-500",
    };
  }

  return {
    label: "Thấp",
    className: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
    barClass: "bg-rose-500",
  };
}

function getInitials(name) {
  if (!name) return "SV";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

const defaultReportData = {
  kpis: {
    total_sessions: 0,
    total_attendance: 0,
    present_count: 0,
    late_count: 0,
    absent_count: 0,
    attendance_rate: 0,
    top_class: "Chưa có dữ liệu",
  },
  trend: [],
  absentStudents: [],
  subjectStats: [],
};

export default function AdminReportsPage() {
  const [period, setPeriod] = useState("month");
  const [classFilter, setClassFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");

  const [fromDate, setFromDate] = useState(getMonthStartInput());
  const [toDate, setToDate] = useState(getTodayInput());

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [reportData, setReportData] = useState(defaultReportData);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadOptions = async () => {
      try {
        const data = await getReportOptions();

        if (!isMounted) return;

        setClasses(Array.isArray(data.classes) ? data.classes : []);
        setSubjects(Array.isArray(data.subjects) ? data.subjects : []);
      } catch (error) {
        console.error("Lỗi tải options báo cáo:", error);

        if (isMounted) {
          setMessage(error.message || "Không thể tải bộ lọc báo cáo");
        }
      }
    };

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadReport = async () => {
      try {
        const data = await getReportData({
          period,
          from_date: fromDate,
          to_date: toDate,
          class_name: classFilter,
          id_subject: subjectFilter,
        });

        if (!isMounted) return;

        setReportData({
          kpis: data.kpis || defaultReportData.kpis,
          trend: Array.isArray(data.trend) ? data.trend : [],
          absentStudents: Array.isArray(data.absentStudents)
            ? data.absentStudents
            : [],
          subjectStats: Array.isArray(data.subjectStats)
            ? data.subjectStats
            : [],
        });

        setMessage("");
      } catch (error) {
        console.error("Lỗi tải báo cáo:", error);

        if (isMounted) {
          setMessage(error.message || "Không thể tải dữ liệu báo cáo");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      loadReport();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [period, fromDate, toDate, classFilter, subjectFilter, refreshKey]);

  const kpis = useMemo(() => {
    const data = reportData.kpis || {};

    return [
      {
        title: "Tổng số buổi học",
        value: Number(data.total_sessions || 0),
        icon: "event_available",
        iconClass: "bg-blue-50 text-blue-600",
      },
      {
        title: "Tỷ lệ có mặt trung bình",
        value: `${Number(data.attendance_rate || 0).toFixed(1)}%`,
        icon: "how_to_reg",
        iconClass: "bg-emerald-50 text-emerald-600",
      },
      {
        title: "Tổng lượt vắng",
        value: Number(data.absent_count || 0),
        icon: "person_off",
        iconClass: "bg-rose-50 text-rose-600",
      },
      {
        title: "Lớp chuyên cần cao nhất",
        value: data.top_class || "Chưa có dữ liệu",
        icon: "workspace_premium",
        iconClass: "bg-amber-50 text-amber-600",
      },
    ];
  }, [reportData.kpis]);

  const distribution = useMemo(() => {
    const kpi = reportData.kpis || {};
    const total = Number(kpi.total_attendance || 0);

    if (total === 0) {
      return {
        presentPercent: 0,
        latePercent: 0,
        absentPercent: 0,
      };
    }

    return {
      presentPercent: Number(
        ((Number(kpi.present_count || 0) / total) * 100).toFixed(1)
      ),
      latePercent: Number(
        ((Number(kpi.late_count || 0) / total) * 100).toFixed(1)
      ),
      absentPercent: Number(
        ((Number(kpi.absent_count || 0) / total) * 100).toFixed(1)
      ),
    };
  }, [reportData.kpis]);

  const trendPoints = useMemo(() => {
    const trend = reportData.trend || [];

    if (trend.length === 0) return "";

    return trend
      .map((item, index) => {
        const x =
          trend.length === 1
            ? 50
            : (index / Math.max(trend.length - 1, 1)) * 100;

        const rate = Number(item.attendance_rate || 0);
        const y = 100 - Math.min(Math.max(rate, 0), 100);

        return `${x},${y}`;
      })
      .join(" ");
  }, [reportData.trend]);

  const trendAreaPath = useMemo(() => {
    if (!trendPoints) return "";

    return `M${trendPoints.replaceAll(" ", " L")} L100,100 L0,100 Z`;
  }, [trendPoints]);

  const handlePeriodChange = (value) => {
    setPeriod(value);

    const now = new Date();
    const end = getTodayInput();

    if (value === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      setFromDate(start.toISOString().slice(0, 10));
      setToDate(end);
    }

    if (value === "month") {
      setFromDate(getMonthStartInput());
      setToDate(end);
    }

    if (value === "semester") {
      const start = new Date(now);
      start.setMonth(now.getMonth() - 5);
      setFromDate(start.toISOString().slice(0, 10));
      setToDate(end);
    }
  };

  const exportCSV = () => {
    const headers = ["Muc", "Gia tri"];

    const rows = [
      ["Tong so buoi hoc", reportData.kpis.total_sessions || 0],
      ["Tong luot diem danh", reportData.kpis.total_attendance || 0],
      ["Co mat", reportData.kpis.present_count || 0],
      ["Di tre", reportData.kpis.late_count || 0],
      ["Vang", reportData.kpis.absent_count || 0],
      ["Ty le chuyen can", `${reportData.kpis.attendance_rate || 0}%`],
      ["Lop chuyen can cao nhat", reportData.kpis.top_class || ""],
    ];

    const subjectRows = reportData.subjectStats.map((item) => [
      `Mon hoc: ${item.subject_name}`,
      `${item.attendance_rate || 0}%`,
    ]);

    const absentRows = reportData.absentStudents.map((item) => [
      `SV vang nhieu: ${item.student_code} - ${item.full_name}`,
      item.absent_count || 0,
    ]);

    const csvContent = [headers, ...rows, ...subjectRows, ...absentRows]
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
    link.download = `bao-cao-diem-danh-${fromDate}-${toDate}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  const resetFilters = () => {
    setClassFilter("");
    setSubjectFilter("");
    handlePeriodChange("month");
    setRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-700 flex">
        <Sidebar activePage="reports" />

        <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
          <Header />

          <main className="flex-1 p-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm flex flex-col items-center justify-center min-h-[320px]">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />

              <p className="text-sm font-semibold text-slate-600">
                Đang tải dữ liệu báo cáo...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar activePage="reports" />

      <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-6 text-white shadow-lg shadow-blue-100 print:hidden">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 text-blue-100 text-sm mb-2">
                  <span className="material-symbols-outlined text-[18px]">
                    monitoring
                  </span>
                  Thống kê hệ thống
                </div>

                <h1 className="text-3xl font-bold tracking-tight">
                  Báo cáo thống kê
                </h1>

                <p className="text-sm text-blue-100 mt-2 max-w-2xl">
                  Tổng quan dữ liệu điểm danh, chuyên cần, sinh viên vắng nhiều
                  và tỷ lệ theo môn học từ MySQL.
                </p>
              </div>
            </div>
          </div>

          <div className="hidden print:block mb-6">
            <h1 className="text-3xl font-bold text-slate-900">
              Báo cáo thống kê điểm danh
            </h1>

            <p className="text-sm text-slate-600 mt-1">
              Thời gian: {formatDate(fromDate)} - {formatDate(toDate)}
            </p>
          </div>

          <ReportFilters
            period={period}
            fromDate={fromDate}
            toDate={toDate}
            classFilter={classFilter}
            subjectFilter={subjectFilter}
            classes={classes}
            subjects={subjects}
            onPeriodChange={handlePeriodChange}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
            onClassChange={setClassFilter}
            onSubjectChange={setSubjectFilter}
            onReset={resetFilters}
            onExportCSV={exportCSV}
            onPrint={printReport}
          />

          {message && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 flex items-start gap-2 print:hidden">
              <span className="material-symbols-outlined text-[20px]">
                error
              </span>
              <span>{message}</span>
            </div>
          )}

          <ReportKpiCards kpis={kpis} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <AttendanceTrendChart
              trend={reportData.trend}
              trendPoints={trendPoints}
              trendAreaPath={trendAreaPath}
              fromDate={fromDate}
              toDate={toDate}
              formatDate={formatDate}
            />

            <AttendanceDistributionChart
              distribution={distribution}
              attendanceRate={Number(reportData.kpis.attendance_rate || 0)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AbsentStudentsTable
              students={reportData.absentStudents}
              getInitials={getInitials}
            />

            <SubjectStatsTable
              subjects={reportData.subjectStats}
              getSubjectStatus={getSubjectStatus}
            />
          </div>
        </main>
      </div>
    </div>
  );
}