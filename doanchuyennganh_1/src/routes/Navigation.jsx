import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// ========================= LOGIN =========================
import Login from "../pages/Login";
import LoginPage from "./../pages/LoginPage";

// ========================= ADMIN =========================
import DashboardPage from "../pages/Admin/AdminDashboard";
import StudentsPage from "../pages/Admin/AdminStudentsPage";
import AdminAddTeacherPage from "../pages/Admin/AdminAddTeacherPage";
import AdminTeachersPage from "../pages/Admin/AdminTeachersPage";
import RoomsPage from "../pages/Admin/AdminRoomsPage";
import SchedulePage from "../pages/Admin/AdminSchedulePage";
import SubjectsPage from "../pages/Admin/AdminSubjectsPage";
import AdminAddStudentPage from "../pages/Admin/AdminAddStudentPage";
import AdminEditTeacherPage from "../pages/Admin/AdminEditTeacherPage";
import AdminRoomsPage from "../pages/Admin/AdminRoomsPage";
import AdminStudentDetailPage from "../pages/Admin/AdminStudentDetailPage";
import AdminEditStudentPage from "../pages/Admin/AdminEditStudentPage";
import AdminAttendancePage from "../pages/Admin/AdminAttendancePage";
import AdminAccountsPage from "../pages/Admin/AdminAccountsPage";
import AdminSettingsPage from "../pages/Admin/AdminSettingsPage";
import AdminReportsPage from "../pages/Admin/AdminReportsPage";
import AdminCameraMonitorPage from "../pages/Admin/AdminCameraMonitorPage";

// ========================= TEACHER =========================
import TeacherDashboard from "../pages/Teacher/TeacherDashboard";
import TeacherSchedule from "../pages/Teacher/TeacherSchedule";
import TeacherClasses from "../pages/Teacher/TeacherClasses";
import TeacherClassDetail from "../pages/Teacher/TeacherClassDetail";
import TeacherAttendance from "../pages/Teacher/TeacherAttendance";
import TeacherSessions from "../pages/Teacher/TeacherSessions";
import TeacherNotifications from "../pages/Teacher/TeacherNotifications";
import TeacherProfile from "../pages/Teacher/TeacherProfile";
import TeacherStatistics from "../pages/Teacher/TeacherStatistics";
// import TeacherChangePasswordPanel from "./TeacherChangePasswordPanel";

// ========================= STUDENT =========================
import StudentDashboard from "../pages/Student/Dashboard";
import StudentPersonalProfile from "../pages/Student/PersonalProfilePage";
import StudentStudySchedule from "../pages/Student/StudySchedule";
import StudentAttendanceHistory from "../pages/Student/AttendanceHistoryPage";
import StudentStatistics from "../pages/Student/Statistics";
import StudentNotifications from "../pages/Student/NotificationsPage";
import StudentSettings from "../pages/Student/SettingCard";

// ========================= OTHER =========================
import CameraRoomPage from "../pages/CameraRoomPage";


