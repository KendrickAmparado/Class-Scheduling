import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * OpenWeatherMap API Service
 * 
 * Provides weather data and weather-based alert functionality
 * for class scheduling system.
 */

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Check if OpenWeatherMap is configured
 */
export const isWeatherConfigured = () => {
  return !!OPENWEATHER_API_KEY;
};

/**
 * Get current weather by city name
 * @param {string} city - City name (e.g., "Manila", "Cebu")
 * @param {string} countryCode - Optional country code (e.g., "PH")
 * @returns {Promise<Object>} Weather data
 */
export const getCurrentWeather = async (city, countryCode = 'PH') => {
  try {
    if (!isWeatherConfigured()) {
      throw new Error('OpenWeatherMap API key is not configured');
    }

    const query = countryCode ? `${city},${countryCode}` : city;
    const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
      params: {
        q: query,
        appid: OPENWEATHER_API_KEY,
        units: 'metric', // Use Celsius
        lang: 'en'
      }
    });

    return {
      success: true,
      data: {
        city: response.data.name,
        country: response.data.sys.country,
        temperature: Math.round(response.data.main.temp),
        feelsLike: Math.round(response.data.main.feels_like),
        description: response.data.weather[0].description,
        main: response.data.weather[0].main,
        icon: response.data.weather[0].icon,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind?.speed || 0,
        visibility: response.data.visibility ? (response.data.visibility / 1000).toFixed(1) : null,
        pressure: response.data.main.pressure,
        timestamp: new Date(response.data.dt * 1000).toISOString()
      }
    };
  } catch (error) {
    console.error('Error fetching weather:', error.message);
    console.error('Error response:', error.response?.data);
    
    if (error.response?.status === 401) {
      const errorMsg = error.response?.data?.message || 'Invalid API key';
      throw new Error(`Invalid OpenWeatherMap API key. Please check your OPENWEATHER_API_KEY in .env file. Error: ${errorMsg}`);
    } else if (error.response?.status === 404) {
      throw new Error(`City "${city}" not found`);
    } else if (error.response?.status === 429) {
      throw new Error('OpenWeatherMap API rate limit exceeded. Please try again later.');
    } else if (error.response?.status === 400) {
      throw new Error(`Invalid request: ${error.response?.data?.message || 'Bad request'}`);
    }
    throw new Error(`Failed to fetch weather: ${error.message}`);
  }
};

/**
 * Get weather forecast (5-day forecast with 3-hour intervals)
 * @param {string} city - City name
 * @param {string} countryCode - Optional country code
 * @returns {Promise<Object>} Forecast data
 */
export const getWeatherForecast = async (city, countryCode = 'PH') => {
  try {
    if (!isWeatherConfigured()) {
      throw new Error('OpenWeatherMap API key is not configured');
    }

    const query = countryCode ? `${city},${countryCode}` : city;
    const response = await axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
      params: {
        q: query,
        appid: OPENWEATHER_API_KEY,
        units: 'metric',
        lang: 'en'
      }
    });

    // Group forecast by day
    const forecastByDay = {};
    response.data.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!forecastByDay[dateKey]) {
        forecastByDay[dateKey] = {
          date: dateKey,
          dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
          forecasts: []
        };
      }

      forecastByDay[dateKey].forecasts.push({
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        temperature: Math.round(item.main.temp),
        description: item.weather[0].description,
        main: item.weather[0].main,
        icon: item.weather[0].icon,
        humidity: item.main.humidity,
        windSpeed: item.wind?.speed || 0,
        precipitation: item.rain?.['3h'] || item.snow?.['3h'] || 0
      });
    });

    return {
      success: true,
      data: {
        city: response.data.city.name,
        country: response.data.city.country,
        forecast: Object.values(forecastByDay),
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error fetching weather forecast:', error.message);
    if (error.response?.status === 401) {
      throw new Error('Invalid OpenWeatherMap API key');
    } else if (error.response?.status === 404) {
      throw new Error(`City "${city}" not found`);
    }
    throw new Error(`Failed to fetch weather forecast: ${error.message}`);
  }
};

