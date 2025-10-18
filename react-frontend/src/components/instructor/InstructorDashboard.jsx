import React, { useState } from 'react';
import InstructorSidebar from '../common/InstructorSidebar.jsx';
import InstructorHeader from '../common/InstructorHeader.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCalendarAlt, faClock, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import '../../styles/InstructorDashboard.css';

const InstructorDashboard = () => {
  // Mock instructor data - in a real app, this would come from props or API
  const instructorData = {
    name: 'Dr. Name Instructor',
    image: '/images/tiger.png',
    facultyId: '1000234512'
  };

  // Mock schedule data - in a real app, this would come from API
  const todaySchedule = [
    { time: '8:00 AM - 10:00 AM', subject: 'Data Structures', room: 'ComLab 1', course: 'BSIT 2A' },
    { time: '10:30 AM - 12:30 PM', subject: 'Algorithms', room: 'ComLab 2', course: 'BSIT 3A' },
    { time: '1:00 PM - 3:00 PM', subject: 'Database Systems', room: 'ComLab 3', course: 'BSIT 2B' }
  ];

  const [selectedDate] = useState(new Date());

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden'
    }}>
      <InstructorSidebar />
      <main style={{flex: 1, background: 'linear-gradient(to right, #0f2c63 0%, #f97316 100%)', overflowY: 'auto'}}>
        <InstructorHeader />

        <div style={{padding: '30px', background: 'linear-gradient(to right, #0f2c63 0%, #f97316 100%)', minHeight: 'calc(100vh - 80px)', overflowY: 'auto'}}>
          <div style={{background: '#ffffffff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', marginBottom: '30px', borderLeft: '5px solid #f97316'}}>
            <h2 style={{color: '#1e293b', fontSize: '28px', fontWeight: '700', marginBottom: '8px'}}>Welcome to the Instructor Dashboard</h2>
            <p style={{color: '#64748b', fontSize: '16px', margin: '0'}}>View your class schedules</p>
          </div>

          {/* Instructor Profile Section */}
          <div style={{background: '#ffffffff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', marginBottom: '30px', borderLeft: '5px solid #f97316'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '25px'}}>
              <div style={{width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', border: '4px solid #f97316', boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)'}}>
                <img
                  src={instructorData.image}
                  alt={instructorData.name}
                  style={{width: '100%', height: '100%', objectFit: 'cover'}}
                />
              </div>
              <div>
                <h1 style={{color: '#1e293b', fontSize: '32px', fontWeight: '700', marginBottom: '5px'}}>{instructorData.name}</h1>
                <p style={{color: '#64748b', fontSize: '14px'}}>Faculty ID: {instructorData.facultyId}</p>
              </div>
            </div>
          </div>

          {/* Today's Schedule Section */}
          <div style={{background: '#ffffffff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', borderLeft: '5px solid #f97316'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px'}}>
              <FontAwesomeIcon icon={faCalendarAlt} style={{color: '#f97316', fontSize: '24px'}} />
              <h3 style={{color: '#1e293b', fontSize: '24px', fontWeight: '600', margin: '0'}}>Today's Schedule</h3>
              <span style={{color: '#64748b', fontSize: '16px', marginLeft: 'auto'}}>
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            {todaySchedule.length > 0 ? (
              <div style={{display: 'grid', gap: '20px'}}>
                {todaySchedule.map((schedule, index) => (
                  <div key={index} style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                    padding: '20px',
                    borderRadius: '12px',
                    borderLeft: '4px solid #f97316',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px'}}>
                      <FontAwesomeIcon icon={faClock} style={{color: '#f97316', fontSize: '16px'}} />
                      <span style={{color: '#1e293b', fontSize: '16px', fontWeight: '600'}}>{schedule.time}</span>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px'}}>
                      <FontAwesomeIcon icon={faUser} style={{color: '#64748b', fontSize: '14px'}} />
                      <span style={{color: '#374151', fontSize: '16px', fontWeight: '500'}}>{schedule.subject}</span>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px'}}>
                      <FontAwesomeIcon icon={faMapMarkerAlt} style={{color: '#64748b', fontSize: '14px'}} />
                      <span style={{color: '#374151', fontSize: '14px'}}>{schedule.room} • {schedule.course}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>
                <FontAwesomeIcon icon={faCalendarAlt} style={{fontSize: '48px', marginBottom: '15px', opacity: '0.5'}} />
                <p style={{fontSize: '18px', margin: '0'}}>No classes scheduled for today</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default InstructorDashboard;