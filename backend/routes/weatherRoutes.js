import express from 'express';
import axios from 'axios';
import { verifyToken } from '../middleware/authMiddleware.js';
import { 
  getCurrentWeather, 
  getWeatherForecast, 
  getWeatherByCoordinates,
  checkWeatherAlert,
  isWeatherConfigured 
} from '../services/weatherService.js';
import Alert from '../models/Alert.js';
import InstructorNotification from '../models/InstructorNotification.js';
import Instructor from '../models/Instructor.js';
import { getSchedulerStatus, triggerWeatherCheck } from '../services/weatherScheduler.js';

const router = express.Router();

/**
 * GET /api/weather/current
 * Get current weather for a city
 * Query params: city (required), countryCode (optional, default: PH)
 */
router.get('/current', async (req, res) => {
  try {
    const { city, countryCode } = req.query;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: 'City name is required. Use ?city=Manila&countryCode=PH'
      });
    }

    const result = await getCurrentWeather(city, countryCode || 'PH');
    
    // Check if weather conditions warrant an alert
    const alertCheck = checkWeatherAlert(result.data);

    res.json({
      success: true,
      weather: result.data,
      alert: alertCheck,
      configured: isWeatherConfigured()
    });
  } catch (error) {
    console.error('Error fetching current weather:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch weather data',
      configured: isWeatherConfigured()
    });
  }
});

/**
 * GET /api/weather/forecast
 * Get 5-day weather forecast
 * Query params: city (required), countryCode (optional)
 */
router.get('/forecast', async (req, res) => {
  try {
    const { city, countryCode } = req.query;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: 'City name is required. Use ?city=Manila&countryCode=PH'
      });
    }

    const result = await getWeatherForecast(city, countryCode || 'PH');
    
    res.json({
      success: true,
      forecast: result.data,
      configured: isWeatherConfigured()
    });
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch weather forecast',
      configured: isWeatherConfigured()
    });
  }
});

/**
 * GET /api/weather/coordinates
 * Get weather by coordinates
 * Query params: lat (required), lon (required)
 */
router.get('/coordinates', async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required. Use ?lat=14.5995&lon=120.9842'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude or longitude values'
      });
    }

    const result = await getWeatherByCoordinates(latitude, longitude);
    const alertCheck = checkWeatherAlert(result.data);

    res.json({
      success: true,
      weather: result.data,
      alert: alertCheck,
      configured: isWeatherConfigured()
    });
  } catch (error) {
    console.error('Error fetching weather by coordinates:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch weather data',
      configured: isWeatherConfigured()
    });
  }
});

/**
 * POST /api/weather/check-and-alert
 * Check weather and create system alerts if severe conditions detected
 * Body: { city, countryCode, autoCreateAlert (boolean) }
 * Requires admin authentication
 */
router.post('/check-and-alert', verifyToken, async (req, res) => {
  try {
    const { city, countryCode = 'PH', autoCreateAlert = false } = req.body;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: 'City name is required'
      });
    }

    // Get current weather
    const result = await getCurrentWeather(city, countryCode);
    const alertCheck = checkWeatherAlert(result.data);

    // If severe weather and autoCreateAlert is true, create system alert
    if (alertCheck.hasAlert && autoCreateAlert && alertCheck.severity !== 'info') {
      const alertMessage = `⚠️ Weather Alert: ${alertCheck.message} | Current: ${result.data.description}, ${result.data.temperature}°C`;
      
      // Create system alert
      const alert = await Alert.create({
        type: 'weather-alert',
        message: alertMessage,
        meta: {
          severity: alertCheck.severity,
          weatherData: result.data,
          alerts: alertCheck.alerts,
          city
        }
      });

      // Notify all active instructors
      const instructors = await Instructor.find({ status: 'active' });
      const notifications = instructors.map(instructor => ({
        instructorEmail: instructor.email,
        title: 'Weather Alert',
        message: alertMessage,
        type: 'weather',
        read: false
      }));

      if (notifications.length > 0) {
        await InstructorNotification.insertMany(notifications);
      }

      // Emit socket event for real-time updates
      if (req.io) {
        req.io.emit('weather-alert', {
          alert,
          weather: result.data,
          alertCheck
        });
      }

      return res.json({
        success: true,
        weather: result.data,
        alert: alertCheck,
        alertCreated: true,
        alertId: alert._id
      });
    }

    res.json({
      success: true,
      weather: result.data,
      alert: alertCheck,
      alertCreated: false,
      message: autoCreateAlert ? 'No severe weather conditions detected' : 'Set autoCreateAlert=true to create alerts automatically'
    });
  } catch (error) {
    console.error('Error checking weather and creating alert:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check weather',
      configured: isWeatherConfigured()
    });
  }
});

/**
 * GET /api/weather/scheduler/status
 * Get weather scheduler status
 */
router.get('/scheduler/status', (req, res) => {
  try {
    const status = getSchedulerStatus();
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/weather/scheduler/trigger
 * Manually trigger weather check (admin only)
 */
router.post('/scheduler/trigger', verifyToken, async (req, res) => {
  try {
    await triggerWeatherCheck();
    res.json({
      success: true,
      message: 'Weather check triggered successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/weather/status
 * Check if weather service is configured
 */
router.get('/status', async (req, res) => {
  const configured = isWeatherConfigured();
  let keyValid = false;
  let keyError = null;

  if (configured) {
    // Test the API key by making a simple request
    try {
      const testResponse = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: {
          q: 'London',
          appid: process.env.OPENWEATHER_API_KEY,
          units: 'metric'
        },
        timeout: 5000
      });
      keyValid = testResponse.status === 200;
    } catch (error) {
      if (error.response?.status === 401) {
        keyValid = false;
        keyError = 'Invalid API key. Please check your OPENWEATHER_API_KEY in .env file. Make sure there are no extra spaces or quotes.';
      } else if (error.response?.status === 403) {
        keyValid = false;
        keyError = 'API key is valid but access is forbidden. Your API key may need to be activated. Visit https://openweathermap.org/api';
      } else {
        keyValid = false;
        keyError = `API key test failed: ${error.response?.data?.message || error.message}`;
      }
    }
  }

  res.json({
    success: true,
    configured,
    keyValid,
    keyError,
    message: !configured
      ? 'OpenWeatherMap API key is not configured. Add OPENWEATHER_API_KEY to .env file'
      : keyValid
      ? 'OpenWeatherMap API is configured and working'
      : keyError || 'API key is configured but validation failed'
  });
});

export default router;

