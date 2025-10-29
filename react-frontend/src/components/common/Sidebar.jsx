import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faCalendarAlt,
  faCalendarPlus,
  faUsers, 
  faDoorOpen, 
  faChartBar, 
  faCogs, 
  faSignOutAlt,
  faUserShield
} from '@fortawesome/free-solid-svg-icons';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/admin/dashboard', icon: faHome, label: 'Dashboard' },
    { path: '/admin/schedule-management', icon: faCalendarPlus, label: 'Schedule Management' }, // NEW
    { path: '/admin/manage-schedule', icon: faCalendarAlt, label: 'Section Management' },
    { path: '/admin/faculty-management', icon: faUsers, label: 'Faculty Management' },
    { path: '/admin/room-management', icon: faDoorOpen, label: 'Room Management' },
    { path: '/admin/reports', icon: faChartBar, label: 'Reports' },
    { path: '/admin/settings', icon: faCogs, label: 'Settings' }
  ];

  const handleLogout = () => {
    // Add logout logic here
    navigate('/login');
  };

  return (
    <aside className="sidebar" style={{
      width: '280px',
      background: 'linear-gradient(135deg, #0f2c63 50%, #ea580c 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
      zIndex: 1000
    }}>
      <div className="admin-profile" style={{
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        background: 'rgba(255, 255, 255, 0.1)',
        margin: '20px',
        borderRadius: '12px'
      }}>
        <div className="admin-avatar" style={{
          width: '50px',
          height: '50px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <FontAwesomeIcon 
            icon={faUserShield} 
            style={{
              fontSize: '24px',
              color: 'white'
            }}
          />
        </div>
        <div className="admin-info">
          <h4 style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '4px',
            margin: 0
          }}>Administrator</h4>
          <p style={{
            fontSize: '14px',
            opacity: '0.8',
            margin: 0
          }}>System Admin</p>
        </div>
      </div>
      
      <nav className="sidebar-menu" style={{
        flex: 1,
        padding: '20px 0'
      }}>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              padding: '15px 25px',
              color: location.pathname === item.path ? 'white' : 'rgba(255, 255, 255, 0.8)',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              margin: '2px 15px',
              borderRadius: '10px',
              fontWeight: '500',
              background: location.pathname === item.path ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              boxShadow: location.pathname === item.path ? 'inset 4px 0 0 #f97316' : 'none'
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
            gap: '12px',
            padding: '15px 20px',
            background: 'rgba(249, 4, 4, 0.2)',
            color: '#fe9d9dff',
            textDecoration: 'none',
            borderRadius: '10px',
            transition: 'all 0.3s ease',
            fontWeight: '500',
            border: 'none',
            cursor: 'pointer',
            width: '100%'
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

export default Sidebar;
