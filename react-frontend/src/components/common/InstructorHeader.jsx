import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faSearch, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

const InstructorHeader = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { userEmail } = useContext(AuthContext);
  const [search, setSearch] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const searchInputRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Auto-focus mobile search when opened
  useEffect(() => {
    if (showMobileSearch && mobileSearchRef.current) {
      setTimeout(() => {
        mobileSearchRef.current?.focus();
      }, 100);
    }
  }, [showMobileSearch]);

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

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
  };

  const clearSearch = (e) => {
    e.stopPropagation();
    setSearch('');
    // Focus the appropriate input based on mobile/desktop
    if (!isMobile && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (isMobile && showMobileSearch && mobileSearchRef.current) {
      mobileSearchRef.current.focus();
    }
  };

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

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      const q = search.trim();
      if (q) {
        navigate(`/instructor/reports?q=${encodeURIComponent(q)}`);
        if (isMobile) {
          setShowMobileSearch(false);
        }
      }
    } else if (e.key === 'Escape' && isMobile) {
      setShowMobileSearch(false);
    }
  };

  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  return (
    <header className="top-header" style={{
      background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 50%, #f97316 100%)',
      padding: isMobile ? '18px 20px' : '26px 40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 6px 24px rgba(0, 0, 0, 0.18)',
      borderBottom: '3px solid rgba(255, 255, 255, 0.25)',
      position: 'fixed',
      top: 0,
      left: isMobile ? '0' : '200px',
      right: 0,
      width: isMobile ? '100%' : 'calc(100% - 200px)',
      zIndex: 999,
      boxSizing: 'border-box',
      minHeight: isMobile ? '72px' : '92px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        display: 'flex', 
        width: '100%', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        gap: '16px'
      }}>
        <div className="header-left" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexShrink: 0
        }}>
          {/* Mobile Hamburger Menu Button */}
          {isMobile && (
            <button
              onClick={onMenuClick}
              aria-label="Toggle menu"
              style={{
                background: 'rgba(255, 255, 255, 0.18)',
                border: '2px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '12px',
                width: '46px',
                height: '46px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.28)';
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
            >
              <FontAwesomeIcon icon={faBars} style={{ fontSize: '20px' }} />
            </button>
          )}
        </div>

        {/* Desktop Search */}
        {!isMobile && (
          <div className="header-center" style={{
            flex: 1,
            maxWidth: '700px',
            margin: '0 24px',
            transition: 'opacity 0.3s ease'
          }}>
            <div className="search-container" style={{
              position: 'relative',
              width: '100%',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              <FontAwesomeIcon
                icon={faSearch}
                style={{
                  position: 'absolute',
                  left: '18px',
                  top: '50%',
                  transform: isSearchFocused ? 'translateY(-50%) scale(1.1)' : 'translateY(-50%) scale(1)',
                  color: isSearchFocused ? '#f97316' : '#64748b',
                  fontSize: '16px',
                  zIndex: 2,
                  transition: 'color 0.2s ease, transform 0.2s ease',
                }}
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search schedules, instructors, rooms..."
                style={{
                  width: '100%',
                  padding: '15px 50px 15px 52px',
                  border: `2px solid ${isSearchFocused ? 'rgba(249, 115, 22, 0.5)' : 'rgba(255, 255, 255, 0.3)'}`,
                  borderRadius: '14px',
                  fontSize: '15px',
                  background: isSearchFocused ? 'white' : 'rgba(255, 255, 255, 0.96)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: isSearchFocused 
                    ? '0 6px 20px rgba(249, 115, 22, 0.2)' 
                    : '0 3px 12px rgba(0, 0, 0, 0.1)',
                  fontWeight: '500',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  outline: 'none',
                }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
              />
              {search && (
                <button
                  onClick={clearSearch}
                  aria-label="Clear search"
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(100, 116, 139, 0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748b',
                    transition: 'all 0.2s ease',
                    zIndex: 3,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(100, 116, 139, 0.1)';
                    e.currentTarget.style.color = '#64748b';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  }}
                >
                  <FontAwesomeIcon icon={faTimes} style={{ fontSize: '12px' }} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mobile Search Button */}
        {isMobile && !showMobileSearch && (
          <button
            onClick={() => setShowMobileSearch(true)}
            aria-label="Open search"
            style={{
              background: 'rgba(255, 255, 255, 0.18)',
              border: '2px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '12px',
              width: '46px',
              height: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.28)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <FontAwesomeIcon icon={faSearch} style={{ fontSize: '18px' }} />
          </button>
        )}

        <div className="header-right" style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '10px' : '16px',
          flexShrink: 0
        }}>
          <div
            ref={notificationRef}
            className="notification-icon"
            onClick={toggleNotifications}
            style={{
              position: 'relative',
              cursor: 'pointer',
              padding: isMobile ? '11px 13px' : '13px 15px',
              borderRadius: '12px',
              background: showNotifications ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.25)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: showNotifications 
                ? '0 4px 12px rgba(0, 0, 0, 0.15)' 
                : '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
            onMouseEnter={(e) => {
              if (!showNotifications) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.28)';
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (!showNotifications) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            <FontAwesomeIcon
              icon={faBell}
              style={{
                fontSize: isMobile ? '18px' : '20px',
                color: '#ffffff',
                transition: 'transform 0.2s ease',
                transform: showNotifications ? 'scale(1.1)' : 'scale(1)',
              }}
            />
            {unreadCount > 0 && (
              <span
                className="notification-badge"
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '3px 6px',
                  borderRadius: '10px',
                  minWidth: '18px',
                  textAlign: 'center',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                  animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>

          <div className="header-logos" style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '8px' : '12px',
            padding: isMobile ? '8px 12px' : '10px 16px',
            background: 'rgba(255, 255, 255, 0.18)',
            borderRadius: '14px',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
          }}
          >
            <img
              src="/images/COT-LOGO_T.png"
              alt="COT Logo"
              className="header-logo"
              style={{
                width: isMobile ? '42px' : '58px',
                height: isMobile ? '42px' : '58px',
                objectFit: 'contain',
                borderRadius: '8px',
                padding: '4px',
                opacity: 1,
                transition: 'transform 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            />
            <img
              src="/images/buksuu.png"
              alt="Buksu Logo"
              className="header-logo"
              style={{
                width: isMobile ? '42px' : '58px',
                height: isMobile ? '42px' : '58px',
                objectFit: 'contain',
                borderRadius: '8px',
                padding: '4px',
                opacity: 1,
                transition: 'transform 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            />
          </div>
        </div>
      </div>

      {/* Mobile Search Input */}
      {isMobile && showMobileSearch && (
        <div
          className="mobile-search-input"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 50%, #f97316 100%)',
            borderBottom: '3px solid rgba(255, 255, 255, 0.25)',
            display: 'block',
            zIndex: 1000,
            animation: 'slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <FontAwesomeIcon
                icon={faSearch}
                style={{
                  position: 'absolute',
                  left: '18px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#f97316',
                  fontSize: '16px',
                  zIndex: 2,
                }}
              />
              <input
                ref={mobileSearchRef}
                type="text"
                placeholder="Search schedules, instructors, rooms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                style={{
                  width: '100%',
                  padding: '14px 50px 14px 52px',
                  border: '2px solid rgba(249, 115, 22, 0.5)',
                  borderRadius: '14px',
                  fontSize: '16px',
                  background: 'white',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 6px 20px rgba(249, 115, 22, 0.2)',
                  fontWeight: '500',
                  outline: 'none',
                }}
              />
              {search && (
                <button
                  onClick={clearSearch}
                  aria-label="Clear search"
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '26px',
                    height: '26px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#ef4444',
                    transition: 'all 0.2s ease',
                    zIndex: 3,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  }}
                >
                  <FontAwesomeIcon icon={faTimes} style={{ fontSize: '12px' }} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowMobileSearch(false)}
              aria-label="Close search"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '10px',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <FontAwesomeIcon icon={faTimes} style={{ fontSize: '18px' }} />
            </button>
          </div>
        </div>
      )}

      {/* Notification Dropdown */}
      {showNotifications && (
        <div
          ref={notificationRef}
          className="notification-dropdown"
          style={{
            position: 'absolute',
            top: isMobile ? '72px' : '102px',
            right: isMobile ? '10px' : '40px',
            width: isMobile ? 'calc(100% - 20px)' : '400px',
            maxWidth: isMobile ? '400px' : '400px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
            zIndex: 1001,
            maxHeight: '500px',
            overflow: 'hidden',
            border: '2px solid rgba(15, 44, 99, 0.1)',
            animation: 'slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div
            className="notification-header"
            style={{
              padding: '18px 20px',
              borderBottom: '2px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
            }}
          >
            <h4 style={{ 
              margin: 0, 
              color: '#1f2937', 
              fontSize: '18px',
              fontWeight: '700'
            }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: '8px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '700',
                }}>
                  {unreadCount}
                </span>
              )}
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(15, 44, 99, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 44, 99, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 44, 99, 0.2)';
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div
            className="notification-list"
            style={{
              maxHeight: '420px',
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 transparent',
            }}
          >
            {notifications.length === 0 ? (
              <div style={{ 
                padding: '40px 20px', 
                textAlign: 'center', 
                color: '#6b7280',
                fontSize: '15px'
              }}>
                <FontAwesomeIcon 
                  icon={faBell} 
                  style={{ 
                    fontSize: '32px', 
                    color: '#cbd5e1', 
                    marginBottom: '12px',
                    opacity: 0.5
                  }} 
                />
                <div>No notifications</div>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    background: notification.read ? 'white' : '#f0f9ff',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.paddingLeft = '24px';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notification.read ? 'white' : '#f0f9ff';
                    e.currentTarget.style.paddingLeft = '20px';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <h5 style={{
                        margin: '0 0 6px 0',
                        color: '#1f2937',
                        fontSize: '15px',
                        fontWeight: notification.read ? '600' : '700',
                        lineHeight: '1.4'
                      }}>
                        {notification.title}
                      </h5>
                      <p style={{
                        margin: '0 0 8px 0',
                        color: '#6b7280',
                        fontSize: '14px',
                        lineHeight: '1.5'
                      }}>
                        {notification.message}
                      </p>
                      <span style={{
                        color: '#9ca3af',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {notification.time}
                      </span>
                    </div>
                    {!notification.read && (
                      <div style={{
                        width: '10px',
                        height: '10px',
                        background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
                        borderRadius: '50%',
                        flexShrink: 0,
                        marginTop: '4px',
                        boxShadow: '0 2px 4px rgba(15, 44, 99, 0.3)',
                      }}></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
        .notification-list::-webkit-scrollbar {
          width: 6px;
        }
        .notification-list::-webkit-scrollbar-track {
          background: transparent;
        }
        .notification-list::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .notification-list::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </header>
  );
};

export default InstructorHeader;