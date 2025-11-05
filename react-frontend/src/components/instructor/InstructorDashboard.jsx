import InstructorSidebar from '../common/InstructorSidebar.jsx';
import InstructorHeader from '../common/InstructorHeader.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCalendarAlt, faClock, faMapMarkerAlt, faFilter, faCalendarWeek, faSync, faExternalLinkAlt, faCheckCircle, faExclamationCircle, faCloudSun, faCloudRain, faSun, faBolt, faWind, faEye, faTemperatureHigh, faTemperatureLow, faExclamationTriangle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
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
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [syncedSchedules, setSyncedSchedules] = useState([]);
  const [calendarConfigured, setCalendarConfigured] = useState(false);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [weather, setWeather] = useState(null);
  const [weatherForecast, setWeatherForecast] = useState(null);
  const [weatherAlert, setWeatherAlert] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

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

  // Fetch Google Calendar events
  useEffect(() => {
    if (!userEmail) return;

    const fetchCalendarEvents = async () => {
      setLoadingCalendar(true);
      try {
        const token = localStorage.getItem('token');
        const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
        
        const response = await fetch(`${apiBase}/api/instructors/calendar/events`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setCalendarEvents(data.events || []);
          setSyncedSchedules(data.syncedSchedules || []);
          setCalendarConfigured(data.configured || false);
        } else if (response.status === 503) {
          // Google Calendar not configured
          setCalendarConfigured(false);
          setCalendarEvents([]);
          setSyncedSchedules([]);
        }
      } catch (error) {
        console.error('Error fetching calendar events:', error);
        setCalendarConfigured(false);
      } finally {
        setLoadingCalendar(false);
      }
    };

    fetchCalendarEvents();
    
    // Refresh every 5 minutes
    const calendarInterval = setInterval(fetchCalendarEvents, 300000);
    
    return () => clearInterval(calendarInterval);
  }, [userEmail]);

  // Fetch weather for Malaybalay City, Bukidnon
  useEffect(() => {
    const fetchWeather = async () => {
      setLoadingWeather(true);
      try {
        const response = await fetch(`${apiBase}/api/weather/current?city=Malaybalay&countryCode=PH`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setWeather(data.weather);
            setWeatherAlert(data.alert);
          }
        }
      } catch (error) {
        console.error('Error fetching weather:', error);
      } finally {
        setLoadingWeather(false);
      }
    };

    const fetchForecast = async () => {
      try {
        const response = await fetch(`${apiBase}/api/weather/forecast?city=Malaybalay&countryCode=PH`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setWeatherForecast(data.forecast);
          }
        }
      } catch (error) {
        console.error('Error fetching weather forecast:', error);
      }
    };

    // Initial fetch
    fetchWeather();
    fetchForecast();

    // Auto-refresh every 30 minutes
    const weatherInterval = setInterval(() => {
      fetchWeather();
      fetchForecast();
    }, 30 * 60 * 1000);

    return () => clearInterval(weatherInterval);
  }, [apiBase]);

  if (!userEmail) {
    return <p>Loading user information...</p>;
  }

  // Helper functions for weather display
  const getWeatherIcon = (main) => {
    switch (main) {
      case 'Thunderstorm':
        return faBolt;
      case 'Rain':
      case 'Drizzle':
        return faCloudRain;
      case 'Clear':
        return faSun;
      default:
        return faCloudSun;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'danger':
        return '#dc2626';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  // Format date for display
  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Get Google Calendar URL
  const getGoogleCalendarUrl = () => {
    return `https://calendar.google.com/calendar/u/0/r`;
  };

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

          {/* Weather Section */}
          <div style={{ 
            background: '#fff', 
            padding: '30px', 
            borderRadius: '15px', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
            borderLeft: '5px solid #3b82f6', 
            marginTop: '30px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <FontAwesomeIcon icon={faCloudSun} style={{ color: '#3b82f6', fontSize: '24px' }} />
                <h3 style={{ color: '#1e293b', fontSize: '24px', fontWeight: '600', margin: 0 }}>Weather Forecast - Malaybalay City</h3>
              </div>
            </div>

            {loadingWeather ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <FontAwesomeIcon icon={faSync} spin style={{ fontSize: '24px', color: '#3b82f6', marginBottom: '10px' }} />
                <p style={{ color: '#64748b', margin: 0 }}>Loading weather data...</p>
              </div>
            ) : weather ? (
              <>
                {/* Current Weather */}
                <div style={{ 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', 
                  padding: '25px', 
                  borderRadius: '12px', 
                  color: 'white',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <FontAwesomeIcon icon={getWeatherIcon(weather.main)} style={{ fontSize: '64px' }} />
                      <div>
                        <div style={{ fontSize: '48px', fontWeight: '700', lineHeight: '1' }}>
                          {weather.temperature}°C
                        </div>
                        <div style={{ fontSize: '18px', opacity: 0.9, marginTop: '5px', textTransform: 'capitalize' }}>
                          {weather.description}
                        </div>
                        <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '5px' }}>
                          Feels like {weather.feelsLike}°C
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', flex: '1', maxWidth: '300px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                        <FontAwesomeIcon icon={faWind} style={{ marginBottom: '5px' }} />
                        <div style={{ fontSize: '12px', opacity: 0.9 }}>Wind</div>
                        <div style={{ fontSize: '16px', fontWeight: '600' }}>{Math.round(weather.windSpeed * 3.6)} km/h</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                        <FontAwesomeIcon icon={faTemperatureHigh} style={{ marginBottom: '5px' }} />
                        <div style={{ fontSize: '12px', opacity: 0.9 }}>Humidity</div>
                        <div style={{ fontSize: '16px', fontWeight: '600' }}>{weather.humidity}%</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weather Alert */}
                {weatherAlert && weatherAlert.hasAlert && (
                  <div style={{
                    background: weatherAlert.severity === 'danger' ? '#fee2e2' : 
                               weatherAlert.severity === 'warning' ? '#fef3c7' : '#dbeafe',
                    border: `2px solid ${getSeverityColor(weatherAlert.severity)}`,
                    padding: '15px',
                    borderRadius: '10px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <FontAwesomeIcon 
                        icon={weatherAlert.severity === 'danger' || weatherAlert.severity === 'warning' ? faExclamationTriangle : faInfoCircle} 
                        style={{ color: getSeverityColor(weatherAlert.severity), fontSize: '18px' }} 
                      />
                      <strong style={{ color: getSeverityColor(weatherAlert.severity), textTransform: 'uppercase', fontSize: '14px' }}>
                        {weatherAlert.severity} Alert
                      </strong>
                    </div>
                    <p style={{ margin: 0, color: '#1e293b', fontSize: '14px' }}>{weatherAlert.message}</p>
                  </div>
                )}

                {/* 5-Day Forecast */}
                {weatherForecast && weatherForecast.forecast && weatherForecast.forecast.length > 0 && (
                  <div>
                    <h4 style={{ color: '#374151', fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>
                      5-Day Forecast
                    </h4>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {weatherForecast.forecast.slice(0, 5).map((day, idx) => {
                        const mainForecast = day.forecasts[0]; // Get first forecast of the day
                        return (
                          <div
                            key={idx}
                            style={{
                              padding: '15px',
                              background: '#f8fafc',
                              borderRadius: '10px',
                              border: '1px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '15px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: '1' }}>
                              <div style={{ width: '60px', textAlign: 'center' }}>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                                  {day.dayName.slice(0, 3)}
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                              </div>
                              <FontAwesomeIcon 
                                icon={getWeatherIcon(mainForecast?.main || 'Clouds')} 
                                style={{ fontSize: '32px', color: '#3b82f6' }} 
                              />
                              <div style={{ flex: '1' }}>
                                <div style={{ fontSize: '14px', color: '#64748b', textTransform: 'capitalize', marginBottom: '3px' }}>
                                  {mainForecast?.description || 'N/A'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '12px', color: '#64748b' }}>
                                  <span><FontAwesomeIcon icon={faWind} style={{ marginRight: '5px' }} /> {Math.round((mainForecast?.windSpeed || 0) * 3.6)} km/h</span>
                                  <span><FontAwesomeIcon icon={faTemperatureHigh} style={{ marginRight: '5px' }} /> {mainForecast?.humidity || 0}%</span>
                                </div>
                              </div>
                              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
                                {mainForecast?.temperature || 'N/A'}°C
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <FontAwesomeIcon icon={faCloudSun} style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.5 }} />
                <p>Weather data unavailable</p>
              </div>
            )}
          </div>

          {/* Google Calendar Section */}
          {calendarConfigured && (
            <div style={{ background: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderLeft: '5px solid #4285f4', marginTop: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <FontAwesomeIcon icon={faCalendarAlt} style={{ color: '#4285f4', fontSize: '24px' }} />
                  <h3 style={{ color: '#1e293b', fontSize: '24px', fontWeight: '600', margin: 0 }}>Google Calendar</h3>
                  {syncedSchedules.length > 0 && (
                    <span style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <FontAwesomeIcon icon={faCheckCircle} style={{ fontSize: '10px' }} />
                      {syncedSchedules.length} Synced
                    </span>
                  )}
                </div>
                <a
                  href={getGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #4285f4 0%, #1a73e8 100%)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = '')}
                >
                  <FontAwesomeIcon icon={faExternalLinkAlt} />
                  Open Google Calendar
                </a>
              </div>

              {loadingCalendar ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <FontAwesomeIcon icon={faSync} spin style={{ fontSize: '24px', color: '#4285f4', marginBottom: '10px' }} />
                  <p style={{ color: '#64748b', margin: 0 }}>Loading calendar events...</p>
                </div>
              ) : calendarEvents.length > 0 ? (
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ color: '#374151', fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>
                    Upcoming Events ({calendarEvents.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {calendarEvents.slice(0, 5).map((event, index) => (
                      <div
                        key={event.id || index}
                        style={{
                          padding: '15px',
                          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)';
                          e.currentTarget.style.transform = 'translateX(5px)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                          <div style={{ flex: 1 }}>
                            <h5 style={{ color: '#1e293b', fontSize: '16px', fontWeight: '600', margin: '0 0 5px 0' }}>
                              {event.summary || 'Untitled Event'}
                            </h5>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', marginTop: '8px' }}>
                              <span style={{ color: '#64748b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <FontAwesomeIcon icon={faClock} style={{ fontSize: '12px' }} />
                                {formatEventDate(event.start?.dateTime || event.start?.date || '')}
                              </span>
                              {event.location && (
                                <span style={{ color: '#64748b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <FontAwesomeIcon icon={faMapMarkerAlt} style={{ fontSize: '12px' }} />
                                  {event.location}
                                </span>
                              )}
                            </div>
                            {event.description && (
                              <p style={{ color: '#475569', fontSize: '13px', margin: '8px 0 0 0', lineHeight: '1.5' }}>
                                {event.description.split('\n')[0]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {calendarEvents.length > 5 && (
                      <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', marginTop: '10px' }}>
                        And {calendarEvents.length - 5} more events. View all in Google Calendar.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', borderRadius: '12px' }}>
                  <FontAwesomeIcon icon={faCalendarAlt} style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '15px' }} />
                  <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                    No upcoming calendar events. Your schedules will be automatically synced to Google Calendar.
                  </p>
                </div>
              )}

              {syncedSchedules.length > 0 && (
                <div style={{ marginTop: '25px', paddingTop: '25px', borderTop: '2px solid #e2e8f0' }}>
                  <h4 style={{ color: '#374151', fontSize: '16px', fontWeight: '600', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faSync} style={{ color: '#4285f4', fontSize: '14px' }} />
                    Synced Schedules ({syncedSchedules.length})
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                    {syncedSchedules.map((schedule) => (
                      <div
                        key={schedule._id}
                        style={{
                          padding: '12px',
                          background: '#f0fdf4',
                          borderRadius: '8px',
                          border: '1px solid #86efac',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10b981', fontSize: '14px' }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ color: '#1e293b', fontSize: '13px', fontWeight: '600', margin: 0 }}>
                            {schedule.subject}
                          </p>
                          <p style={{ color: '#64748b', fontSize: '11px', margin: '4px 0 0 0' }}>
                            {schedule.day} • {schedule.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!calendarConfigured && !loadingCalendar && (
            <div style={{ background: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderLeft: '5px solid #f59e0b', marginTop: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <FontAwesomeIcon icon={faExclamationCircle} style={{ color: '#f59e0b', fontSize: '24px' }} />
                <h3 style={{ color: '#1e293b', fontSize: '20px', fontWeight: '600', margin: 0 }}>Google Calendar Integration</h3>
              </div>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
                Google Calendar integration is not currently configured. When enabled, your schedules will be automatically synced to your Google Calendar.
                Please contact your administrator for more information.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default InstructorDashboard;
