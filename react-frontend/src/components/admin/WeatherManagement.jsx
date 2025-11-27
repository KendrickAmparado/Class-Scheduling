import React, { useState, useEffect } from 'react';
import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCloudSun,
  faCloudRain,
  faSun,
  faBolt,
  faWind,
  faEye,
  faTemperatureHigh,
  faTemperatureLow,
  faExclamationTriangle,
  faCheckCircle,
  faInfoCircle,
  faSearch,
  faRefresh,
  faBell
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useToast } from '../common/ToastProvider.jsx';

const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

const WeatherManagement = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [city, setCity] = useState('Manila');
  const [countryCode, setCountryCode] = useState('PH');
  const [weatherAlert, setWeatherAlert] = useState(null);
  const [configured, setConfigured] = useState(false);
  const [creatingAlert, setCreatingAlert] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await axios.get(`${apiBase}/api/weather/status`);
      setConfigured(res.data.configured);
      if (res.data.configured) {
        fetchCurrentWeather();
      }
    } catch (error) {
      console.error('Error checking weather status:', error);
      showToast('Failed to check weather service status', 'error');
    }
  };

  const fetchCurrentWeather = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiBase}/api/weather/current`, {
        params: { city, countryCode }
      });
      
      if (res.data.success) {
        setWeather(res.data.weather);
        setWeatherAlert(res.data.alert);
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      showToast(error.response?.data?.message || 'Failed to fetch weather data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiBase}/api/weather/forecast`, {
        params: { city, countryCode }
      });
      
      if (res.data.success) {
        setForecast(res.data.forecast);
      }
    } catch (error) {
      console.error('Error fetching forecast:', error);
      showToast(error.response?.data?.message || 'Failed to fetch weather forecast', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createWeatherAlert = async () => {
    setCreatingAlert(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${apiBase}/api/weather/check-and-alert`,
        {
          city,
          countryCode,
          autoCreateAlert: true
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.data.success) {
        if (res.data.alertCreated) {
          showToast('Weather alert created and notifications sent!', 'success');
          setWeatherAlert(res.data.alert);
        } else {
          showToast('No severe weather conditions detected', 'info');
        }
      }
    } catch (error) {
      console.error('Error creating weather alert:', error);
      showToast(error.response?.data?.message || 'Failed to create weather alert', 'error');
    } finally {
      setCreatingAlert(false);
    }
  };

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

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'danger':
        return faExclamationTriangle;
      case 'warning':
        return faExclamationTriangle;
      case 'info':
        return faInfoCircle;
      default:
        return faCheckCircle;
    }
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, background: 'linear-gradient(to right, #0f2c63 0%, #f97316 100%)', overflowY: 'auto' }}>
        <Header title="Weather Management" />
        
        <div style={{ padding: '30px', minHeight: 'calc(100vh - 80px)', marginTop: '140px' }}>
          {/* Configuration Notice */}
          {!configured && (
            <div style={{
              background: '#fee2e2',
              border: '2px solid #dc2626',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '30px',
              color: '#991b1b'
            }}>
              <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '10px' }} />
              <strong>Weather API Not Configured</strong>
              <p style={{ margin: '10px 0 0 0', fontSize: '14px' }}>
                Please add OPENWEATHER_API_KEY to your backend .env file. 
                Get your free API key from: <a href="https://openweathermap.org/api" target="_blank" rel="noopener noreferrer" style={{ color: '#dc2626', textDecoration: 'underline' }}>openweathermap.org/api</a>
              </p>
            </div>
          )}

          {/* Search Bar */}
          <div style={{
            background: '#fff',
            padding: '25px',
            borderRadius: '15px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            marginBottom: '30px'
          }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e293b' }}>
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter city name"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ width: '120px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e293b' }}>
                  Country
                </label>
                <input
                  type="text"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  placeholder="PH"
                  maxLength={2}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    fontSize: '14px',
                    textTransform: 'uppercase'
                  }}
                />
              </div>
              <button
                onClick={fetchCurrentWeather}
                disabled={loading || !configured}
                style={{
                  padding: '12px 24px',
                  background: configured 
                    ? 'linear-gradient(135deg, #0f2c63 0%, #f97316 100%)'
                    : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: configured ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FontAwesomeIcon icon={faSearch} />
                Get Weather
              </button>
              <button
                onClick={fetchForecast}
                disabled={loading || !configured}
                style={{
                  padding: '12px 24px',
                  background: configured 
                    ? 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)'
                    : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: configured ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FontAwesomeIcon icon={faRefresh} />
                Forecast
              </button>
            </div>
          </div>

          {/* Current Weather */}
          {weather && (
            <div style={{
              background: '#fff',
              padding: '30px',
              borderRadius: '15px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              marginBottom: '30px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#1e293b', fontSize: '24px', fontWeight: '700' }}>
                  Current Weather - {weather.city}, {weather.country}
                </h2>
                <FontAwesomeIcon 
                  icon={getWeatherIcon(weather.main)} 
                  style={{ fontSize: '48px', color: '#f97316' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                  <div style={{ fontSize: '48px', fontWeight: '700', color: '#0f2c63' }}>
                    {weather.temperature}°C
                  </div>
                  <div style={{ color: '#64748b', marginTop: '5px' }}>
                    Feels like {weather.feelsLike}°C
                  </div>
                </div>
                
                <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <FontAwesomeIcon icon={faCloudSun} style={{ color: '#64748b' }} />
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>Condition</span>
                  </div>
                  <div style={{ fontSize: '18px', color: '#0f2c63', textTransform: 'capitalize' }}>
                    {weather.description}
                  </div>
                </div>

                <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <FontAwesomeIcon icon={faWind} style={{ color: '#64748b' }} />
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>Wind Speed</span>
                  </div>
                  <div style={{ fontSize: '18px', color: '#0f2c63' }}>
                    {Math.round(weather.windSpeed * 3.6)} km/h
                  </div>
                </div>

                <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <FontAwesomeIcon icon={faTemperatureHigh} style={{ color: '#64748b' }} />
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>Humidity</span>
                  </div>
                  <div style={{ fontSize: '18px', color: '#0f2c63' }}>
                    {weather.humidity}%
                  </div>
                </div>

                {weather.visibility && (
                  <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <FontAwesomeIcon icon={faEye} style={{ color: '#64748b' }} />
                      <span style={{ fontWeight: '600', color: '#1e293b' }}>Visibility</span>
                    </div>
                    <div style={{ fontSize: '18px', color: '#0f2c63' }}>
                      {weather.visibility} km
                    </div>
                  </div>
                )}
              </div>

              {/* Weather Alert */}
              {weatherAlert && weatherAlert.hasAlert && (
                <div style={{
                  background: weatherAlert.severity === 'danger' ? '#fee2e2' : 
                             weatherAlert.severity === 'warning' ? '#fef3c7' : '#dbeafe',
                  border: `2px solid ${getSeverityColor(weatherAlert.severity)}`,
                  padding: '20px',
                  borderRadius: '12px',
                  marginTop: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <FontAwesomeIcon 
                      icon={getSeverityIcon(weatherAlert.severity)} 
                      style={{ color: getSeverityColor(weatherAlert.severity), fontSize: '20px' }} 
                    />
                    <h3 style={{ margin: 0, color: getSeverityColor(weatherAlert.severity), textTransform: 'uppercase' }}>
                      {weatherAlert.severity} Alert
                    </h3>
                  </div>
                  <p style={{ margin: 0, color: '#1e293b' }}>{weatherAlert.message}</p>
                  
                  {weatherAlert.alerts && weatherAlert.alerts.length > 0 && (
                    <div style={{ marginTop: '15px' }}>
                      {weatherAlert.alerts.map((alert, idx) => (
                        <div key={idx} style={{ 
                          padding: '10px', 
                          background: 'rgba(255, 255, 255, 0.5)', 
                          borderRadius: '8px',
                          marginTop: '8px'
                        }}>
                          <strong>{alert.condition}:</strong> {alert.message}
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={createWeatherAlert}
                    disabled={creatingAlert}
                    style={{
                      marginTop: '15px',
                      padding: '10px 20px',
                      background: getSeverityColor(weatherAlert.severity),
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FontAwesomeIcon icon={faBell} />
                    {creatingAlert ? 'Creating Alert...' : 'Create Alert & Notify Instructors'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Forecast */}
          {forecast && forecast.forecast && (
            <div style={{
              background: '#fff',
              padding: '30px',
              borderRadius: '15px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
            }}>
              <h2 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '24px', fontWeight: '700' }}>
                5-Day Forecast - {forecast.city}
              </h2>
              <div style={{ display: 'grid', gap: '15px' }}>
                {forecast.forecast.map((day, idx) => (
                  <div key={idx} style={{
                    padding: '20px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#0f2c63', fontSize: '18px' }}>
                      {day.dayName} - {day.date}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                      {day.forecasts.slice(0, 4).map((item, itemIdx) => (
                        <div key={itemIdx} style={{
                          padding: '12px',
                          background: 'white',
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px' }}>
                            {item.time}
                          </div>
                          <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f2c63' }}>
                            {item.temperature}°C
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'capitalize', marginTop: '5px' }}>
                            {item.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'white' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
              <p>Loading weather data...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WeatherManagement;

