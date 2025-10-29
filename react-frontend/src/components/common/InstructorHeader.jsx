import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faSearch } from '@fortawesome/free-solid-svg-icons';

const InstructorHeader = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { userEmail } = useContext(AuthContext);

  const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/instructor/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        // normalize to component shape
        const mapped = data.notifications.map((n) => ({
          id: n._id,
          title: n.title,
          message: n.message,
          time: new Date(n.createdAt).toLocaleString(),
          read: n.read,
        }));
        setNotifications(mapped);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch notifications', e);
    }
  };

  useEffect(() => {
    if (userEmail) {
      fetchNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${apiBase}/api/instructor/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to mark as read', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${apiBase}/api/instructor/notifications/read-all`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to mark all as read', e);
    }
  };

  const unreadCount = notifications.filter(notification => !notification.read).length;
  return (
    <header className="top-header" style={{
      background: 'linear-gradient(to right, #0f2c63 0%, #f97316 100%)',
      padding: '15px 25px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div className="header-left" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
      </div>

      <div className="header-center" style={{
        flex: 1,
        maxWidth: '700px',
        margin: '0 30px'
      }}>
        <div className="search-container" style={{
          position: 'relative',
          width: '100%'
        }}>
          <FontAwesomeIcon
            icon={faSearch}
            style={{
              position: 'absolute',
              left: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              fontSize: '16px'
            }}
          />
          <input
            type="text"
            placeholder="Search schedules, instructors, rooms..."
            style={{
              width: '100%',
              padding: '12px 45px',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              background: '#f8fafc',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.outline = 'none';
              e.target.style.background = 'white';
              e.target.style.boxShadow = '0 0 0 3px rgba(15, 44, 99, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.background = '#f8fafc';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      <div className="header-right" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '25px'
      }}>
        <div
          className="notification-icon"
          onClick={toggleNotifications}
          style={{
            position: 'relative',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#979898';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
          }}
        >
          <FontAwesomeIcon
            icon={faBell}
            style={{
              fontSize: '18px',
              color: '#ffffff'
            }}
          />
          {unreadCount > 0 && (
            <span
              className="notification-badge"
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                background: '#ef4444',
                color: 'white',
                fontSize: '12px',
                padding: '2px 6px',
                borderRadius: '10px',
                minWidth: '18px',
                textAlign: 'center'
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>

        <div className="header-logos" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px'
        }}>
          <img
            src="/images/COT-LOGO_T.png"
            alt="COT Logo"
            className="header-logo"
            style={{
              width: '60px',
              height: '60px',
              objectFit: 'contain',
              borderRadius: '8px',
              padding: '4px'
            }}
          />
          <img
            src="/images/buksuu.png"
            alt="Buksu Logo"
            className="header-logo"
            style={{
              width: '60px',
              height: '60px',
              objectFit: 'contain',
              borderRadius: '8px',
              padding: '4px'
            }}
          />
        </div>
      </div>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div
          className="notification-dropdown"
          style={{
            position: 'absolute',
            top: '70px',
            right: '20px',
            width: '350px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            zIndex: 1000,
            maxHeight: '400px',
            overflow: 'hidden'
          }}
        >
          <div
            className="notification-header"
            style={{
              padding: '15px 20px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <h4 style={{ margin: 0, color: '#1f2937', fontSize: '16px' }}>
              Notifications
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: '#0f2c63',
                  color: 'white',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div
            className="notification-list"
            style={{
              maxHeight: '300px',
              overflowY: 'auto'
            }}
          >
            {notifications.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                No notifications
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                  style={{
                    padding: '15px 20px',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    background: notification.read ? 'white' : '#f0f9ff',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = notification.read ? 'white' : '#f0f9ff';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h5 style={{
                        margin: '0 0 5px 0',
                        color: '#1f2937',
                        fontSize: '14px',
                        fontWeight: notification.read ? 'normal' : '600'
                      }}>
                        {notification.title}
                      </h5>
                      <p style={{
                        margin: '0 0 5px 0',
                        color: '#6b7280',
                        fontSize: '13px',
                        lineHeight: '1.4'
                      }}>
                        {notification.message}
                      </p>
                      <span style={{
                        color: '#9ca3af',
                        fontSize: '12px'
                      }}>
                        {notification.time}
                      </span>
                    </div>
                    {!notification.read && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: '#0f2c63',
                        borderRadius: '50%',
                        flexShrink: 0,
                        marginLeft: '10px'
                      }}></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </header>
  );
};

export default InstructorHeader;