/* =========================
   ProtectedRoute: kiểm tra đăng nhập và phân quyền
========================= */
function ProtectedRoute({ children, allowedRoles }) {
  const userRaw = localStorage.getItem("user");

  if (!userRaw) {
    // Chưa đăng nhập → về login
    return <Navigate to="/login" replace />;
  }

  let user;
  try {
    user = JSON.parse(userRaw);
  } catch {
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Sai role → về trang phù hợp
    if (user.role === "STUDENT") return <Navigate to="/student/dashboard" replace />;
    if (user.role === "ADMIN" || user.role === "TEACHER") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}

/* =========================
   RootRedirect: redirect theo role sau khi đã đăng nhập
========================= */
function RootRedirect() {
  const userRaw = localStorage.getItem("user");

  if (!userRaw) {
    return <Navigate to="/login" replace />;
  }

  let user;
  try {
    user = JSON.parse(userRaw);
  } catch {
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  if (user.role === "STUDENT") return <Navigate to="/student/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}


export default function Navigation() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ROOT */}
        <Route path="/" element={<RootRedirect />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />

        {/* LOGIN */}
        {/* <Route path="/login" element={<Login />} /> */}

        {/* Camera nhận diện độc lập */}
        <Route path="/camera-room" element={<CameraRoomPage />} />

        {/* =================== ADMIN ROUTES =================== */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={["ADMIN", "TEACHER"]}>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/students" element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <StudentsPage />
          </ProtectedRoute>
        } />
        <Route path="/addteachers" element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminAddTeacherPage />
          </ProtectedRoute>
        } />
        <Route path="/teachers" element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminTeachersPage />
          </ProtectedRoute>
        } />
        <Route path="/rooms" element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <RoomsPage />
          </ProtectedRoute>
        } />
        <Route path="/schedule" element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <SchedulePage />
          </ProtectedRoute>
        } />
        <Route path="/subjects" element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <SubjectsPage />
          </ProtectedRoute>
        } />
        <Route path="/addstudent" element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminAddStudentPage />
          </ProtectedRoute>
        } />
        <Route path="/editteacher/:id" element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminEditTeacherPage />
          </ProtectedRoute>
        } />
        <Route path="/studentdetail/:id" element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminStudentDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/editstudent/:id" element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminEditStudentPage />
          </ProtectedRoute>
        } />
        <Route path="/attendance" element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminAttendancePage />
          </ProtectedRoute>
        } />
        <Route path="/accounts" element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminAccountsPage />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminSettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminReportsPage />
          </ProtectedRoute>
        } />
        <Route path="/cameras" element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminCameraMonitorPage />
          </ProtectedRoute>
        } />

        {/* =================== TEACHER ROUTES =================== */}
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/schedule" element={<TeacherSchedule />} />
        <Route path="/teacher/classes" element={<TeacherClasses />} />
        <Route path="/teacher/sessions" element={<TeacherSessions />} />
        <Route path="/teacher/attendance/:sessionId" element={<TeacherAttendance />} />
        <Route path="/teacher/attendance" element={<TeacherAttendance />} />
        <Route path="/teacher/notifications" element={<TeacherNotifications />} /> 
        <Route path="/teacher/statistics" element={<TeacherStatistics />} />
        {/* <Route path="/teacher/notifications" element={<TeacherNotifications />} />  */}
        <Route path="/teacher/profile" element={<TeacherProfile />} />
        {/* <Route path="/teacher/change-password" element={<TeacherChangePasswordPanel />} /> */}
        {/* <Route path="/teacher/attendance/:sessionId" element={<TeacherAttendance />} /> */}
        {/* <Route path="/teacher/classdetail/:id" element={<TeacherClassDetail />} /> */}
        {/* Route chi tiết lớp - giữ route cũ */}
        <Route path="/teacher/classdetail/:id" element={<TeacherClassDetail />} />
        {/* Route chi tiết lớp - route chuẩn đồng bộ */}
        <Route path="/teacher/classes/:id" element={<TeacherClassDetail />} />

        {/* =================== STUDENT ROUTES =================== */}
        <Route path="/student/dashboard" element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/student/profile" element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentPersonalProfile />
          </ProtectedRoute>
        } />
        <Route path="/student/schedule" element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentStudySchedule />
          </ProtectedRoute>
        } />
        <Route path="/student/attendance" element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentAttendanceHistory />
          </ProtectedRoute>
        } />
        <Route path="/student/statistics" element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentStatistics />
          </ProtectedRoute>
        } />
        <Route path="/student/notifications" element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentNotifications />
          </ProtectedRoute>
        } />
        <Route path="/student/settings" element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentSettings />
          </ProtectedRoute>
        } />

        {/* FALLBACK */}
        <Route path="*" element={<RootRedirect />} />

      </Routes>
    </BrowserRouter>
  );
}