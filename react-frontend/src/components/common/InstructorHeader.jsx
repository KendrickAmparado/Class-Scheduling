import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faSearch } from '@fortawesome/free-solid-svg-icons';

const InstructorHeader = () => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { userEmail } = useContext(AuthContext);
  const [search, setSearch] = useState('');

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
      background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 50%, #f97316 100%)',
      padding: '24px 40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
      position: 'fixed',
      top: 0,
      left: '200px',
      right: 0,
      width: 'calc(100% - 200px)',
      zIndex: 999,
      boxSizing: 'border-box',
      minHeight: '90px',
    }}>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="header-left" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
        </div>

        <div className="header-center" style={{
          flex: 1,
          maxWidth: '800px',
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
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
                fontSize: '16px',
                zIndex: 2,
              }}
            />
            <input
              type="text"
              placeholder="Search schedules, instructors, rooms..."
              style={{
                width: '100%',
                padding: '14px 50px',
                border: '2px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '12px',
                fontSize: '15px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                fontWeight: '500',
              }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const q = search.trim();
                  if (q) navigate(`/instructor/reports?q=${encodeURIComponent(q)}`);
                }
              }}
              onFocus={(e) => {
                e.target.style.outline = 'none';
                e.target.style.borderColor = 'rgba(249, 115, 22, 0.6)';
                e.target.style.background = 'white';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                e.target.style.background = 'rgba(255, 255, 255, 0.95)';
                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
            />
          </div>
        </div>

        <div className="header-right" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div
            className="notification-icon"
            onClick={toggleNotifications}
            style={{
              position: 'relative',
              cursor: 'pointer',
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <FontAwesomeIcon
              icon={faBell}
              style={{
                fontSize: '20px',
                color: '#ffffff'
              }}
            />
            {unreadCount > 0 && (
              <span
                className="notification-badge"
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '2px 5px',
                  borderRadius: '8px',
                  minWidth: '16px',
                  textAlign: 'center',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>

          <div className="header-logos" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 14px',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            backdropFilter: 'blur(8px)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
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
                padding: '3px',
                opacity: 0.98,
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
                padding: '3px',
                opacity: 0.98,
              }}
            />
          </div>
        </div>
      </div>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div
          className="notification-dropdown"
          style={{
            position: 'absolute',
            top: '100px',
            right: '40px',
            width: '380px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 6px 24px rgba(0, 0, 0, 0.2)',
            zIndex: 1001,
            maxHeight: '450px',
            overflow: 'hidden',
            border: '2px solid rgba(15, 44, 99, 0.15)',
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