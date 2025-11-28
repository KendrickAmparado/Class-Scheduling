# Environment Setup Guide for Team Members

## Overview
This project uses environment variables for sensitive credentials. **Never commit `.env` files** — they are gitignored for security.

## Quick Setup

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and fill in your credentials:
- **MONGO_URI**: MongoDB Atlas connection string
- **EMAIL_USER / EMAIL_PASS**: Gmail SMTP credentials (use [App Passwords](https://support.google.com/accounts/answer/185833))
- **JWT_SECRET**: Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- **GOOGLE_*** : Google Cloud Service Account credentials
- **OPENWEATHER_API_KEY**: OpenWeatherMap API key
- **RECAPTCHA_SECRET_KEY**: reCAPTCHA secret from Google

### 2. Frontend Setup
```bash
cd react-frontend
cp .env.example .env
```

Edit `react-frontend/.env` and fill in:
- **REACT_APP_RECAPTCHA_SITE_KEY**: Public reCAPTCHA site key (already in `.env`)
- **REACT_APP_API_BASE**: Backend API URL (default: `http://localhost:5000`)

### 3. Run Locally
```bash
# Terminal 1 - Backend
cd backend
npm install
node server.js

# Terminal 2 - Frontend
cd react-frontend
npm install
npm start
```

## API Credentials to Obtain

### MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster and database user
3. Copy connection string to `MONGO_URI`

### Google Cloud (Calendar & Drive)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google Calendar API
4. Create a Service Account
5. Download the private key JSON
6. Fill: `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_PROJECT_ID`

### Gmail SMTP (Email Notifications)
1. Enable 2FA on your Gmail account
2. Generate [App Password](https://support.google.com/accounts/answer/185833)
3. Use app password as `EMAIL_PASS`

### reCAPTCHA
1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Create a new site (v3 or v2 checkbox)
3. Get Site Key → `REACT_APP_RECAPTCHA_SITE_KEY` (frontend)
4. Get Secret Key → `RECAPTCHA_SECRET_KEY` (backend)

### OpenWeatherMap API
1. Sign up at [OpenWeatherMap](https://openweathermap.org/api)
2. Generate API key from dashboard
3. Copy to `OPENWEATHER_API_KEY`

### Sentry (Error Tracking - Optional)
1. Sign up at [Sentry.io](https://sentry.io)
2. Create a new project (Node.js + React)
3. Copy DSN to `SENTRY_DSN`

## Security Checklist
- ✅ `.env` files are in `.gitignore` (never committed)
- ✅ `.env.example` shows what variables are needed (no secrets)
- ✅ Each team member has their own `.env` with their credentials
- ✅ Secrets are rotated if repository is accidentally exposed
- ✅ Use app-specific passwords for Gmail (not main password)

## Troubleshooting

**"Cannot find module" or "MONGO_URI is undefined"**
→ Check that `.env` file exists and has all required variables

**"401 Unauthorized" on API calls**
→ Check `JWT_SECRET` is the same in backend `.env`

**"Google Calendar unavailable"**
→ Verify `GOOGLE_PRIVATE_KEY` has proper formatting (newlines as `\n`)

**Port 5000 already in use**
→ Kill Node process: `Get-Process node | Stop-Process -Force` (Windows)

---

For questions, ask the team lead or check the documentation files in the project root.
