import InstructorSidebar from '../common/InstructorSidebar.jsx';
import InstructorHeader from '../common/InstructorHeader.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCalendarAlt, faClock, faMapMarkerAlt, faFilter, faCalendarWeek } from '@fortawesome/free-solid-svg-icons';
import '../../styles/InstructorDashboard.css';
import { AuthContext } from '../../context/AuthContext.jsx';
import React, { useState, useEffect, useContext } from 'react';

const InstructorDashboard = () => {
  const { userEmail } = useContext(AuthContext);
  
  // 🟢 CHANGED: separated fields for first and last name
  const [instructorData, setInstructorData] = useState({ 
    instructorId: '',
    firstname: '', 
    lastname: '', 
    image: '' 
  });
  const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
  const resolveImageUrl = (value) => {
    if (!value) return '/images/tiger.png';
    if (value.startsWith('http')) return value;
    if (value.startsWith('/uploads/')) return `${apiBase}${value}`;
    return value;
  };

  const [allSchedules, setAllSchedules] = useState([]);
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedDate] = useState(new Date());

  // Days of the week for filtering
  const daysOfWeek = [
    { key: 'all', label: 'All Days', icon: faCalendarWeek },
    { key: 'monday', label: 'Monday', icon: faCalendarAlt },
    { key: 'tuesday', label: 'Tuesday', icon: faCalendarAlt },
    { key: 'wednesday', label: 'Wednesday', icon: faCalendarAlt },
    { key: 'thursday', label: 'Thursday', icon: faCalendarAlt },
    { key: 'friday', label: 'Friday', icon: faCalendarAlt },
    { key: 'saturday', label: 'Saturday', icon: faCalendarAlt },
  ];

  // Filter schedules based on selected day
  const filteredSchedules = selectedDay === 'all' 
    ? allSchedules 
    : allSchedules.filter(schedule => {
        const scheduleDays = schedule.day.toLowerCase();
        return scheduleDays.includes(selectedDay);
      });

  useEffect(() => {
    if (!userEmail) {
      console.log('No userEmail available yet');
      return;
    }

    const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

    const fetchInstructorData = () => {
      console.log('Fetching instructor profile via token for email:', userEmail);
      const token = localStorage.getItem('token');
      fetch(`${apiBase}/api/instructors/profile/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(async res => {
          console.log('Profile /me response status:', res.status);
          if (res.ok) return res.json();
          // Fallback to by-email if JWT-protected endpoint fails
          const fb = await fetch(`${apiBase}/api/instructors/profile/by-email/${encodeURIComponent(userEmail)}`);
          if (!fb.ok) throw new Error(`Failed to fetch profile data: ${res.status} ${res.statusText}`);
          return fb.json();
        })
        .then(data => {
          console.log('Instructor data received:', data);
          setInstructorData({
            instructorId: data.instructorId || '',
            firstname: data.firstname || '',
            lastname: data.lastname || '',
            image: resolveImageUrl(data.image || '')
          });
        })
        .catch(error => {
          console.error('Error fetching instructor data:', error);
          // Reset to neutral values on error (avoid showing "Error Loading...")
          setInstructorData({ instructorId: '', firstname: '', lastname: '', image: '' });
        });
    };

    // Initial fetch
    fetchInstructorData();

    // Auto-refresh every 30 seconds
    const autoRefreshInterval = setInterval(fetchInstructorData, 30000);

    return () => {
      clearInterval(autoRefreshInterval);
    };
  }, [userEmail]);

  useEffect(() => {
    // 🟢 CHANGED: Use instructor's email to fetch schedules instead of name
    if (!userEmail) {
      console.log('Skipping schedule fetch - user email not available:', userEmail);
      return;
    }

    const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

    const fetchScheduleData = async () => {
      console.log('Fetching schedules for instructor email:', userEmail);
      try {
        const emailRes = await fetch(`${apiBase}/api/schedule/instructor/${encodeURIComponent(userEmail)}`);
        console.log('Schedule (email) response status:', emailRes.status);
        if (!emailRes.ok) throw new Error(`Failed to fetch by email: ${emailRes.status} ${emailRes.statusText}`);
        const emailData = await emailRes.json();

        const normalize = (data) => Array.isArray(data) ? data : (data?.schedules || []);
        let emailSchedules = normalize(emailData);

        // Fallback: also fetch by name and merge unique
        let nameSchedules = [];
        const name = [instructorData.firstname, instructorData.lastname].filter(Boolean).join(' ').trim();
        if (name.length > 0) {
          const nameRes = await fetch(`${apiBase}/api/schedule/instructor/by-name/${encodeURIComponent(name)}`);
          console.log('Schedule (name) response status:', nameRes.status);
          if (nameRes.ok) {
            const nameData = await nameRes.json();
            nameSchedules = normalize(nameData);
          }
        }

        const keyOf = (s) => `${s._id || ''}|${s.day}|${s.time}|${s.subject}`;
        const map = new Map();
        [...emailSchedules, ...nameSchedules].forEach(s => {
          if (!s) return;
          const k = keyOf(s);
          if (!map.has(k)) map.set(k, s);
        });
        const merged = Array.from(map.values());
        console.log('✅ Merged schedules count:', merged.length);
        setAllSchedules(merged);
      } catch (error) {
        console.error('Error fetching schedules:', error);
        setAllSchedules([]);
      }
    };

    // Initial fetch
    fetchScheduleData();

    // Auto-refresh schedules every 30 seconds
    const scheduleRefreshInterval = setInterval(fetchScheduleData, 30000);

    return () => {
      clearInterval(scheduleRefreshInterval);
    };
  }, [userEmail, instructorData.firstname, instructorData.lastname]); // ensure fallback by name has data

  if (!userEmail) {
    return <p>Loading user information...</p>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <InstructorSidebar />
      <main style={{ flex: 1, background: 'linear-gradient(to right, #0f2c63 0%, #f97316 100%)', overflowY: 'auto' }}>
        <InstructorHeader />

        <div style={{ padding: '30px', background: 'linear-gradient(to right, #0f2c63 0%, #f97316 100%)', minHeight: 'calc(100vh - 80px)', overflowY: 'auto' }}>

          {/* Instructor Profile Section */}
          {/* Instructor Profile Section */}
<div style={{
  background: '#fff',
  padding: '30px',
  borderRadius: '15px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  marginBottom: '30px',
  borderLeft: '5px solid #f97316',
}}>
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '25px'
  }}>
    {/* Profile Image */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '25px',
    }}>
      <div style={{
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        overflow: 'hidden',
        border: '4px solid #f97316',
        boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)',
      }}>
        <img
          src={instructorData.image || '/images/tiger.png'}
          alt={`${instructorData.firstname} ${instructorData.lastname}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Welcome Message */}
      <div>
        <h1 style={{
          color: '#0f172a',
          fontSize: '36px',
          fontWeight: '800',
          marginBottom: '10px',
          letterSpacing: '0.5px',
        }}>
          Welcome!
        </h1>
        <h2 style={{
          color: '#f97316',
          fontSize: '28px',
          fontWeight: '700',
          marginBottom: '15px',
          textShadow: '1px 1px 4px rgba(249, 115, 22, 0.3)',
        }}>
          {instructorData.firstname && instructorData.lastname 
            ? `${instructorData.firstname} ${instructorData.lastname}`
            : instructorData.firstname || instructorData.lastname || 'Loading instructor name...'}
        </h2>
        <p style={{
          color: '#64748b',
          fontSize: '16px',
          marginTop: '5px',
        }}>
          Here's your dashboard overview and today's class schedule.
        </p>
        <div style={{
          marginTop: '15px',
          padding: '10px 15px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          display: 'inline-block'
        }}>
          <span style={{
            color: '#475569',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Instructor ID: 
          </span>
          <span style={{
            color: '#0f172a',
            fontSize: '14px',
            fontWeight: '600',
            marginLeft: '8px'
          }}>
            {instructorData.instructorId || 'Loading...'}
          </span>
        </div>
      </div>
    </div>

    {/* Optional: Date display */}
    <div style={{
      textAlign: 'right',
      color: '#475569',
      fontSize: '15px',
      fontWeight: '500'
    }}>
      {new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}
    </div>
  </div>
</div>


          {/* Schedule Section */}
          <div style={{ background: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderLeft: '5px solid #f97316' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <FontAwesomeIcon icon={faCalendarAlt} style={{ color: '#f97316', fontSize: '24px' }} />
                <h3 style={{ color: '#1e293b', fontSize: '24px', fontWeight: '600', margin: 0 }}>
                  {selectedDay === 'all' ? 'All Schedules' : `${selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)} Schedule`}
                </h3>
              </div>
              <span style={{ color: '#64748b', fontSize: '16px' }}>
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            {/* Day Filter */}
            <div style={{ marginBottom: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                <FontAwesomeIcon icon={faFilter} style={{ color: '#f97316', fontSize: '16px' }} />
                <span style={{ color: '#374151', fontSize: '16px', fontWeight: '600' }}>Filter by Day</span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                gap: '10px', 
                flexWrap: 'wrap',
                padding: '15px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                {daysOfWeek.map((day) => (
                  <button
                    key={day.key}
                    onClick={() => setSelectedDay(day.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      background: selectedDay === day.key 
                        ? 'linear-gradient(135deg, #0f2c63 0%, #f97316 100%)' 
                        : '#ffffff',
                      color: selectedDay === day.key ? '#ffffff' : '#374151',
                      boxShadow: selectedDay === day.key 
                        ? '0 4px 15px rgba(249, 115, 22, 0.4)' 
                        : '0 2px 4px rgba(0, 0, 0, 0.05)',
                      transform: selectedDay === day.key ? 'translateY(-2px)' : 'translateY(0)',
                    }}
                    onMouseOver={(e) => {
                      if (selectedDay !== day.key) {
                        e.target.style.background = '#f1f5f9';
                        e.target.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedDay !== day.key) {
                        e.target.style.background = '#ffffff';
                        e.target.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    <FontAwesomeIcon 
                      icon={day.icon} 
                      style={{ 
                        fontSize: '14px',
                        color: selectedDay === day.key ? '#ffffff' : '#f97316'
                      }} 
                    />
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule Results */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>
                  {filteredSchedules.length > 0 
                    ? `Showing ${filteredSchedules.length} ${filteredSchedules.length === 1 ? 'class' : 'classes'} ${selectedDay === 'all' ? 'for all days' : `for ${selectedDay}`}`
                    : `No classes found ${selectedDay === 'all' ? 'in your schedule' : `for ${selectedDay}`}`
                  }
                </span>
                {filteredSchedules.length > 0 && (
                  <span style={{ 
                    color: '#f97316', 
                    fontSize: '12px', 
                    fontWeight: '600',
                    background: 'rgba(249, 115, 22, 0.1)',
                    padding: '4px 8px',
                    borderRadius: '6px'
                  }}>
                    {filteredSchedules.length} {filteredSchedules.length === 1 ? 'CLASS' : 'CLASSES'}
                  </span>
                )}
              </div>
            </div>

            {filteredSchedules.length > 0 ? (
              /* Scrollable Table Container */
              <div
                style={{
                  width: '100%',
                  maxHeight: '600px',
                  overflowY: 'auto',
                  overflowX: 'auto',
                  border: '2px solid #e5e7eb',
                  borderRadius: '14px',
                  background: 'white'
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    tableLayout: 'fixed',
                    fontSize: '15px',
                  }}
                >
                  <colgroup>
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '35%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '15%' }} />
                  </colgroup>
                  <thead
                    style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      background: 'linear-gradient(135deg, #0f2c63 0%, #f97316 100%)',
                      color: 'white',
                    }}
                  >
                    <tr>
                      <th
                        style={{
                          padding: '20px 16px',
                          textAlign: 'left',
                          fontWeight: '700',
                          fontSize: '14px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '8px' }} />
                        Day
                      </th>
                      <th
                        style={{
                          padding: '20px 16px',
                          textAlign: 'left',
                          fontWeight: '700',
                          fontSize: '14px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        <FontAwesomeIcon icon={faClock} style={{ marginRight: '8px' }} />
                        Time
                      </th>
                      <th
                        style={{
                          padding: '20px 16px',
                          textAlign: 'left',
                          fontWeight: '700',
                          fontSize: '14px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        <FontAwesomeIcon icon={faUser} style={{ marginRight: '8px' }} />
                        Subject
                      </th>
                      <th
                        style={{
                          padding: '20px 16px',
                          textAlign: 'left',
                          fontWeight: '700',
                          fontSize: '14px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        <FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: '8px' }} />
                        Room
                      </th>
                      <th
                        style={{
                          padding: '20px 16px',
                          textAlign: 'left',
                          fontWeight: '700',
                          fontSize: '14px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        <FontAwesomeIcon icon={faUser} style={{ marginRight: '8px' }} />
                        Section
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSchedules
                      .sort((a, b) => {
                        // Sort by day first, then by time
                        const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                        const dayComparison = dayOrder.indexOf(a.day.toLowerCase()) - dayOrder.indexOf(b.day.toLowerCase());
                        if (dayComparison !== 0) return dayComparison;
                        
                        // Then sort by time
                        const timeStringToMinutes = (timeStr) => {
                          const cleanTime = timeStr.trim().split(' - ')[0];
                          let [time, modifier] = cleanTime.split(' ');
                          if (!modifier) return 0;
                          let [h, m] = time.split(':').map(Number);
                          if (modifier.toLowerCase() === 'pm' && h !== 12) h += 12;
                          if (modifier.toLowerCase() === 'am' && h === 12) h = 0;
                          return h * 60 + (m || 0);
                        };
                        return timeStringToMinutes(a.time) - timeStringToMinutes(b.time);
                      })
                      .map((schedule, index) => (
                        <tr 
                          key={index} 
                          style={{ 
                            borderBottom: '1px solid #f1f5f9',
                            background: index % 2 === 0 ? '#f8fafc' : 'white',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = '#e0f2fe';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = index % 2 === 0 ? '#f8fafc' : 'white';
                          }}
                        >
                          <td
                            style={{
                              padding: '18px 16px',
                              color: '#1e293b',
                              fontWeight: '600',
                              fontSize: '14px',
                            }}
                          >
                            <span
                              style={{
                                background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
                                color: 'white',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px'
                              }}
                            >
                              {schedule.day}
                            </span>
                          </td>
                          <td 
                            style={{ 
                              padding: '18px 16px', 
                              color: '#374151', 
                              fontSize: '14px',
                              fontWeight: '500'
                            }}
                          >
                            {schedule.time}
                          </td>
                          <td 
                            style={{ 
                              padding: '18px 16px', 
                              color: '#1e293b', 
                              fontSize: '15px',
                              fontWeight: '600'
                            }}
                          >
                            {schedule.subject}
                          </td>
                          <td 
                            style={{ 
                              padding: '18px 16px', 
                              color: '#374151', 
                              fontSize: '14px',
                              fontWeight: '500'
                            }}
                          >
                            <span
                              style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}
                            >
                              {schedule.room}
                            </span>
                          </td>
                          <td 
                            style={{ 
                              padding: '18px 16px', 
                              color: '#64748b', 
                              fontSize: '13px',
                              fontWeight: '500'
                            }}
                          >
                            {schedule.course?.toUpperCase()}-{schedule.year?.charAt(0)?.toUpperCase()}{schedule.section}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px', 
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                borderRadius: '15px',
                border: '2px dashed #cbd5e1'
              }}>
                <FontAwesomeIcon 
                  icon={faCalendarAlt} 
                  style={{ 
                    fontSize: '64px', 
                    marginBottom: '20px', 
                    color: '#cbd5e1'
                  }} 
                />
                <h4 style={{ 
                  color: '#64748b', 
                  fontSize: '20px', 
                  fontWeight: '600',
                  margin: '0 0 10px 0'
                }}>
                  No Classes Found
                </h4>
                <p style={{ 
                  color: '#94a3b8', 
                  fontSize: '16px', 
                  margin: 0,
                  maxWidth: '400px',
                  marginLeft: 'auto',
                  marginRight: 'auto'
                }}>
                  {selectedDay === 'all' 
                    ? 'You don\'t have any classes scheduled yet. Contact your administrator to assign classes.'
                    : `No classes are scheduled for ${selectedDay}. Try selecting a different day.`
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default InstructorDashboard;
