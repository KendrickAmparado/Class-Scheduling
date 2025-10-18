import React from 'react';
import InstructorSidebar from '../common/InstructorSidebar.jsx';
import InstructorHeader from '../common/InstructorHeader.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faFileAlt, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

const InstructorReports = () => {
  // Mock data for the logged-in instructor's schedule
  const instructorSchedule = [
    {
      day: 'Monday/Thursday',
      time: '8:00 AM - 10:00 AM',
      courseCode: 'BSIT 101',
      courseTitle: 'Introduction to Information Technology',
      units: '3',
      room: 'ComLab 1'
    },
    {
      day: 'Monday/Thursday',
      time: '10:30 AM - 12:30 PM',
      courseCode: 'BSIT 102',
      courseTitle: 'Computer Programming Fundamentals',
      units: '3',
      room: 'ComLab 2'
    },
    {
      day: 'Wednesday',
      time: '10:30 AM - 12:30 PM',
      courseCode: 'BSIT 105',
      courseTitle: 'Web Development Fundamentals',
      units: '3',
      room: 'ComLab 2'
    },
    {
      day: 'Wednesday',
      time: '1:00 PM - 3:00 PM',
      courseCode: 'BSIT 106',
      courseTitle: 'Software Engineering Principles',
      units: '3',
      room: 'ComLab 1'
    },
    {
      day: 'Tuesday/Friday',
      time: '1:00 PM - 3:00 PM',
      courseCode: 'BSIT 103',
      courseTitle: 'Data Structures and Algorithms',
      units: '3',
      room: 'ComLab 1'
    },
    {
      day: 'Tuesday/Friday',
      time: '8:00 AM - 10:00 AM',
      courseCode: 'BSIT 104',
      courseTitle: 'Database Management Systems',
      units: '3',
      room: 'ComLab 3'
    }
  ];

  const downloadReport = () => {
    alert('Download functionality would export the schedule report as PDF or Excel file.');
  };

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
            <h2 style={{color: '#1e293b', fontSize: '28px', fontWeight: '700', marginBottom: '8px'}}>Reports</h2>
            <p style={{color: '#64748b', fontSize: '16px', margin: '0'}}>View and generate reports for your classes</p>
          </div>

          <div style={{background: '#ffffffff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', borderLeft: '5px solid #f97316'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                <FontAwesomeIcon icon={faFileAlt} style={{color: '#f97316', fontSize: '24px'}} />
                <div>
                  <h3 style={{color: '#1e293b', fontSize: '24px', fontWeight: '600', margin: '0'}}>My Teaching Schedule</h3>
                  <p style={{color: '#64748b', fontSize: '14px', margin: '5px 0 0 0'}}>Complete schedule for all assigned courses</p>
                </div>
              </div>

              <button
                onClick={downloadReport}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(15, 44, 99, 0.3)'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                <FontAwesomeIcon icon={faDownload} />
                Download Report
              </button>
            </div>

            <div style={{overflowX: 'auto'}}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: 'white',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}>
                <thead>
                  <tr style={{background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)', color: 'white'}}>
                    <th style={{padding: '15px 20px', textAlign: 'left', fontWeight: '600', fontSize: '14px', borderRight: '1px solid rgba(255, 255, 255, 0.2)'}}>Day</th>
                    <th style={{padding: '15px 20px', textAlign: 'left', fontWeight: '600', fontSize: '14px', borderRight: '1px solid rgba(255, 255, 255, 0.2)'}}>Time</th>
                    <th style={{padding: '15px 20px', textAlign: 'left', fontWeight: '600', fontSize: '14px', borderRight: '1px solid rgba(255, 255, 255, 0.2)'}}>Course Code & Title</th>
                    <th style={{padding: '15px 20px', textAlign: 'center', fontWeight: '600', fontSize: '14px', borderRight: '1px solid rgba(255, 255, 255, 0.2)'}}>Units</th>
                    <th style={{padding: '15px 20px', textAlign: 'left', fontWeight: '600', fontSize: '14px'}}>Room</th>
                  </tr>
                </thead>
                <tbody>
                  {instructorSchedule.map((schedule, index) => (
                    <tr key={index} style={{
                      background: index % 2 === 0 ? '#f8fafc' : 'white',
                      borderBottom: '1px solid #e2e8f0',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.closest('tr').style.background = '#f1f5f9'}
                    onMouseOut={(e) => e.target.closest('tr').style.background = index % 2 === 0 ? '#f8fafc' : 'white'}>
                      <td style={{padding: '15px 20px', fontSize: '14px', fontWeight: '500', color: '#1e293b'}}>{schedule.day}</td>
                      <td style={{padding: '15px 20px', fontSize: '14px', color: '#374151'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                          <FontAwesomeIcon icon={faCalendarAlt} style={{color: '#f97316', fontSize: '12px'}} />
                          {schedule.time}
                        </div>
                      </td>
                      <td style={{padding: '15px 20px', fontSize: '14px', color: '#374151'}}>
                        <div>
                          <div style={{fontWeight: '600', color: '#1e293b', marginBottom: '2px'}}>{schedule.courseCode}</div>
                          <div style={{fontSize: '13px', color: '#64748b'}}>{schedule.courseTitle}</div>
                        </div>
                      </td>
                      <td style={{padding: '15px 20px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#1e293b'}}>{schedule.units}</td>
                      <td style={{padding: '15px 20px', fontSize: '14px', color: '#374151'}}>{schedule.room}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
              <p style={{color: '#64748b', fontSize: '14px', margin: '0', textAlign: 'center'}}>
                <strong>Total Units:</strong> {instructorSchedule.reduce((total, course) => total + parseInt(course.units), 0)}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InstructorReports;