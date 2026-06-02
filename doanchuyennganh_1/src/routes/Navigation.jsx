// import {
//   BrowserRouter,
//   Routes,
//   Route,
//   Navigate,
// } from "react-router-dom";

// import DashboardPage from "../pages/Admin/AdminDashboard";
// import StudentsPage from "../pages/Admin/AdminStudentsPage";
// import AdminAddTeacherPage from "../pages/Admin/AdminAddTeacherPage";
// import AdminTeachersPage from "../pages/Admin/AdminTeachersPage";
// import RoomsPage from "../pages/Admin/AdminRoomsPage";
// import SchedulePage from "../pages/Admin/AdminSchedulePage";
// import SubjectsPage from "../pages/Admin/AdminSubjectsPage";
// import AdminAddStudentPage from "../pages/Admin/AdminAddStudentPage";
// import AdminEditTeacherPage from "../pages/Admin/AdminEditTeacherPage";
// import AdminStudentDetailPage from "../pages/Admin/AdminStudentDetailPage";
// import AdminEditStudentPage from "../pages/Admin/AdminEditStudentPage";
// import AdminAttendancePage from "../pages/Admin/AdminAttendancePage";
// import AdminAccountsPage from "../pages/Admin/AdminAccountsPage";
// import AdminSettingsPage from "../pages/Admin/AdminSettingsPage";
// import AdminReportsPage from "../pages/Admin/AdminReportsPage";
// import AdminCameraMonitorPage from "../pages/Admin/AdminCameraMonitorPage";

// import TeacherDashboard from "../pages/Teacher/TeacherDashboard";
// import TeacherSchedule from "../pages/Teacher/TeacherSchedule";
// import TeacherClasses from "../pages/Teacher/TeacherClasses";
// import TeacherClassDetail from "../pages/Teacher/TeacherClassDetail";
// import TeacherAttendance from "../pages/Teacher/TeacherAttendance";
// import TeacherSessions from "../pages/Teacher/TeacherSessions";
// import TeacherNotifications from "../pages/Teacher/TeacherNotifications";
// import TeacherProfile from "../pages/Teacher/TeacherProfile";
// import TeacherStatistics from "../pages/Teacher/TeacherStatistics";
// <<<<<<< HEAD

// import LoginPage from "../pages/LoginPage";
// import CameraRoomPage from "../pages/CameraRoomPage";
// =======
// // import TeacherChangePasswordPanel from "./TeacherChangePasswordPanel";
// import LoginPage from "./../pages/LoginPage";
// >>>>>>> origin/main

// export default function Navigation() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<Navigate to="/login" replace />} />

//         <Route path="/login" element={<LoginPage />} />

// <<<<<<< HEAD
//         {/* Camera nhận diện độc lập */}
//         <Route path="/camera-room" element={<CameraRoomPage />} />

// =======
// >>>>>>> origin/main
//         {/* Admin Routes */}
//         <Route path="/dashboard" element={<DashboardPage />} />
//         <Route path="/students" element={<StudentsPage />} />
//         <Route path="/addteachers" element={<AdminAddTeacherPage />} />
//         <Route path="/teachers" element={<AdminTeachersPage />} />
//         <Route path="/rooms" element={<RoomsPage />} />
//         <Route path="/schedule" element={<SchedulePage />} />
//         <Route path="/subjects" element={<SubjectsPage />} />
//         <Route path="/addstudent" element={<AdminAddStudentPage />} />
//         <Route path="/editteacher/:id" element={<AdminEditTeacherPage />} />
//         <Route path="/studentdetail/:id" element={<AdminStudentDetailPage />} />
//         <Route path="/editstudent/:id" element={<AdminEditStudentPage />} />
//         <Route path="/attendance" element={<AdminAttendancePage />} />
//         <Route path="/accounts" element={<AdminAccountsPage />} />
//         <Route path="/settings" element={<AdminSettingsPage />} />
//         <Route path="/reports" element={<AdminReportsPage />} />
//         <Route path="/cameras" element={<AdminCameraMonitorPage />} />

//         {/* Teacher Routes */}
//         <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
//         <Route path="/teacher/schedule" element={<TeacherSchedule />} />
//         <Route path="/teacher/classes" element={<TeacherClasses />} />
// <<<<<<< HEAD
//         <Route path="/teacher/classes/:id" element={<TeacherClassDetail />} />
//         <Route path="/teacher/classdetail/:id" element={<TeacherClassDetail />} />
//         <Route path="/teacher/sessions" element={<TeacherSessions />} />
//         <Route path="/teacher/attendance" element={<TeacherAttendance />} />
//         <Route
//           path="/teacher/attendance/:sessionId"
//           element={<TeacherAttendance />}
//         />
//         <Route path="/teacher/notifications" element={<TeacherNotifications />} />
//         <Route path="/teacher/statistics" element={<TeacherStatistics />} />
//         <Route path="/teacher/profile" element={<TeacherProfile />} />
// =======
//         <Route path="/teacher/sessions" element={<TeacherSessions />} />
//         <Route path="/teacher/attendance/:sessionId" element={<TeacherAttendance />} />
//         <Route path="/teacher/attendance" element={<TeacherAttendance />} />
//         <Route path="/teacher/notifications" element={<TeacherNotifications />} /> 
//         <Route path="/teacher/statistics" element={<TeacherStatistics />} />
//         {/* <Route path="/teacher/notifications" element={<TeacherNotifications />} />  */}
//         <Route path="/teacher/profile" element={<TeacherProfile />} />
//         {/* <Route path="/teacher/change-password" element={<TeacherChangePasswordPanel />} /> */}
// {/* <Route path="/teacher/attendance/:sessionId" element={<TeacherAttendance />} /> */}

