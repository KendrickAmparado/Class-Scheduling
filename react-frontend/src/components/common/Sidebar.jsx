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
      zIndex: 1000,
    }}>
      <div className="admin-profile" style={{
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        background: 'rgba(255, 255, 255, 0.1)',
        margin: '20px',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      >
        <div className="admin-avatar" style={{
          width: '50px',
          height: '50px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid rgba(255, 255, 255, 0.2)'
        }}>
          <FontAwesomeIcon 
            icon={faUserShield} 
            style={{
              fontSize: '24px',
              color: 'white',
            }}
          />
        </div>
        <div className="admin-info">
          <h4 style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '4px',
            margin: 0,
          }}>Administrator</h4>
          <p style={{
            fontSize: '14px',
            opacity: '0.8',
            margin: 0,
          }}>System Admin</p>
        </div>
      </div>
      
      <nav className="sidebar-menu" style={{
        flex: 1,
        padding: '20px 0'
      }}>
        {menuItems.map((item, index) => (
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
              margin: '2px 15px',
              borderRadius: '10px',
              fontWeight: '500',
              background: location.pathname === item.path ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              boxShadow: location.pathname === item.path ? 'inset 4px 0 0 #f97316, 0 2px 8px rgba(0, 0, 0, 0.1)' : 'none',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== item.path) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateX(8px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              } else {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = 'inset 4px 0 0 #f97316, 0 4px 12px rgba(0, 0, 0, 0.15)';
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
                e.currentTarget.style.boxShadow = 'inset 4px 0 0 #f97316, 0 2px 8px rgba(0, 0, 0, 0.1)';
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
            <span style={{ fontWeight: location.pathname === item.path ? '600' : '500' }}>{item.label}</span>
            {location.pathname === item.path && (
              <div style={{
                position: 'absolute',
                right: '15px',
                width: '6px',
                height: '6px',
                background: '#f97316',
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
            gap: '12px',
            padding: '15px 20px',
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#fca5a5',
            textDecoration: 'none',
            borderRadius: '10px',
            fontWeight: '500',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            cursor: 'pointer',
            width: '100%',
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

export default Sidebar;
