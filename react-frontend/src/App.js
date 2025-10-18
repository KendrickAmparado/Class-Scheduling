import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/login/LoginPage.jsx';
import AdminLogin from './components/login/AdminLogin.jsx';
import InstructorLogin from './components/login/InstructorLogin.jsx';
import InstructorSignup from './components/login/InstructorSignup.jsx';
import AdminDashboard from './components/admin/AdminDashboard.jsx';
import ManageSchedule from './components/admin/ManageSchedule.jsx';
import ScheduleCalendar from './components/admin/ScheduleCalendar.jsx';
import FacultyManagement from './components/admin/FacultyManagement.jsx';
import RoomManagement from './components/admin/RoomManagement.jsx';
import RoomSchedule from './components/admin/RoomSchedule.jsx';
import Reports from './components/admin/Reports.jsx';
import Settings from './components/admin/Settings.jsx';
import InstructorDashboard from './components/instructor/InstructorDashboard.jsx';
import InstructorReports from './components/instructor/InstructorReports.jsx';
import InstructorSettings from './components/instructor/InstructorSettings.jsx';
import './styles/global.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/instructor/login" element={<InstructorLogin />} />
          <Route path="/instructor/signup" element={<InstructorSignup />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/manage-schedule" element={<ManageSchedule />} />
          <Route path="/admin/schedule/:course/:year" element={<ScheduleCalendar />} />
          <Route path="/admin/faculty-management" element={<FacultyManagement />} />
          <Route path="/admin/room-management" element={<RoomManagement />} />
          <Route path="/admin/room-schedule/:roomId" element={<RoomSchedule />} />
          <Route path="/admin/reports" element={<Reports />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
          <Route path="/instructor/reports" element={<InstructorReports />} />
          <Route path="/instructor/settings" element={<InstructorSettings />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;