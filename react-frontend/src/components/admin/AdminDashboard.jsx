import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';
import SchedulePopup from './SchedulePopup.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarPlus,
  faUsers,
  faDoorOpen,
  faExclamationTriangle,
  faClipboardList
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

  const handleScheduleSubmit = (scheduleData) => {
    setShowSchedulePopup(false);
    alert('Schedule created successfully!');
  };

  return (
    <div style={{display: 'flex', height: '100vh', overflow: 'hidden'}}>
      <Sidebar />
      <main style={{flex: 1, background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', overflowY: 'auto'}}>
        <Header title="Admin Dashboard" />

        <div style={{padding: '30px', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', minHeight: 'calc(100vh - 80px)', overflowY: 'auto'}}>
          <div style={{background: '#dedede', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', marginBottom: '30px', borderLeft: '5px solid #0f2c63'}}>
            <h2 style={{color: '#1e293b', fontSize: '28px', fontWeight: '700', marginBottom: '8px'}}>Welcome to the Admin Dashboard</h2>
            <p style={{color: '#64748b', fontSize: '16px', margin: '0'}}>Manage your class scheduling system efficiently</p>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px', marginBottom: '30px'}}>
            {quickActions.map((action, index) => (
              action.link ? (
                <Link
                  key={index}
                  to={action.link}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '15px',
                    padding: '40px 35px',
                    background: action.gradient,
                    color: 'white',
                    border: 'none',
                    borderRadius: '18px',
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 6px 20px rgba(15, 44, 99, 0.3)',
                    minHeight: '120px',
                    textDecoration: 'none'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-5px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  <FontAwesomeIcon icon={action.icon} />
                  <span>{action.title}</span>
                </Link>
              ) : (
                <button
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '15px',
                    padding: '40px 35px',
                    background: action.gradient,
                    color: 'white',
                    border: 'none',
                    borderRadius: '18px',
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 6px 20px rgba(15, 44, 99, 0.3)',
                    minHeight: '120px',
                    width: '100%'
                  }}
                  onClick={action.action}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-5px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  <FontAwesomeIcon icon={action.icon} />
                  <span>{action.title}</span>
                </button>
              )
            ))}
          </div>

          <div style={{background: '#764F01', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', marginBottom: '30px', borderLeft: '5px solid #ef4444'}}>
            <h3 style={{color: '#FFAD0A', fontSize: '16px', fontWeight: '600', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px'}}>
              <FontAwesomeIcon icon={faExclamationTriangle} />
              System Alerts
            </h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
              {alerts.map((alert, index) => (
                <div key={index} style={{display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 15px', background: '#FFAD0A', borderRadius: '10px', borderLeft: '4px solid #ef4444', transition: 'all 0.3s ease'}}>
                  <FontAwesomeIcon icon={faExclamationTriangle} style={{color: '#060400', fontSize: '14px', marginTop: '2px'}} />
                  <span style={{color: '#7f1d1d', fontSize: '13px', lineHeight: '1.4'}}>{alert}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{background: '#dedede', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', borderLeft: '5px solid #f97316'}}>
            <h3 style={{color: '#1e293b', fontSize: '20px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px'}}>
              <FontAwesomeIcon icon={faDoorOpen} />
              Room Status Overview
            </h3>
            <div style={{overflowX: 'auto', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'}}>
              <table style={{width: '100%', borderCollapse: 'collapse', background: '#dedede', fontSize: '14px'}}>
                <thead>
                  <tr style={{background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)'}}>
                    <th style={{padding: '15px 20px', textAlign: 'left', fontWeight: '600', color: '#dedede', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Room</th>
                    <th style={{padding: '15px 20px', textAlign: 'left', fontWeight: '600', color: '#dedede', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Area/Location</th>
                    <th style={{padding: '15px 20px', textAlign: 'left', fontWeight: '600', color: '#dedede', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {roomStatus.map((room, index) => (
                    <tr key={index} style={{borderBottom: '1px solid #e2e8f0'}}>
                      <td style={{padding: '15px 20px', color: '#374151'}}>{room.room}</td>
                      <td style={{padding: '15px 20px', color: '#374151'}}>{room.area}</td>
                      <td style={{padding: '15px 20px'}}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
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