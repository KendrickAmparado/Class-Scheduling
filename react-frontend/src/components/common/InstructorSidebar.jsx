import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faSignOutAlt,
  faChartBar,
  faCog,
  faBell
} from '@fortawesome/free-solid-svg-icons';

const InstructorSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/instructor/dashboard', icon: faHome, label: 'Dashboard' },
    { path: '/instructor/notifications', icon: faBell, label: 'Notifications' },
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
      zIndex: 1000,
    }}>
      <nav className="sidebar-menu" style={{
        flex: 1,
        padding: '60px 0 10px 0'
      }}>
        {menuItems.map((item, index) => (
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
              margin: '2px 15px',
              borderRadius: '10px',
              fontWeight: '500',
              background: location.pathname === item.path ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              boxShadow: location.pathname === item.path ? 'inset 4px 0 0 #ffffff, 0 2px 8px rgba(0, 0, 0, 0.1)' : 'none',
              minHeight: '60px',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== item.path) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateX(8px) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              } else {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = 'inset 4px 0 0 #ffffff, 0 4px 12px rgba(0, 0, 0, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== item.path) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                e.currentTarget.style.transform = 'translateX(0) scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              } else {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'inset 4px 0 0 #ffffff, 0 2px 8px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            <FontAwesomeIcon
              icon={item.icon}
              style={{
                fontSize: '18px',
                width: '20px',
              }}
            />
            <span style={{ fontWeight: location.pathname === item.path ? '600' : '500', fontSize: '13px' }}>{item.label}</span>
            {location.pathname === item.path && (
              <div style={{
                position: 'absolute',
                bottom: '8px',
                width: '6px',
                height: '6px',
                background: '#ffffff',
                borderRadius: '50%',
              }} />
            )}
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
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#fca5a5',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '500',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            cursor: 'pointer',
            width: 'auto',
            maxWidth: '120px',
            margin: '0 auto',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.35)';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.color = '#fca5a5';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1)';
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