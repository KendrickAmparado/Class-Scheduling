import React, { useState } from 'react';
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
  faDoorOpen
} from '@fortawesome/free-solid-svg-icons';

const AdminDashboard = () => {
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);

  const quickActions = [
    {
      title: 'Create Schedule',
      icon: faCalendarPlus,
      action: () => setShowSchedulePopup(true),
      gradient: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)'
    },
    {
      title: 'Manage Faculty',
      icon: faUsers,
      link: '/admin/faculty-management',
      gradient: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)'
    },
    {
      title: 'Room Request',
      icon: faClipboardList,
      link: '/admin/room-management',
      gradient: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)'
    }
  ];

  const alerts = [
    'Room 301 has a scheduling conflict for Monday 10:00 AM',
    'Prof. Rayos needs to update availability for next week',
    'New instructor registration pending approval'
  ];

  const roomStatus = [
    { room: 'Computer Laboratory # 1', area: 'Finance Building - 3rd Floor', status: 'available' },
    { room: 'Computer Laboratory # 2', area: 'Finance Building - 3rd Floor', status: 'occupied' },
    { room: 'Computer Laboratory # 3', area: 'Finance Building - 3rd Floor', status: 'maintenance' },
    { room: 'Computer Laboratory # 4', area: 'Finance Building - 3rd Floor', status: 'available' },
    { room: 'Computer Laboratory # 5', area: 'Finance Building - 3rd Floor', status: 'occupied' },
    { room: 'Computer Laboratory # 6', area: 'Finance Building - 3rd Floor', status: 'occupied' },
    { room: 'Computer Laboratory # 7', area: 'Finance Building - 3rd Floor', status: 'maintenance' },
    { room: 'Computer Laboratory # 8', area: 'High School Building - 1st Floor', status: 'available' },
    { room: 'Computer Laboratory # 9', area: 'High School Building - 1st Floor', status: 'occupied' },
    { room: 'Computer Laboratory # 10', area: 'High School Building - 1st Floor', status: 'occupied' },
    { room: 'Computer Laboratory # 11', area: 'Finance Building - 3rd Floor', status: 'available' },
    { room: 'Computer Laboratory # 12', area: 'Finance Building - 3rd Floor', status: 'maintenance' }
  ];

  // Save schedule to backend
  const handleScheduleSubmit = async (scheduleData) => {
    try {
      const res = await axios.post("http://localhost:5000/api/schedule/create", scheduleData);
      if (res.data.success) {
        alert("✅ Schedule created successfully!");
        setShowSchedulePopup(false);
      } else {
        alert("⚠️ Failed to create schedule: " + res.data.message);
      }
    } catch (err) {
      console.error("Error saving schedule:", err);
      alert("❌ Server error while saving schedule.");
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <Header title="Admin Dashboard" />
        <div className="dashboard-content">

          {/* Welcome Card */}
          <div className="welcome-section">
            <h2>Welcome to the Admin Dashboard</h2>
            <p>Manage your class scheduling system efficiently</p>
          </div>

          {/* Quick Actions */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '28px',
              marginBottom: '36px'
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
                    transition: 'transform 0.18s cubic-bezier(.32,2,.55,.27)'
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'}
                  onMouseOut={e => e.currentTarget.style.transform = ''}
                >
                  <FontAwesomeIcon icon={action.icon} style={{fontSize: 32}}/>
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
                    transition: 'transform 0.18s cubic-bezier(.32,2,.55,.27)'
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'}
                  onMouseOut={e => e.currentTarget.style.transform = ''}
                >
                  <FontAwesomeIcon icon={action.icon} style={{fontSize: 32}} />
                  <span>{action.title}</span>
                </button>
              )
            )}
          </div>

          {/* Alerts */}
          <div
            style={{
              background: 'linear-gradient(135deg, #f97316 20%, #f7a66bff 100%)',
              padding: '28px 28px 24px 28px',
              borderRadius: '18px',
              boxShadow: '0 4px 20px rgba(245, 158, 11, 0.11)',
              marginBottom: '36px',
              border: '1.5px solid #f59e0b'
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
                gap: '14px'
              }}
            >
              <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#dc2626', fontSize: 20 }} />
              System Alerts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {alerts.map((alert, index) => (
                <div
                  key={index}
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
                    color: '#1f2937'
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateX(2px)'}
                  onMouseOut={e => e.currentTarget.style.transform = ''}
                >
                  <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#dc2626', fontSize: '18px', marginTop: '2px' }} />
                  <span style={{ fontSize: '15px', lineHeight: 1.7 }}>{alert}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Room Status Overview */}
          <div style={{
            background: '#fff',
            padding: '30px',
            borderRadius: '18px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            borderLeft: '5px solid #f97316'
          }}>
            <h3 style={{
              color: '#1e293b',
              fontSize: '22px',
              fontWeight: '700',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <FontAwesomeIcon icon={faDoorOpen} />
              Room Status Overview
            </h3>
            <div style={{
              overflowX: 'auto',
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.09)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', fontSize: '15px', borderRadius: '12px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)' }}>
                    <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: '700', color: '#efefef', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Room</th>
                    <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: '700', color: '#efefef', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Area/Location</th>
                    <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: '700', color: '#efefef', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {roomStatus.map((room, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '15px 20px', color: '#374151' }}>{room.room}</td>
                      <td style={{ padding: '15px 20px', color: '#374151' }}>{room.area}</td>
                      <td style={{ padding: '15px 20px' }}>
                        <span style={{
                          padding: '6px 14px',
                          borderRadius: '18px',
                          fontSize: '12px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.7px',
                          backgroundColor: room.status === 'available' ? '#dcfce7' :
                            room.status === 'occupied' ? '#fee2e2' : '#fef3c7',
                          color: room.status === 'available' ? '#16a34a' :
                            room.status === 'occupied' ? '#dc2626' : '#d97706'
                        }}>
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

        {/* Schedule Popup */}
        {showSchedulePopup && (
          <SchedulePopup
            onClose={() => setShowSchedulePopup(false)}
            onSubmit={handleScheduleSubmit}
          />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
