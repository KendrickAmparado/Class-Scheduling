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
  faCloudSun,
  faCloudRain,
  faSun,
  faBolt,
  faWind,
  faTemperatureHigh,
  faInfoCircle,
  faSync,
} from '@fortawesome/free-solid-svg-icons';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [roomStatus, setRoomStatus] = useState([]);
  const [weather, setWeather] = useState(null);
  const [weatherForecast, setWeatherForecast] = useState(null);
  const [weatherAlert, setWeatherAlert] = useState(null);
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
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
