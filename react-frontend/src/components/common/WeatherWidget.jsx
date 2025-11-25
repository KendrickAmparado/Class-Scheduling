import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudSun, faCloudRain, faSun, faCloud, faBolt, faWind, faTemperatureHigh } from '@fortawesome/free-solid-svg-icons';

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [weatherAlert, setWeatherAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${apiBase}/api/weather/current?city=Malaybalay&countryCode=PH`);
        if (response.ok) {
          const data = await response.json();
          setWeather(data.weather);
          setWeatherAlert(data.alert);
        }
      } catch (error) {
        console.error('Error fetching weather:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [apiBase]);

  const getWeatherIcon = (weatherMain) => {
    if (!weatherMain) return faSun;
    const lower = weatherMain.toLowerCase();
    if (lower.includes('cloud') && lower.includes('rain')) return faCloudRain;
    if (lower.includes('rain')) return faCloudRain;
    if (lower.includes('cloud')) return faCloud;
    if (lower.includes('clear') || lower.includes('sunny')) return faSun;
    if (lower.includes('thunder') || lower.includes('storm')) return faBolt;
    return faCloudSun;
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'moderate': return '#f97316';
      case 'low': return '#eab308';
      default: return '#0f172a';
    }
  };

  if (loading || !weather) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ fontSize: '12px', color: '#ffffff' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderRadius: '10px',
        background: weatherAlert ? `linear-gradient(135deg, rgba(${getSeverityColor(weatherAlert.severity) === '#ef4444' ? '239, 68, 68' : getSeverityColor(weatherAlert.severity) === '#f97316' ? '249, 115, 22' : '234, 179, 8'}, 0.15), rgba(255, 255, 255, 0.1))` : 'rgba(255, 255, 255, 0.1)',
        border: weatherAlert ? `1px solid ${getSeverityColor(weatherAlert.severity)}` : '1px solid rgba(255, 255, 255, 0.2)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <FontAwesomeIcon
        icon={getWeatherIcon(weather.main)}
        style={{
          fontSize: '18px',
          color: '#ffffff',
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        <div
          style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#ffffff',
            lineHeight: '1',
          }}
        >
          {weather.temperature}°C
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: '1',
          }}
        >
          {weather.description}
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            bottom: '-220px',
            right: '0',
            background: '#1e293b',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '16px',
            minWidth: '220px',
            color: '#ffffff',
            fontSize: '13px',
            zIndex: 1001,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '8px', color: '#f97316' }}>
            Weather Details
          </div>
          <div
            style={{
              display: 'grid',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>Condition:</span>
              <strong>{weather.description}</strong>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>Temperature:</span>
              <strong>{weather.temperature}°C</strong>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>Feels Like:</span>
              <strong>{weather.feelsLike}°C</strong>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>Humidity:</span>
              <strong>{weather.humidity}%</strong>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>Wind Speed:</span>
              <strong>{Math.round(weather.windSpeed * 3.6)} km/h</strong>
            </div>
            {weatherAlert && (
              <div
                style={{
                  marginTop: '8px',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  color: getSeverityColor(weatherAlert.severity),
                }}
              >
                <strong>⚠️ Alert ({weatherAlert.severity.toUpperCase()}):</strong>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  {weatherAlert.message}
                </div>
              </div>
            )}
          </div>
          <style>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(-10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;
