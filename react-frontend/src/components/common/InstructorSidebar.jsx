import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faSignOutAlt,
  faChartBar,
  faCog
} from '@fortawesome/free-solid-svg-icons';

const InstructorSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/instructor/dashboard', icon: faHome, label: 'Dashboard' },
    { path: '/instructor/reports', icon: faChartBar, label: 'Reports' },
    { path: '/instructor/settings', icon: faCog, label: 'Settings' }
  ];

  const handleLogout = () => {
    // Add logout logic here
    navigate('/login');
  };

  return (
    <aside className="sidebar" style={{
      width: '200px',
      background: 'linear-gradient(135deg, #0f2c63 60%, #ea580c 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
      zIndex: 1000
    }}>
      <nav className="sidebar-menu" style={{
        flex: 1,
        padding: '60px 0 10px 0'
      }}>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '8px',
              padding: '15px 25px',
              color: location.pathname === item.path ? 'white' : 'rgba(255, 255, 255, 0.8)',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              margin: '2px 15px',
              borderRadius: '10px',
              fontWeight: '500',
              background: location.pathname === item.path ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              boxShadow: location.pathname === item.path ? 'inset 4px 0 0 #ffffff' : 'none',
              minHeight: '60px'
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== item.path) {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.color = 'white';
                e.target.style.transform = 'translateX(5px)';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== item.path) {
                e.target.style.background = 'transparent';
                e.target.style.color = 'rgba(255, 255, 255, 0.8)';
                e.target.style.transform = 'translateX(0)';
              }
            }}
          >
            <FontAwesomeIcon
              icon={item.icon}
              style={{
                fontSize: '18px',
                width: '20px'
              }}
            />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer" style={{
        padding: '20px'
      }}>
        <button
          className="logout-btn"
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 15px',
            background: 'rgba(249, 4, 4, 0.2)',
            color: '#fe9d9dff',
            textDecoration: 'none',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            fontWeight: '500',
            border: 'none',
            cursor: 'pointer',
            width: 'auto',
            maxWidth: '120px',
            margin: '0 auto'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(239, 68, 68, 0.3)';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(239, 68, 68, 0.2)';
            e.target.style.color = '#fca5a5';
          }}
        >
          <FontAwesomeIcon icon={faSignOutAlt} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default InstructorSidebar;