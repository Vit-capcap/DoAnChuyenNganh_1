import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

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
import AdminReportsPage from "../pages/Admin/AdminReportsPage"
import AdminCameraMonitorPage from "../pages/Admin/AdminCameraMonitorPage";


export default function Navigation() {
  return (
    <BrowserRouter>
      <Routes>
      
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/addteachers" element={<AdminAddTeacherPage />} />
        <Route path="/teachers" element={<AdminTeachersPage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="/addstudent" element={<AdminAddStudentPage />}/>
        <Route path="/editteacher/:id" element={<AdminEditTeacherPage />} />
        <Route path="/rooms" element={<AdminRoomsPage />} />
        <Route path="/studentdetail/:id" element={<AdminStudentDetailPage />} />
        <Route path="/editstudent/:id" element={<AdminEditStudentPage />} />
        <Route path="/attendance" element={<AdminAttendancePage />} />
        <Route path="/accounts" element={<AdminAccountsPage />} />
        <Route path="/settings" element={<AdminSettingsPage />} />
        <Route path="/reports" element={<AdminReportsPage />} />
        <Route path="/cameras" element={<AdminCameraMonitorPage />} />

        
      </Routes>
    </BrowserRouter>
  );
}