//         {/* <Route path="/teacher/classdetail/:id" element={<TeacherClassDetail />} /> */}
// {/* Route chi tiết lớp - giữ route cũ */}
// <Route path="/teacher/classdetail/:id" element={<TeacherClassDetail />} />

// {/* Route chi tiết lớp - route chuẩn đồng bộ */}
// <Route path="/teacher/classes/:id" element={<TeacherClassDetail />} />




// >>>>>>> origin/main
//       </Routes>
//     </BrowserRouter>
//   );
// }
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import DashboardPage from "../pages/Admin/AdminDashboard";
import StudentsPage from "../pages/Admin/AdminStudentsPage";
import AdminAddTeacherPage from "../pages/Admin/AdminAddTeacherPage";
import AdminTeachersPage from "../pages/Admin/AdminTeachersPage";
import RoomsPage from "../pages/Admin/AdminRoomsPage";
import SchedulePage from "../pages/Admin/AdminSchedulePage";
import SubjectsPage from "../pages/Admin/AdminSubjectsPage";
import AdminAddStudentPage from "../pages/Admin/AdminAddStudentPage";
import AdminEditTeacherPage from "../pages/Admin/AdminEditTeacherPage";
import AdminStudentDetailPage from "../pages/Admin/AdminStudentDetailPage";
import AdminEditStudentPage from "../pages/Admin/AdminEditStudentPage";
import AdminAttendancePage from "../pages/Admin/AdminAttendancePage";
import AdminAccountsPage from "../pages/Admin/AdminAccountsPage";
import AdminSettingsPage from "../pages/Admin/AdminSettingsPage";
import AdminReportsPage from "../pages/Admin/AdminReportsPage";
import AdminCameraMonitorPage from "../pages/Admin/AdminCameraMonitorPage";

import TeacherDashboard from "../pages/Teacher/TeacherDashboard";
import TeacherSchedule from "../pages/Teacher/TeacherSchedule";
import TeacherClasses from "../pages/Teacher/TeacherClasses";
import TeacherClassDetail from "../pages/Teacher/TeacherClassDetail";
import TeacherAttendance from "../pages/Teacher/TeacherAttendance";
import TeacherSessions from "../pages/Teacher/TeacherSessions";
import TeacherNotifications from "../pages/Teacher/TeacherNotifications";
import TeacherProfile from "../pages/Teacher/TeacherProfile";
import TeacherStatistics from "../pages/Teacher/TeacherStatistics";

import LoginPage from "../pages/LoginPage";
import CameraRoomPage from "../pages/CameraRoomPage";

export default function Navigation() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />

        {/* Camera nhận diện độc lập */}
        <Route path="/camera-room" element={<CameraRoomPage />} />

        {/* Admin Routes */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/addteachers" element={<AdminAddTeacherPage />} />
        <Route path="/teachers" element={<AdminTeachersPage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="/addstudent" element={<AdminAddStudentPage />} />
        <Route path="/editteacher/:id" element={<AdminEditTeacherPage />} />
        <Route path="/studentdetail/:id" element={<AdminStudentDetailPage />} />
        <Route path="/editstudent/:id" element={<AdminEditStudentPage />} />
        <Route path="/attendance" element={<AdminAttendancePage />} />
        <Route path="/accounts" element={<AdminAccountsPage />} />
        <Route path="/settings" element={<AdminSettingsPage />} />
        <Route path="/reports" element={<AdminReportsPage />} />
        <Route path="/cameras" element={<AdminCameraMonitorPage />} />

        {/* Teacher Routes */}
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/schedule" element={<TeacherSchedule />} />
        <Route path="/teacher/classes" element={<TeacherClasses />} />

        {/* Route chi tiết lớp - giữ route cũ */}
        <Route path="/teacher/classdetail/:id" element={<TeacherClassDetail />} />

        {/* Route chi tiết lớp - route chuẩn */}
        <Route path="/teacher/classes/:id" element={<TeacherClassDetail />} />

        <Route path="/teacher/sessions" element={<TeacherSessions />} />
        <Route path="/teacher/attendance" element={<TeacherAttendance />} />
        <Route
          path="/teacher/attendance/:sessionId"
          element={<TeacherAttendance />}
        />
        <Route path="/teacher/notifications" element={<TeacherNotifications />} />
        <Route path="/teacher/statistics" element={<TeacherStatistics />} />
        <Route path="/teacher/profile" element={<TeacherProfile />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}