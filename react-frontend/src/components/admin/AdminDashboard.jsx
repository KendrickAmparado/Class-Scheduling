import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  faCalendarPlus,
  faTrash,
  faUserPlus,
  faLayerGroup,
  faChalkboardTeacher,
  faCalendarAlt,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { formatRoomLabel } from '../../utils/roomUtils';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [roomStatus, setRoomStatus] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalInstructors: 0,
    totalSchedules: 0,
    totalRooms: 0,
    totalSections: 0
  });
  const [weather, setWeather] = useState(null);
  const [weatherAlert, setWeatherAlert] = useState(null);
  const [weatherForecast, setWeatherForecast] = useState([]);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

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

    const fetchSummaryStats = async () => {
      try {
        // Fetch all data in parallel
        const [instructorsRes, schedulesRes, roomsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/instructors'),
          axios.get('http://localhost:5000/api/schedule/all'),
          axios.get('http://localhost:5000/api/rooms')
        ]);
        
        console.log('Instructors Response:', instructorsRes.data);
        console.log('Schedules Response:', schedulesRes.data);
        console.log('Rooms Response:', roomsRes.data);
        
        // Fetch sections - try to get unique sections from schedules
        let totalSections = 0;
        if (Array.isArray(schedulesRes.data)) {
          const uniqueSections = new Set();
          schedulesRes.data.forEach(schedule => {
            if (schedule.section && schedule.course && schedule.year) {
              uniqueSections.add(`${schedule.course}-${schedule.year}-${schedule.section}`);
            }
          });
          totalSections = uniqueSections.size;
        }
        
        const stats = {
          totalInstructors: Array.isArray(instructorsRes.data) ? instructorsRes.data.length : 0,
          totalSchedules: Array.isArray(schedulesRes.data) ? schedulesRes.data.length : 0,
          totalRooms: roomsRes.data.rooms?.length || 0,
          totalSections: totalSections
        };
        
        console.log('Summary Stats:', stats);
        setSummaryStats(stats);
      } catch (err) {
        console.error('Failed to load summary stats', err);
      }
    };

    fetchAlerts();
    fetchRoomStatus();
    fetchSummaryStats();
  }, []);

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

    fetchWeather();
    fetchForecast();
  }, [apiBase]);

  const renderAlertIcon = (type) => {
    switch (type) {
      case 'room-conflict':
        return <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#dc2626', fontSize: 18, marginTop: 2 }} />;
      case 'pending-approval':
        return <FontAwesomeIcon icon={faTimesCircle} style={{ color: '#b91c1c', fontSize: 18, marginTop: 2 }} />;
      case 'availability-update':
        return <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#059669', fontSize: 18, marginTop: 2 }} />;
      case 'schedule-created':
        return <FontAwesomeIcon icon={faCalendarPlus} style={{ color: '#16a34a', fontSize: 18, marginTop: 2 }} />;
      case 'schedule-deleted':
        return <FontAwesomeIcon icon={faTrash} style={{ color: '#dc2626', fontSize: 18, marginTop: 2 }} />;
      case 'section-created':
        return <FontAwesomeIcon icon={faLayerGroup} style={{ color: '#2563eb', fontSize: 18, marginTop: 2 }} />;
      case 'yearlevel-added':
        return <FontAwesomeIcon icon={faLayerGroup} style={{ color: '#0ea5e9', fontSize: 18, marginTop: 2 }} />;
      case 'instructor-added':
        return <FontAwesomeIcon icon={faUserPlus} style={{ color: '#4f46e5', fontSize: 18, marginTop: 2 }} />;
      case 'instructor-notification':
        return <FontAwesomeIcon icon={faClipboardList} style={{ color: '#4f46e5', fontSize: 18, marginTop: 2 }} />;
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
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content" style={{ flex: 1, padding: '1rem' }}>
        <Header title="Admin Dashboard" onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="dashboard-content" style={{ marginTop: '140px' }}>
          <div className="welcome-section">
            <h2>Welcome to the Admin Dashboard</h2>
            <p>Manage your class scheduling system efficiently</p>
          </div>

          {/* Summary Overview */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {/* Total Instructors Card */}
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 6px 18px rgba(15, 23, 63, 0.06)'
            }}>
              <div>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Total Instructors</p>
                <h3 style={{ margin: '6px 0 0', fontSize: '22px', color: '#0f172a' }}>{summaryStats.totalInstructors}</h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Active faculty members</span>
              </div>
              <div style={{ 
                padding: '12px', 
                borderRadius: '14px', 
                background: '#f97316',
                color: '#fff', 
                fontSize: '18px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FontAwesomeIcon icon={faChalkboardTeacher} />
              </div>
            </div>

            {/* Total Schedules Card */}
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 6px 18px rgba(15, 23, 63, 0.06)'
            }}>
              <div>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Total Schedules</p>
                <h3 style={{ margin: '6px 0 0', fontSize: '22px', color: '#0f172a' }}>{summaryStats.totalSchedules}</h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Classes scheduled</span>
              </div>
              <div style={{ 
                padding: '12px', 
                borderRadius: '14px', 
                background: '#0ea5e9',
                color: '#fff', 
                fontSize: '18px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FontAwesomeIcon icon={faCalendarAlt} />
              </div>
            </div>

            {/* Total Rooms Card */}
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 6px 18px rgba(15, 23, 63, 0.06)'
            }}>
              <div>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Total Rooms</p>
                <h3 style={{ margin: '6px 0 0', fontSize: '22px', color: '#0f172a' }}>{summaryStats.totalRooms}</h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Available facilities</span>
              </div>
              <div style={{ 
                padding: '12px', 
                borderRadius: '14px', 
                background: '#10b981',
                color: '#fff', 
                fontSize: '18px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FontAwesomeIcon icon={faDoorOpen} />
              </div>
            </div>

            {/* Total Sections Card */}
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 6px 18px rgba(15, 23, 63, 0.06)'
            }}>
              <div>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Total Sections</p>
                <h3 style={{ margin: '6px 0 0', fontSize: '22px', color: '#0f172a' }}>{summaryStats.totalSections}</h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Student groups</span>
              </div>
              <div style={{ 
                padding: '12px', 
                borderRadius: '14px', 
                background: '#1e293b',
                color: '#fff', 
                fontSize: '18px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FontAwesomeIcon icon={faUsers} />
              </div>
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
                      <td style={{ padding: '15px 20px', color: '#374151' }}>{formatRoomLabel(room.room)}</td>
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
