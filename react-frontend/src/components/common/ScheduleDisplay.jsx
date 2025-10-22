import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faUser, faMapMarkerAlt, faGraduationCap } from '@fortawesome/free-solid-svg-icons';

// Standardized schedule display component
const ScheduleDisplay = ({ 
  schedules, 
  displayType = 'grid', // 'grid', 'cards', 'table', 'list'
  timeFormat = '12hour', // '12hour', '24hour'
  showDetails = true,
  showRoom = true,
  showInstructor = true,
  showSection = true,
  className = '',
  onScheduleClick = null
}) => {
  
  // Standardize time format
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    // Handle different input formats
    let cleanTime = timeString;
    if (timeString.includes(' - ')) {
      cleanTime = timeString.split(' - ')[0];
    }
    
    // Convert to standard format
    const [time, modifier] = cleanTime.trim().split(' ');
    if (!modifier) return timeString;
    
    let [h, m] = time.split(':').map(Number);
    if (modifier.toLowerCase() === 'pm' && h !== 12) h += 12;
    if (modifier.toLowerCase() === 'am' && h === 12) h = 0;
    
    if (timeFormat === '24hour') {
      return `${h.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}`;
    } else {
      const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h >= 12 ? 'PM' : 'AM';
      return `${displayHour}:${(m || 0).toString().padStart(2, '0')} ${ampm}`;
    }
  };

  // Standardize schedule data
  const standardizeSchedule = (schedule) => ({
    id: schedule._id || schedule.id,
    subject: schedule.subject || schedule.subjectName || schedule.courseTitle,
    instructor: schedule.instructor || schedule.instructorName,
    room: schedule.room || schedule.roomName,
    section: schedule.section || schedule.sectionName,
    time: schedule.time || `${schedule.startTime} - ${schedule.endTime}`,
    day: schedule.day || schedule.dayName,
    course: schedule.course || schedule.courseCode,
    units: schedule.units || schedule.creditUnits
  });

  const standardizedSchedules = schedules.map(standardizeSchedule);

  // Grid display (for main schedule calendar)
  const renderGrid = () => (
    <div className={`schedule-grid ${className}`}>
      {standardizedSchedules.map((schedule) => (
        <div
          key={schedule.id}
          className="schedule-grid-item"
          onClick={() => onScheduleClick && onScheduleClick(schedule)}
          style={{
            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            border: '1px solid #3b82f6',
            borderRadius: '8px',
            padding: '12px',
            margin: '4px',
            cursor: onScheduleClick ? 'pointer' : 'default',
            transition: 'all 0.3s ease'
          }}
        >
          <div className="schedule-time" style={{ fontWeight: '600', color: '#1e40af', marginBottom: '4px' }}>
            <FontAwesomeIcon icon={faClock} style={{ marginRight: '6px', fontSize: '12px' }} />
            {formatTime(schedule.time)}
          </div>
          <div className="schedule-subject" style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
            {schedule.subject}
          </div>
          {showInstructor && (
            <div className="schedule-instructor" style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>
              <FontAwesomeIcon icon={faUser} style={{ marginRight: '4px', fontSize: '10px' }} />
              {schedule.instructor}
            </div>
          )}
          {showRoom && (
            <div className="schedule-room" style={{ fontSize: '12px', color: '#64748b' }}>
              <FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: '4px', fontSize: '10px' }} />
              {schedule.room}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // Card display (for instructor dashboard)
  const renderCards = () => (
    <div className={`schedule-cards ${className}`}>
      {standardizedSchedules.map((schedule) => (
        <div
          key={schedule.id}
          className="schedule-card"
          onClick={() => onScheduleClick && onScheduleClick(schedule)}
          style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #f97316',
            borderRadius: '12px',
            padding: '20px',
            margin: '8px 0',
            cursor: onScheduleClick ? 'pointer' : 'default',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
            <FontAwesomeIcon icon={faClock} style={{ color: '#f97316', fontSize: '16px' }} />
            <span style={{ color: '#1e293b', fontSize: '16px', fontWeight: '600' }}>
              {formatTime(schedule.time)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
            <FontAwesomeIcon icon={faGraduationCap} style={{ color: '#64748b', fontSize: '14px' }} />
            <span style={{ color: '#374151', fontSize: '16px', fontWeight: '500' }}>
              {schedule.subject}
            </span>
          </div>
          {showDetails && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
              <FontAwesomeIcon icon={faUser} style={{ color: '#64748b', fontSize: '14px' }} />
              <span style={{ color: '#374151', fontSize: '14px' }}>
                {schedule.instructor}
              </span>
            </div>
          )}
          {showRoom && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#64748b', fontSize: '14px' }} />
              <span style={{ color: '#374151', fontSize: '14px' }}>
                {schedule.room} • {schedule.section}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // Table display (for reports)
  const renderTable = () => (
    <div className={`schedule-table-container ${className}`}>
      <table className="schedule-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)' }}>
            <th style={{ padding: '12px', color: 'white', textAlign: 'left' }}>Time</th>
            <th style={{ padding: '12px', color: 'white', textAlign: 'left' }}>Subject</th>
            {showInstructor && <th style={{ padding: '12px', color: 'white', textAlign: 'left' }}>Instructor</th>}
            {showRoom && <th style={{ padding: '12px', color: 'white', textAlign: 'left' }}>Room</th>}
            {showSection && <th style={{ padding: '12px', color: 'white', textAlign: 'left' }}>Section</th>}
          </tr>
        </thead>
        <tbody>
          {standardizedSchedules.map((schedule) => (
            <tr key={schedule.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '12px', fontWeight: '600', color: '#1e40af' }}>
                {formatTime(schedule.time)}
              </td>
              <td style={{ padding: '12px', fontWeight: '500' }}>
                {schedule.subject}
              </td>
              {showInstructor && (
                <td style={{ padding: '12px', color: '#64748b' }}>
                  {schedule.instructor}
                </td>
              )}
              {showRoom && (
                <td style={{ padding: '12px', color: '#64748b' }}>
                  {schedule.room}
                </td>
              )}
              {showSection && (
                <td style={{ padding: '12px', color: '#64748b' }}>
                  {schedule.section}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // List display (for simple lists)
  const renderList = () => (
    <div className={`schedule-list ${className}`}>
      {standardizedSchedules.map((schedule) => (
        <div
          key={schedule.id}
          className="schedule-list-item"
          onClick={() => onScheduleClick && onScheduleClick(schedule)}
          style={{
            padding: '12px',
            borderBottom: '1px solid #e2e8f0',
            cursor: onScheduleClick ? 'pointer' : 'default',
            transition: 'background-color 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: '600', color: '#1e40af' }}>
                {formatTime(schedule.time)}
              </span>
              <span style={{ marginLeft: '12px', fontWeight: '500' }}>
                {schedule.subject}
              </span>
            </div>
            <div style={{ color: '#64748b', fontSize: '14px' }}>
              {schedule.room} • {schedule.section}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Render based on display type
  switch (displayType) {
    case 'cards':
      return renderCards();
    case 'table':
      return renderTable();
    case 'list':
      return renderList();
    case 'grid':
    default:
      return renderGrid();
  }
};

export default ScheduleDisplay;
