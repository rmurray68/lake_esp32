# Lake ESP32 Dashboard - Local Development Guide

## Overview
Web dashboard for monitoring ESP32 devices and controlling Logmor switch via AWS infrastructure.

## Architecture

### Two Separate Devices
1. **ESP32 (URL_Monitor_XIAO)** - Monitored via DynamoDB table `LakeHouse_Logs`
2. **Logmor Switch** - Controlled via Particle.io API through AWS Lambda

### Local Development Stack
- **Frontend**: React + TypeScript + Vite + Material-UI
- **Backend**: Express.js server (local proxy to AWS services)
- **Auth**: AWS Cognito
- **Data Sources**: 
  - DynamoDB for ESP32 metrics
  - Lambda Function URL for Logmor control

## Prerequisites
- Node.js (v18+)
- AWS CLI configured with credentials
- Access to AWS account 326185794606 (us-east-1)

## Local Development Setup

### 1. Install Dependencies
```bash
cd web-dashboard
npm install
```

### 2. Start Local Backend Server
The backend server proxies requests to AWS services to avoid CORS issues during development.

```bash
# In terminal 1
cd web-dashboard
node server.js
```

This starts the Express server on `http://localhost:3001` with endpoints:
- `GET /api/device-status` - ESP32 status from DynamoDB
- `GET /api/logmor-status` - Logmor switch status from Lambda
- `GET /api/logs` - Recent ESP32 activity logs
- `POST /api/reboot` - Trigger Logmor reboot

### 3. Start Frontend Dev Server
```bash
# In terminal 2
cd web-dashboard
npm run dev
```

This starts Vite dev server on `http://localhost:5173`

### 4. Access the Dashboard
1. Open browser to `http://localhost:5173`
2. Login with Cognito credentials:
   - Email: `rpm228@gmail.com`
   - Password: `Rocky25$$`

## Project Structure

```
web-dashboard/
├── src/
│   ├── components/
│   │   ├── DashboardNew.tsx      # Main dashboard (responsive layout)
│   │   ├── DeviceStatusCard.tsx  # Device status display
│   │   └── RecentLogs.tsx        # Activity log table
│   ├── App.tsx                   # App shell with auth
│   ├── main.tsx                  # Entry point
│   ├── index.css                 # Global styles
│   └── amplify_outputs.json      # AWS config (Cognito, Lambda names)
├── server.js                     # Local backend proxy
└── package.json

amplify/
├── backend.ts                    # Amplify Gen 2 backend config
├── functions/
│   ├── getDeviceStatus/          # DynamoDB query Lambda
│   └── triggerReboot/            # Logmor control Lambda
└── auth/
    └── resource.ts               # Cognito configuration
```

## AWS Resources

### Cognito
- User Pool: `us-east-1_ZLHm2fLyp`
- Client: `2smngtn57ruleme3l989r9kpb6`
- Identity Pool: `us-east-1:1df23909-e246-45d5-9128-b0567d3f6ba6`

### DynamoDB
- Table: `LakeHouse_Logs`
- Schema: `device` (HASH), `timestamp` (RANGE), `uptime_sec`, `signal_strength`, `internet_ok`

### Lambda Functions
- `amplify-d2j2fgs50q0x7r-ma-getDeviceStatuslambda343-YS1v8iboZQeO`
- `amplify-d2j2fgs50q0x7r-ma-triggerRebootlambda9BD36-THihzcbBIL6B`
- `LakeHouse_Logmor_Controller` (existing Particle.io integration)

## Key Features

### Device Status Cards
- **ESP32 Monitor**: Shows last seen time, uptime, WiFi signal
- **Logmor Switch**: Shows online/unreachable status with reboot button

### Status Logic
- ESP32 shows "offline" if last DynamoDB record is >5 minutes old
- Logmor shows "unreachable" if Lambda times out (device unplugged)

### Recent Activity
- Displays last 10 ESP32 health check records from DynamoDB
- Updates every 60 seconds

### Responsive Design
- **Desktop (MacBook)**: 2-column grid for device cards
- **Mobile (iPhone)**: Stacked 1-column layout
- Full-width layout with proper padding

## Common Issues

### Changes Not Appearing
- Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Check both terminal servers are running
- Verify Vite shows HMR updates in console

### CORS Errors
- Use local backend server (server.js) instead of direct AWS calls
- Backend server at localhost:3001 handles CORS headers

### Authentication Issues
- Check `amplify_outputs.json` has correct Cognito details
- Verify AWS credentials have access to Cognito User Pool

## Production vs Development

### Local Development
- Uses `server.js` proxy on localhost:3001
- No CORS issues
- Fast iteration

### Amplify Deployment
- Frontend calls Lambda directly via AWS SDK
- Uses Cognito temporary credentials
- No local backend needed

## Next Steps
See [DEPLOYMENT.md](../DEPLOYMENT.md) for deploying to AWS Amplify.
