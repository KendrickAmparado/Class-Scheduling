# OpenWeatherMap API Integration Setup

This guide will help you integrate OpenWeatherMap API for weather-based alerts and class cancellation notifications in your Class Scheduling System.

## Overview

The OpenWeatherMap integration provides:
- **Current weather data** for any city
- **5-day weather forecast** for planning
- **Automatic weather alerts** when severe conditions are detected
- **Class cancellation recommendations** based on weather conditions

## Features

### 1. Current Weather
Get real-time weather information including:
- Temperature (Celsius)
- Weather conditions (rain, thunderstorm, etc.)
- Wind speed
- Visibility
- Humidity
- Pressure

### 2. Weather Forecast
5-day forecast with 3-hour intervals showing:
- Daily forecasts grouped by date
- Temperature trends
- Precipitation predictions
- Wind conditions

### 3. Weather Alerts
Automatic detection of severe weather conditions:
- **Danger**: Thunderstorms, severe storms
- **Warning**: Heavy rain, strong winds, poor visibility
- **Info**: Extreme temperatures

### 4. Automatic Notifications
When severe weather is detected, the system can:
- Create system-wide alerts
- Notify all active instructors
- Send real-time updates via WebSocket

## Setup Instructions

### Step 1: Get OpenWeatherMap API Key

1. Visit [OpenWeatherMap.org](https://openweathermap.org/)
2. Click **"Sign Up"** or **"API keys"** in your account
3. Create a free account (if you don't have one)
4. Navigate to **"API keys"** section
5. Copy your API key

**Free Tier Limits:**
- 60 API calls per minute
- 1,000,000 calls per month
- Current weather and 5-day forecast included

### Step 2: Configure Environment Variables

1. Open your `backend/.env` file
2. Add your OpenWeatherMap API key:

```env
OPENWEATHER_API_KEY=your-api-key-here
```

3. Save the file
4. **Restart your backend server** for changes to take effect

### Step 3: Verify Installation

Test the weather API by visiting:
```
http://localhost:5000/api/weather/status
```

You should see:
```json
{
  "success": true,
  "configured": true,
  "message": "OpenWeatherMap API is configured"
}
```

## API Endpoints

### 1. Get Current Weather
```
GET /api/weather/current?city=Manila&countryCode=PH
```

**Response:**
```json
{
  "success": true,
  "weather": {
    "city": "Manila",
    "country": "PH",
    "temperature": 32,
    "description": "scattered clouds",
    "main": "Clouds",
    "windSpeed": 5.2,
    "humidity": 65
  },
  "alert": {
    "hasAlert": false,
    "severity": "info",
    "alerts": []
  }
}
```

### 2. Get Weather Forecast
```
GET /api/weather/forecast?city=Manila&countryCode=PH
```

### 3. Get Weather by Coordinates
```
GET /api/weather/coordinates?lat=14.5995&lon=120.9842
```

### 4. Check Weather and Create Alert (Admin)
```
POST /api/weather/check-and-alert
Authorization: Bearer <token>
Content-Type: application/json

{
  "city": "Manila",
  "countryCode": "PH",
  "autoCreateAlert": true
}
```

This endpoint:
- Checks current weather
- Analyzes conditions
- Creates system alerts if severe weather detected
- Notifies all instructors automatically

### 5. Check Service Status
```
GET /api/weather/status
```

## Usage Examples

### Example 1: Check Weather for Campus
```javascript
// Frontend
const response = await fetch('http://localhost:5000/api/weather/current?city=Manila&countryCode=PH');
const data = await response.json();

if (data.alert.hasAlert) {
  console.log('Weather Alert:', data.alert.message);
  // Show alert to users
}
```

### Example 2: Create Weather Alert (Admin)
```javascript
const response = await fetch('http://localhost:5000/api/weather/check-and-alert', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    city: 'Manila',
    countryCode: 'PH',
    autoCreateAlert: true
  })
});

const result = await response.json();
if (result.alertCreated) {
  console.log('Weather alert created:', result.alertId);
}
```

### Example 3: Get Forecast for Planning
```javascript
const response = await fetch('http://localhost:5000/api/weather/forecast?city=Manila');
const data = await response.json();

data.forecast.forecast.forEach(day => {
  console.log(`${day.dayName}: ${day.forecasts[0].temperature}°C`);
});
```

## Weather Alert Conditions

The system automatically detects:

| Condition | Severity | Threshold |
|-----------|----------|-----------|
| Thunderstorm | Danger | Any thunderstorm detected |
| Heavy Rain | Warning | Heavy/extreme rain |
| Strong Winds | Warning | > 15 m/s (54 km/h) |
| Poor Visibility | Warning | < 1 km |
| High Temperature | Info | > 38°C |
| Low Temperature | Info | < 10°C |

## Integration with Notifications

When severe weather is detected and `autoCreateAlert: true`:
1. System alert is created in the database
2. All active instructors receive notifications
3. Real-time WebSocket event is emitted
4. Alert appears in admin dashboard

## Scheduled Weather Checks (Optional)

You can set up a scheduled job to check weather periodically:

```javascript
// Example: Check weather every 6 hours
const cron = require('node-cron');

cron.schedule('0 */6 * * *', async () => {
  const response = await fetch('http://localhost:5000/api/weather/check-and-alert', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      city: 'Manila',
      countryCode: 'PH',
      autoCreateAlert: true
    })
  });
});
```

## Error Handling

The API handles common errors:

- **401**: Invalid API key
- **404**: City not found
- **429**: Rate limit exceeded
- **500**: Server error

All errors return user-friendly messages.

## Best Practices

1. **Cache weather data** - Don't call the API too frequently (free tier: 60 calls/min)
2. **Set up monitoring** - Watch for rate limit errors
3. **Use appropriate cities** - Use your campus location
4. **Handle errors gracefully** - Weather service is optional, don't break the app if it fails
5. **Schedule checks wisely** - For automatic checks, use reasonable intervals (e.g., every 6 hours)

## Troubleshooting

### API Key Not Working
- Verify the key is correct in `.env`
- Check if you've activated the API key in OpenWeatherMap dashboard
- Ensure you're using the correct API key (not the example key)

### Rate Limit Exceeded
- Free tier: 60 calls/minute
- Reduce frequency of API calls
- Consider caching weather data
- Upgrade to paid plan if needed

### City Not Found
- Use proper city names (e.g., "Manila" not "manila city")
- Include country code for clarity: `?city=Manila&countryCode=PH`
- Check spelling

### Weather Service Not Configured
- Ensure `OPENWEATHER_API_KEY` is set in `.env`
- Restart backend server after adding the key
- Check `/api/weather/status` endpoint

## Support

For issues with:
- **OpenWeatherMap API**: Visit [OpenWeatherMap Support](https://openweathermap.org/faq)
- **Integration**: Check server logs for detailed error messages

## Resources

- [OpenWeatherMap API Documentation](https://openweathermap.org/api)
- [OpenWeatherMap Pricing](https://openweathermap.org/price)
- [Weather Condition Codes](https://openweathermap.org/weather-conditions)

