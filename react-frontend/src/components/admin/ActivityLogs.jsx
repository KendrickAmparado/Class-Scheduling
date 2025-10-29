import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faClipboardList,
  faCheckCircle,
  faTimesCircle,
  faExclamationTriangle,
  faSearch,
} from '@fortawesome/free-solid-svg-icons';

const ActivityLogs = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchActivityLogs();

    // Auto-refresh every 30 seconds
    const autoRefreshInterval = setInterval(fetchActivityLogs, 30000);

    return () => {
      clearInterval(autoRefreshInterval);
    };
  }, []);

  useEffect(() => {
    filterLogs();
  }, [alerts, searchQuery]);

  const fetchActivityLogs = async () => {
    setLoading(true);
    try {
      // Unified activity endpoint (admin alerts + instructor notifications)
      const res = await axios.get('http://localhost:5000/api/admin/activity');
      let activities = Array.isArray(res.data.activities) ? res.data.activities : [];
      // Fallback: legacy alerts endpoint if unified returns empty
      if (activities.length === 0) {
        const legacy = await axios.get('http://localhost:5000/api/admin/alerts');
        const legacyAlerts = Array.isArray(legacy.data.alerts) ? legacy.data.alerts : [];
        activities = legacyAlerts.map((a) => ({
          id: String(a._id || a.id || Math.random()),
          source: 'admin',
          type: a.type || 'alert',
          message: a.message,
          link: a.link || null,
          createdAt: a.createdAt || a.updatedAt || a.timestamp,
        }));
      }
      setAlerts(activities);
    } catch (err) {
      console.error('Failed to load activity logs', err);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let logs = [...alerts];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      logs = logs.filter(log =>
        String(log.message || '').toLowerCase().includes(q) ||
        String(log.type || '').toLowerCase().includes(q) ||
        String(log.source || '').toLowerCase().includes(q)
      );
    }

    setFilteredAlerts(logs);
  };

  const renderAlertIcon = (type, source) => {
    switch (type) {
      case 'room-conflict':
        return <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#dc2626', fontSize: 16 }} />;
      case 'pending-approval':
        return <FontAwesomeIcon icon={faTimesCircle} style={{ color: '#b91c1c', fontSize: 16 }} />;
      case 'availability-update':
        return <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#059669', fontSize: 16 }} />;
      case 'instructor-notification':
        return <FontAwesomeIcon icon={faClipboardList} style={{ color: '#4f46e5', fontSize: 16 }} />;
      default:
        return source === 'instructor'
          ? <FontAwesomeIcon icon={faClipboardList} style={{ color: '#4f46e5', fontSize: 16 }} />
          : <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#dc2626', fontSize: 16 }} />;
    }
  };

  const getAlertBadgeColor = (type, source) => {
    switch (type) {
      case 'availability-update':
        return { bg: '#dcfce7', color: '#16a34a' };
      case 'pending-approval':
        return { bg: '#fee2e2', color: '#dc2626' };
      case 'room-conflict':
        return { bg: '#fef3c7', color: '#d97706' };
      case 'instructor-notification':
        return { bg: '#e0e7ff', color: '#4f46e5' };
      default:
        return source === 'instructor'
          ? { bg: '#e0e7ff', color: '#4f46e5' }
          : { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  const formatTimestamp = (ts) => {
    const date = ts ? new Date(ts) : null;
    if (!date || isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatAlertType = (type) => {
    return type.replace(/-/g, ' ').toUpperCase();
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <main className="main-content" style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
        <Header title="Activity Logs" />
        <div className="dashboard-content">
          {/* Back Button */}
          <button
            onClick={() => navigate('/admin/dashboard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 20px',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              color: '#374151',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '20px',
              fontSize: '14px',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to Dashboard</span>
          </button>

          {/* Header Section - WHITE TEXT */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <FontAwesomeIcon icon={faClipboardList} style={{ fontSize: 28, color: '#ffffff' }} />
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#ffffff' }}>
                Activity Logs
              </h2>
            </div>
            <p style={{ margin: 0, color: '#ffffff', fontSize: '14px' }}>
              View all system activities and changes
            </p>
          </div>

          {/* Search */}
          <div
            style={{
              background: '#fff',
              padding: '16px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              marginBottom: '20px',
            }}
          >
            <div style={{ position: 'relative' }}>
              <FontAwesomeIcon
                icon={faSearch}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                  fontSize: '13px',
                }}
              />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 10px 10px 36px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Activity Logs Table */}
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              overflow: 'hidden',
            }}
          >
            {/* Table Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '2px solid #f1f5f9',
                background: '#fafafa',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                All Activities
              </h3>
              <span
                style={{
                  background: '#e0e7ff',
                  color: '#4f46e5',
                  padding: '4px 12px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                }}
              >
                {filteredAlerts.length} {filteredAlerts.length === 1 ? 'Activity' : 'Activities'}
              </span>
            </div>

            {/* Scrollable Table Container */}
            <div
              style={{
                maxHeight: 'calc(100vh - 380px)',
                overflowY: 'auto',
                overflowX: 'hidden',
              }}
            >
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '14px' }}>
                  Loading activity logs...
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <FontAwesomeIcon
                    icon={faClipboardList}
                    style={{ fontSize: 48, color: '#d1d5db', marginBottom: '12px' }}
                  />
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                    {searchQuery ? 'No matching activities found' : 'No activity logs available'}
                  </p>
                </div>
              ) : (
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '14px',
                  }}
                >
                  <thead style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1 }}>
                    <tr>
                      <th
                        style={{
                          padding: '12px 20px',
                          textAlign: 'left',
                          fontWeight: '700',
                          color: '#374151',
                          fontSize: '13px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          borderBottom: '2px solid #e5e7eb',
                          width: '100px',
                        }}
                      >
                        Type
                      </th>
                      <th
                        style={{
                          padding: '12px 20px',
                          textAlign: 'left',
                          fontWeight: '700',
                          color: '#374151',
                          fontSize: '13px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          borderBottom: '2px solid #e5e7eb',
                        }}
                      >
                        Activity
                      </th>
                      <th
                        style={{
                          padding: '12px 20px',
                          textAlign: 'left',
                          fontWeight: '700',
                          color: '#374151',
                          fontSize: '13px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          borderBottom: '2px solid #e5e7eb',
                          width: '180px',
                        }}
                      >
                        Date & Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlerts.map((alert, index) => {
                      const badgeColor = getAlertBadgeColor(alert.type, alert.source);
                      return (
                        <tr
                          key={alert.id || index}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background 0.2s ease',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = '#f9fafb';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  background: badgeColor.bg,
                                  padding: '6px',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {renderAlertIcon(alert.type, alert.source)}
                              </div>
                              <span
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '5px',
                                  fontSize: '11px',
                                  fontWeight: '700',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.3px',
                                  backgroundColor: badgeColor.bg,
                                  color: badgeColor.color,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {formatAlertType(alert.type || alert.source || 'activity').split(' ')[0]}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                            <p style={{ margin: 0, color: '#1f2937', lineHeight: 1.5, fontSize: '14px' }}>
                              {alert.message}
                            </p>
                          </td>
                          <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                            <span
                              style={{
                                color: '#6b7280',
                                fontWeight: '500',
                                fontSize: '13px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {formatTimestamp(alert.createdAt || alert.timestamp)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Custom Scrollbar Styling */}
        <style>{`
          .dashboard-content > div:last-child > div:last-child::-webkit-scrollbar {
            width: 8px;
          }
          .dashboard-content > div:last-child > div:last-child::-webkit-scrollbar-track {
            background: #f1f5f9;
          }
          .dashboard-content > div:last-child > div:last-child::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
          .dashboard-content > div:last-child > div:last-child::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}</style>
      </main>
    </div>
  );
};

export default ActivityLogs;
