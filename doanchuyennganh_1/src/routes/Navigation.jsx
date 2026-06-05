import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

/* =========================================================
   AUTH / COMMON ROUTES
   Dùng chung cho toàn hệ thống
========================================================= */
import LoginPage from "../pages/LoginPage";
import CameraRoomPage from "../pages/CameraRoomPage";

/* =========================================================
   ADMIN ROUTES
   Người dùng: ADMIN
========================================================= */
import AdminDashboard from "../pages/Admin/AdminDashboard";
import AdminStudentsPage from "../pages/Admin/AdminStudentsPage";
import AdminAddStudentPage from "../pages/Admin/AdminAddStudentPage";
import AdminEditStudentPage from "../pages/Admin/AdminEditStudentPage";
import AdminStudentDetailPage from "../pages/Admin/AdminStudentDetailPage";
import AdminTeachersPage from "../pages/Admin/AdminTeachersPage";
import AdminAddTeacherPage from "../pages/Admin/AdminAddTeacherPage";
import AdminEditTeacherPage from "../pages/Admin/AdminEditTeacherPage";
import AdminRoomsPage from "../pages/Admin/AdminRoomsPage";
import AdminSchedulePage from "../pages/Admin/AdminSchedulePage";
import AdminSubjectsPage from "../pages/Admin/AdminSubjectsPage";
import AdminAttendancePage from "../pages/Admin/AdminAttendancePage";
import AdminAccountsPage from "../pages/Admin/AdminAccountsPage";
import AdminSettingsPage from "../pages/Admin/AdminSettingsPage";
import AdminReportsPage from "../pages/Admin/AdminReportsPage";
import AdminCameraMonitorPage from "../pages/Admin/AdminCameraMonitorPage";

/* =========================================================
   TEACHER ROUTES
   Người dùng: TEACHER
========================================================= */
import TeacherDashboard from "../pages/Teacher/TeacherDashboard";
import TeacherSchedule from "../pages/Teacher/TeacherSchedule";
import TeacherClasses from "../pages/Teacher/TeacherClasses";
import TeacherClassDetail from "../pages/Teacher/TeacherClassDetail";
import TeacherSessions from "../pages/Teacher/TeacherSessions";
import TeacherAttendance from "../pages/Teacher/TeacherAttendance";
import TeacherNotifications from "../pages/Teacher/TeacherNotifications";
import TeacherStatistics from "../pages/Teacher/TeacherStatistics";
import TeacherProfile from "../pages/Teacher/TeacherProfile";

/* =========================================================
   STUDENT ROUTES
   Người dùng: STUDENT
========================================================= */
import StudentDashboard from "../pages/Student/StudentDashboard";
import StudentProfile from "../pages/Student/StudentProfile";
import StudentSchedule from "../pages/Student/StudentSchedule";
import StudentAttendance from "../pages/Student/StudentAttendance";
import StudentChangePasswordPanel from "../pages/Student/StudentChangePasswordPanel";
import StudentSetting from "../pages/Student/StudentSetting";
import StudentNotifications from "../pages/Student/StudentNotifications";

export default function Navigation() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =====================================================
            DEFAULT / AUTH
        ===================================================== */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Camera nhận diện độc lập */}
        <Route path="/camera-room" element={<CameraRoomPage />} />

        {/* =====================================================
            ADMIN ROUTES
            Note: Các route này dành cho tài khoản ADMIN
        ===================================================== */}
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/students" element={<AdminStudentsPage />} />
        <Route path="/addstudent" element={<AdminAddStudentPage />} />
        <Route path="/editstudent/:id" element={<AdminEditStudentPage />} />
        <Route path="/studentdetail/:id" element={<AdminStudentDetailPage />} />
        <Route path="/teachers" element={<AdminTeachersPage />} />
        <Route path="/addteachers" element={<AdminAddTeacherPage />} />
        <Route path="/editteacher/:id" element={<AdminEditTeacherPage />} />
        <Route path="/rooms" element={<AdminRoomsPage />} />
        <Route path="/schedule" element={<AdminSchedulePage />} />
        <Route path="/subjects" element={<AdminSubjectsPage />} />
        <Route path="/attendance" element={<AdminAttendancePage />} />
        <Route path="/accounts" element={<AdminAccountsPage />} />
        <Route path="/settings" element={<AdminSettingsPage />} />
        <Route path="/reports" element={<AdminReportsPage />} />
        <Route path="/cameras" element={<AdminCameraMonitorPage />} />

        {/* =====================================================
            TEACHER ROUTES
            Note: Các route này dành cho tài khoản TEACHER
        ===================================================== */}
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/schedule" element={<TeacherSchedule />} />
        <Route path="/teacher/classes" element={<TeacherClasses />} />
        <Route path="/teacher/classes/:id" element={<TeacherClassDetail />} />
        <Route path="/teacher/classdetail/:id" element={<TeacherClassDetail />} />
        <Route path="/teacher/sessions" element={<TeacherSessions />} />
        <Route path="/teacher/attendance" element={<TeacherAttendance />} />
        <Route path="/teacher/attendance/:sessionId" element={<TeacherAttendance />} />
        <Route path="/teacher/notifications" element={<TeacherNotifications />} />
        <Route path="/teacher/statistics" element={<TeacherStatistics />} />
        <Route path="/teacher/profile" element={<TeacherProfile />} />

        {/* =====================================================
            STUDENT ROUTES
            Note: Các route này dành cho tài khoản STUDENT
        ===================================================== */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/profile" element={<StudentProfile />} />
        <Route path="/student/schedule" element={<StudentSchedule />} />
        <Route path="/student/attendance-history" element={<StudentAttendance />} />
        <Route path="/student/change-password" element={<StudentChangePasswordPanel />} />
        <Route path="/student/settings" element={<StudentSetting />} />
        <Route path="/student/notifications" element={<StudentNotifications />} />

        {/* =====================================================
            FALLBACK
            Nếu nhập sai URL thì quay lại trang đăng nhập
        ===================================================== */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}