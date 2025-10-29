import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/login/LoginPage.jsx';
import AdminLogin from './components/login/AdminLogin.jsx';
import InstructorLogin from './components/login/InstructorLogin.jsx';
import InstructorSignup from './components/login/InstructorSignup.jsx';
import AdminDashboard from './components/admin/AdminDashboard.jsx';
import SectionManagement from './components/admin/SectionManagement.jsx';
import ScheduleManagement from './components/admin/ScheduleManagement.jsx'; // NEW: Year level selection page
import ScheduleManagementDetails from './components/admin/ScheduleManagementDetails.jsx'; // NEW: Section schedules page
import ScheduleCalendar from './components/admin/ScheduleCalendar.jsx';
import FacultyManagement from './components/admin/FacultyManagement.jsx';
import RoomManagement from './components/admin/RoomManagement.jsx';
import RoomSchedule from './components/admin/RoomSchedule.jsx';
import Reports from './components/admin/Reports.jsx';
import Settings from './components/admin/Settings.jsx';
import InstructorDashboard from './components/instructor/InstructorDashboard.jsx';
import InstructorReports from './components/instructor/InstructorReports.jsx';
import InstructorSettings from './components/instructor/InstructorSettings.jsx';
import { AlertsProvider } from './context/AlertsContext.jsx';
import ActivityLogs from './components/admin/ActivityLogs'; // Adjust the path based on your structure
import { AuthProvider } from './context/AuthContext.jsx';
import './styles/global.css';



function App() {
  return (
    <Router>
      <AlertsProvider>
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/instructor/login" element={<InstructorLogin />} />
            <Route path="/instructor/signup" element={<InstructorSignup />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            
            {/* Section Management - for managing sections (add/remove sections) */}
            <Route path="/admin/manage-schedule" element={<SectionManagement />} />
            
            {/* Schedule Management - NEW routes for managing schedules */}
            <Route path="/admin/schedule-management" element={<ScheduleManagement />} />
            <Route path="/admin/schedule-management/:course/:year" element={<ScheduleManagementDetails />} />
            
            {/* Schedule Calendar - for viewing schedules in calendar format */}
            <Route path="/admin/schedule/:course/:year" element={<ScheduleCalendar />} />
            
            <Route path="/admin/faculty-management" element={<FacultyManagement />} />
            <Route path="/admin/room-management" element={<RoomManagement />} />
            <Route path="/admin/room-schedule/:roomId" element={<RoomSchedule />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/settings" element={<Settings />} />
            <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
            <Route path="/instructor/reports" element={<InstructorReports />} />
            <Route path="/instructor/settings" element={<InstructorSettings />} />
            <Route path="/admin/activity-logs" element={<ActivityLogs />} />

          </Routes>
        </div>
      </AlertsProvider>
    </Router>
  );
}

export default App;
