import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';
import SchedulePopup from './SchedulePopup.jsx';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarPlus,
  faUsers,
  faExclamationTriangle,
  faClipboardList,
  faDoorOpen,
  faCheckCircle,
  faTimesCircle,
} from '@fortawesome/free-solid-svg-icons';

const AdminDashboard = () => {
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [roomStatus, setRoomStatus] = useState([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/admin/alerts');
        setAlerts(res.data.alerts);
      } catch (err) {
        console.error('Failed to load alerts', err);
      }
    };
    fetchAlerts();
  }, []);

  useEffect(() => {
    const fetchRoomStatus = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/rooms');
        setRoomStatus(res.data.rooms);
      } catch (err) {
        console.error('Failed to load room status', err);
      }
    };
    fetchRoomStatus();
  }, []);

  const quickActions = [
    {
      title: 'Create Schedule',
      icon: faCalendarPlus,
      action: () => setShowSchedulePopup(true),
      gradient: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
    },
    {
      title: 'Manage Faculty',
      icon: faUsers,
      link: '/admin/faculty-management',
      gradient: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
    },
    {
      title: 'Room Management',
      icon: faClipboardList,
      link: '/admin/room-management',
      gradient: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
    },
  ];

  const handleScheduleSubmit = async (scheduleData) => {
    try {
      const res = await axios.post('http://localhost:5000/api/schedule/create', scheduleData);
      if (res.data.success) {
        alert('✅ Schedule created successfully!');
        setShowSchedulePopup(false);
      } else {
        alert('⚠️ Failed to create schedule: ' + res.data.message);
      }
    } catch (err) {
      console.error('Error saving schedule:', err);
      alert('❌ Server error while saving schedule.');
    }
  };

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

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '28px',
              marginBottom: '36px',
            }}
          >
            {quickActions.map((action, index) =>
              action.link ? (
                <Link
                  key={index}
                  to={action.link}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '18px',
                    padding: '42px 36px',
                    background: action.gradient,
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '21px',
                    fontWeight: '700',
                    boxShadow: '0 8px 32px rgba(15,44,99,0.18)',
                    minHeight: '130px',
                    textDecoration: 'none',
                    transition: 'transform 0.18s cubic-bezier(.32,2,.55,.27)',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = '')}
                >
                  <FontAwesomeIcon icon={action.icon} style={{ fontSize: 32 }} />
                  <span>{action.title}</span>
                </Link>
              ) : (
                <button
                  key={index}
                  onClick={action.action}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '18px',
                    padding: '42px 36px',
                    background: action.gradient,
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '21px',
                    fontWeight: '700',
                    minHeight: '130px',
                    width: '100%',
                    boxShadow: '0 8px 32px rgba(15,44,99,0.18)',
                    transition: 'transform 0.18s cubic-bezier(.32,2,.55,.27)',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = '')}
                >
                  <FontAwesomeIcon icon={action.icon} style={{ fontSize: 32 }} />
                  <span>{action.title}</span>
                </button>
              )
            )}
          </div>

          <div
            style={{
              background: 'linear-gradient(135deg, #f97316 20%, #f7a66bff 100%)',
              padding: '28px 28px 24px 28px',
              borderRadius: '18px',
              boxShadow: '0 4px 20px rgba(245, 158, 11, 0.11)',
              marginBottom: '36px',
              border: '1.5px solid #f59e0b',
            }}
          >
            <h3
              style={{
                color: '#90231a',
                fontSize: '19px',
                fontWeight: '700',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#dc2626', fontSize: 20 }} />
              System Alerts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {alerts.length === 0 && <p style={{ color: '#374151' }}>No alerts at this time.</p>}
              {alerts.map((alert) => (
                <Link
                  to={alert.link || '#'}
                  key={alert.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '16px 22px',
                    background: 'rgba(255,255,255,0.96)',
                    borderRadius: '12px',
                    borderLeft: '4px solid #dc2626',
                    fontWeight: 500,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                    color: '#1f2937',
                    textDecoration: 'none',
                    cursor: alert.link ? 'pointer' : 'default',
                    transition: 'transform 0.15s ease-in-out',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = 'translateX(2px)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = '')}
                >
                  {renderAlertIcon(alert.type)}
                  <span style={{ fontSize: '15px', lineHeight: 1.7 }}>{alert.message}</span>
                </Link>
              ))}
            </div>
          </div>

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

        {showSchedulePopup && (
          <SchedulePopup onClose={() => setShowSchedulePopup(false)} onSubmit={handleScheduleSubmit} />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
