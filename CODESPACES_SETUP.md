# NorthStar App - Codespaces Setup Guide

## 🎉 Configuration Complete!

Your NorthStar app is now fully configured to run in GitHub Codespaces with proper port forwarding and all integration placeholders.

---

## 🚀 Quick Start

### Start Both Servers
```bash
npm run start:all
```

This will start:
- **Frontend** (Vite) on port **5173**
- **Backend** (Node.js) on port **5000**

### Start Servers Individually
```bash
# Frontend only
npm run dev

# Backend only (production mode)
npm run server

# Backend only (dev mode with auto-reload)
npm run server:dev
```

---

## 🌐 Access Your App

### Local URLs
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **Backend Health**: http://localhost:5000/health
- **Integrations API**: http://localhost:5000/api/integrations

### Codespaces Public URLs
After making ports public (see instructions below):
- **Frontend**: `https://<your-codespace>-5173.app.github.dev`
- **Backend**: `https://<your-codespace>-5000.app.github.dev`

---

## 📋 Making Ports Public in Codespaces

1. Open the **PORTS** tab at the bottom of VS Code
2. Find port **5173** in the list
3. Click the **lock icon** 🔒 in the Visibility column
4. Select **Public** from the dropdown
5. Repeat for port **5000**
6. Click the **globe icon** 🌐 next to port 5173 to open the app in your browser

---

## 🔌 Integration Placeholders

The following wearable integration placeholders have been created:

### Backend API Endpoints
All available at `/api/integrations/<provider>`:

1. **Health Connect** - `/api/integrations/healthconnect`
   - Android health data platform
   - Status: Coming Soon

2. **Fitbit** - `/api/integrations/fitbit`
   - Fitness tracker integration
   - Requires: OAuth
   - Status: Coming Soon

3. **Strava** - `/api/integrations/strava`
   - Athletic activity tracking
   - Requires: OAuth
   - Status: Coming Soon

4. **Apple HealthKit** - `/api/integrations/apple`
   - iOS health data
   - Requires: iOS app + business agreement
   - Status: Coming Soon

5. **Oura Ring** - `/api/integrations/oura`
   - Sleep and readiness tracking
   - Requires: OAuth
   - Status: Coming Soon

6. **WHOOP** - `/api/integrations/whoop`
   - Strain and recovery tracking
   - Requires: OAuth
   - Status: Coming Soon

7. **Garmin** - `/api/integrations/garmin`
   - Multi-sport tracking
   - Requires: OAuth + business agreement
   - Status: Coming Soon

### Frontend UI
- Navigate to **Settings → Health Integrations** to see all integration cards
- Each card shows:
  - Provider name and description
  - "Coming Soon" badge
  - Disabled "Connect" button
  - Tooltip explaining why it's not available yet

### Environment Variables
All placeholders are in `.env.development`:
```bash
HEALTHCONNECT_ENABLED=false
FITBIT_CLIENT_ID=
FITBIT_CLIENT_SECRET=
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
APPLE_HEALTHKIT_ENABLED=false
OURA_API_KEY=
WHOOP_CLIENT_ID=
WHOOP_CLIENT_SECRET=
GARMIN_CLIENT_ID=
GARMIN_CLIENT_SECRET=
```

---

## 🔧 Configuration Details

### CORS Configuration
The backend now accepts requests from:
- `http://localhost:5173`
- `http://localhost:5000`
- Any `*.github.dev` domain (Codespaces)
- Any `*.githubpreview.dev` domain

### Port Configuration
- **Frontend (Vite)**: Explicitly set to port 5173 in `vite.config.js`
- **Backend (Express)**: Set to port 5000 in `backend/server.js`

### Auto-Reload
- Frontend: Hot Module Replacement (HMR) via Vite
- Backend: Nodemon watches for file changes in dev mode

---

## 🧪 Testing the Setup

### Verify Servers Are Running
```bash
lsof -i :5000 -i :5173 | grep LISTEN
```

### Test Backend Health
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-12-03T...","message":"NorthStar Backend is running"}
```

### Test Integrations API
```bash
curl http://localhost:5000/api/integrations
```

Expected response: JSON with 7 integration providers

### Test Individual Integration
```bash
curl http://localhost:5000/api/integrations/fitbit
```

Expected response:
```json
{
  "status":"pending",
  "provider":"Fitbit",
  "message":"Fitbit integration requires OAuth implementation. Coming soon.",
  "requiresOAuth":true,
  "requiresBusinessAgreement":false
}
```

---

## 🛠️ Troubleshooting

### Ports Not Listening
```bash
# Kill existing processes
pkill -f "node backend/server.js"
pkill -f "vite"

# Restart servers
npm run start:all
```

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
docker ps | grep mongo

# Start MongoDB if not running
docker start mongodb

# Or create new MongoDB container
docker run -d --name mongodb -p 27017:27017 mongo:latest
```

### CORS Errors
- Ensure both ports are set to **Public** in the PORTS tab
- Check that the backend CORS configuration allows your domain
- Verify `CLIENT_URL` in `.env.development` matches your frontend URL

### Frontend White Screen
- Check browser console for errors (F12)
- Verify backend is running: `curl http://localhost:5000/health`
- Check that API requests are not being blocked by CORS

---

## 📦 Dependencies

### Root Package
- `nodemon` - Auto-restart backend on file changes
- `concurrently` - Run multiple npm scripts simultaneously

### Backend
- Environment variables loaded via `loadEnv.js` before any imports
- All AI API keys configured (OpenAI, Anthropic)
- MongoDB connected to `northstar-dev` database

### Frontend
- Vite dev server with HMR
- React 18 with StrictMode
- Tailwind CSS for styling

---

## 🔄 Future Development

To activate an integration:

1. **Get API Credentials**
   - Register your app with the provider (e.g., Fitbit, Strava)
   - Obtain OAuth client ID and secret

2. **Update Environment Variables**
   - Add credentials to `.env.development`
   - Example: `FITBIT_CLIENT_ID=your_client_id_here`

3. **Implement OAuth Flow**
   - Add OAuth endpoints in `backend/routes/integrations.js`
   - Create OAuth callback handlers
   - Store tokens securely in database

4. **Update Frontend**
   - Change integration status from `coming_soon` to `available`
   - Enable the "Connect" button
   - Add OAuth redirect flow

5. **Test Integration**
   - Complete OAuth flow
   - Verify data sync from provider
   - Test disconnect functionality

---

## 📝 Notes

- **MongoDB** must be running for the backend to work
- **API Keys** for OpenAI and Anthropic are configured
- All **7 integration placeholders** are functional and tested
- **CORS** is configured for Codespaces and localhost
- Both servers can run **concurrently** without conflicts

---

## 🎯 Current Status

✅ Backend running on port 5000  
✅ Frontend running on port 5173  
✅ MongoDB connected  
✅ CORS configured for Codespaces  
✅ 7 integration placeholders created  
✅ All API endpoints tested and working  
✅ Environment variables configured  
✅ Auto-reload enabled for development  

**Your NorthStar app is ready to use!** 🌟
