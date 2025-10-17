import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import '../../styles/InstructorDashboard.css';

const InstructorDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* Instructor Sidebar */}
      <div className="sidebar" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
        <div className="admin-profile">
          <div className="logo-container">
            <img src="/images/buksuu.png" alt="BukSU Logo" className="sidebar-logo" />
          </div>
          <div className="admin-avatar">
            <FontAwesomeIcon icon={faUser} />
          </div>
          <div className="admin-info">
            <h4>Instructor Name</h4>
            <p>Faculty Member</p>
          </div>
        </div>
        
        <nav className="sidebar-menu">
          <button className="menu-item active">
            <FontAwesomeIcon icon={faCalendarAlt} />
            <span>My Schedule</span>
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <main className="main-content">
        <div className="top-header">
          <div className="header-left">
            <div className="header-logos">
              <img src="/images/buksuu.png" alt="BukSU Logo" className="header-logo" />
              <img src="/images/COT-LOGO_T.png" alt="COT Logo" className="header-logo" />
            </div>
            <h1>Instructor Dashboard</h1>
          </div>
        </div>
        
        <div className="dashboard-content">
          <div className="welcome-section">
            <h2>Welcome to Your Dashboard</h2>
            <p>View and manage your teaching schedule</p>
          </div>
          
          <div style={{ padding: '20px', background: 'white', borderRadius: '10px', marginTop: '20px' }}>
            <p>Instructor features will be implemented here:</p>
            <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
              <li>View current schedule</li>
              <li>Update availability</li>
              <li>Request schedule changes</li>
              <li>View class rosters</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InstructorDashboard;