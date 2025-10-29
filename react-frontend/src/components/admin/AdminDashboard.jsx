import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClipboardList,
  faDoorOpen,
  faCheckCircle,
  faTimesCircle,
  faExclamationTriangle,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [roomStatus, setRoomStatus] = useState([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/admin/alerts');
        // Limit to the 3 most recent alerts
        setAlerts(res.data.alerts.slice(0, 3));
      } catch (err) {
        console.error('Failed to load alerts', err);
      }
    };

    const fetchRoomStatus = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/rooms');
        setRoomStatus(res.data.rooms);
      } catch (err) {
        console.error('Failed to load room status', err);
      }
    };

    // Initial fetch
    fetchAlerts();
    fetchRoomStatus();

    // Auto-refresh every 30 seconds
    const alertsInterval = setInterval(fetchAlerts, 30000);
    const roomsInterval = setInterval(fetchRoomStatus, 30000);

    return () => {
      clearInterval(alertsInterval);
      clearInterval(roomsInterval);
    };
  }, []);

  const renderAlertIcon = (type) => {
    switch (type) {
      case 'room-conflict':
        return <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#dc2626', fontSize: 18, marginTop: 2 }} />;
      case 'pending-approval':
        return <FontAwesomeIcon icon={faTimesCircle} style={{ color: '#b91c1c', fontSize: 18, marginTop: 2 }} />;
      case 'availability-update':
        return <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#059669', fontSize: 18, marginTop: 2 }} />;
      default:
        return <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#dc2626', fontSize: 18, marginTop: 2 }} />;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content" style={{ flex: 1, padding: '1rem' }}>
        <Header title="Admin Dashboard" />
        <div className="dashboard-content">
          <div className="welcome-section">
            <h2>Welcome to the Admin Dashboard</h2>
            <p>Manage your class scheduling system efficiently</p>
          </div>

          {/* Activity Log Section - Clickable */}
          <div
            onClick={() => navigate('/admin/activity-logs')}
            style={{
              background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
              padding: '28px 28px 24px 28px',
              borderRadius: '18px',
              boxShadow: '0 4px 20px rgba(15, 44, 99, 0.15)',
              marginBottom: '36px',
              border: '2px solid #1e40af',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(15, 44, 99, 0.25)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(15, 44, 99, 0.15)';
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
              }}
            >
              <h3
                style={{
                  color: '#ffffff',
                  fontSize: '19px',
                  fontWeight: '700',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <FontAwesomeIcon icon={faClipboardList} style={{ fontSize: 20 }} />
                Activity Log (Recent Activity)
              </h3>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                <span>View All</span>
                <FontAwesomeIcon icon={faArrowRight} />
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {alerts.length === 0 && (
                <p style={{ color: '#e0e7ff', margin: 0 }}>No recent activity.</p>
              )}
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '16px 22px',
                    background: 'rgba(255,255,255,0.95)',
                    borderRadius: '12px',
                    borderLeft: '4px solid #3b82f6',
                    fontWeight: 500,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    color: '#1f2937',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                    {renderAlertIcon(alert.type)}
                    <span style={{ fontSize: '15px', lineHeight: 1.7 }}>{alert.message}</span>
                  </div>
                  {alert.timestamp && (
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatTimestamp(alert.timestamp)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Room Status Overview */}
          <div
            style={{
              background: '#fff',
              padding: '30px',
              borderRadius: '18px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              borderLeft: '5px solid #f97316',
            }}
          >
            <h3
              style={{
                color: '#1e293b',
                fontSize: '22px',
                fontWeight: '700',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <FontAwesomeIcon icon={faDoorOpen} />
              Room Status Overview
            </h3>
            <div
              style={{
                overflowX: 'auto',
                borderRadius: '12px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.09)',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  background: '#fff',
                  fontSize: '15px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)' }}>
                    <th
                      style={{
                        padding: '15px 20px',
                        textAlign: 'left',
                        fontWeight: '700',
                        color: '#efefef',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Room
                    </th>
                    <th
                      style={{
                        padding: '15px 20px',
                        textAlign: 'left',
                        fontWeight: '700',
                        color: '#efefef',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Area/Location
                    </th>
                    <th
                      style={{
                        padding: '15px 20px',
                        textAlign: 'left',
                        fontWeight: '700',
                        color: '#efefef',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {roomStatus.map((room, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '15px 20px', color: '#374151' }}>{room.room}</td>
                      <td style={{ padding: '15px 20px', color: '#374151' }}>{room.area}</td>
                      <td style={{ padding: '15px 20px' }}>
                        <span
                          style={{
                            padding: '6px 14px',
                            borderRadius: '18px',
                            fontSize: '12px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.7px',
                            backgroundColor:
                              room.status === 'available'
                                ? '#dcfce7'
                                : room.status === 'occupied'
                                ? '#fee2e2'
                                : '#fef3c7',
                            color:
                              room.status === 'available'
                                ? '#16a34a'
                                : room.status === 'occupied'
                                ? '#dc2626'
                                : '#d97706',
                          }}
                        >
                          {room.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