/**
 * Check if weather conditions warrant a class cancellation alert
 * @param {Object} weatherData - Weather data from getCurrentWeather
 * @returns {Object} Alert recommendation
 */
export const checkWeatherAlert = (weatherData) => {
  const { main, description, windSpeed, visibility, temperature } = weatherData;
  
  const alerts = [];
  let severity = 'info'; // 'info', 'warning', 'danger'
  let message = '';

  // Check for severe weather conditions
  if (main === 'Thunderstorm' || main === 'Squall') {
    alerts.push({
      type: 'weather-danger',
      severity: 'danger',
      condition: 'Thunderstorm',
      message: 'Severe thunderstorms detected. Classes may be cancelled.'
    });
    severity = 'danger';
  }

  if (main === 'Rain' && description.includes('heavy') || description.includes('extreme')) {
    alerts.push({
      type: 'weather-warning',
      severity: 'warning',
      condition: 'Heavy Rain',
      message: 'Heavy rainfall expected. Please check for class cancellations.'
    });
    if (severity !== 'danger') severity = 'warning';
  }

  if (windSpeed > 15) { // Wind speed > 15 m/s (54 km/h) - strong wind
    alerts.push({
      type: 'weather-warning',
      severity: 'warning',
      condition: 'Strong Winds',
      message: `Strong winds detected (${Math.round(windSpeed * 3.6)} km/h). Exercise caution.`
    });
    if (severity !== 'danger') severity = 'warning';
  }

  if (visibility && visibility < 1) { // Visibility < 1 km
    alerts.push({
      type: 'weather-warning',
      severity: 'warning',
      condition: 'Poor Visibility',
      message: 'Poor visibility conditions. Travel with caution.'
    });
    if (severity !== 'danger') severity = 'warning';
  }

  if (temperature > 38) { // Very hot weather
    alerts.push({
      type: 'weather-info',
      severity: 'info',
      condition: 'High Temperature',
      message: `High temperature (${temperature}°C). Stay hydrated and take breaks.`
    });
  }

  if (temperature < 10) { // Very cold weather
    alerts.push({
      type: 'weather-info',
      severity: 'info',
      condition: 'Low Temperature',
      message: `Cold weather (${temperature}°C). Dress warmly.`
    });
  }

  // Generate main message
  if (alerts.length > 0) {
    const mainAlert = alerts.find(a => a.severity === 'danger') || 
                     alerts.find(a => a.severity === 'warning') || 
                     alerts[0];
    message = mainAlert.message;
  }

  return {
    hasAlert: alerts.length > 0,
    severity,
    alerts,
    message,
    weatherSummary: {
      condition: main,
      description,
      temperature,
      windSpeed: Math.round(windSpeed * 3.6), // Convert to km/h
      visibility
    }
  };
};

/**
 * Get weather by coordinates (latitude, longitude)
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Weather data
 */
export const getWeatherByCoordinates = async (lat, lon) => {
  try {
    if (!isWeatherConfigured()) {
      throw new Error('OpenWeatherMap API key is not configured');
    }

    const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        appid: OPENWEATHER_API_KEY,
        units: 'metric',
        lang: 'en'
      }
    });

    return {
      success: true,
      data: {
        city: response.data.name,
        country: response.data.sys.country,
        temperature: Math.round(response.data.main.temp),
        feelsLike: Math.round(response.data.main.feels_like),
        description: response.data.weather[0].description,
        main: response.data.weather[0].main,
        icon: response.data.weather[0].icon,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind?.speed || 0,
        visibility: response.data.visibility ? (response.data.visibility / 1000).toFixed(1) : null,
        pressure: response.data.main.pressure,
        timestamp: new Date(response.data.dt * 1000).toISOString()
      }
    };
  } catch (error) {
    console.error('Error fetching weather by coordinates:', error.message);
    throw new Error(`Failed to fetch weather: ${error.message}`);
  }
};

