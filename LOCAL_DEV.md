# Local Development Guide

This document explains how to run the web dashboard locally.

## Architecture

The setup uses a **single code path** - both local development and production call the same Lambda functions:

### Local & Production (Unified)
```
Browser (localhost:5173 OR amplifyapp.com)
  ↓
AWS Amplify Auth (Cognito)
  ↓
AWS Lambda Functions (directly)
  ↓
AWS DynamoDB
```

The frontend uses the same API layer for both environments - no separate backend server needed.

## Quick Start

1. **Start the frontend dev server:**
```bash
cd web-dashboard
npm run dev
```

2. **Open browser:**
```
http://localhost:5173
```

3. **Sign in with Cognito credentials** - the app will call Lambda functions directly

## How It Works

### Unified API Layer
The frontend ([`src/services/api.ts`](web-dashboard/src/services/api.ts)) calls Lambda functions directly using AWS SDK:
```typescript
const session = await fetchAuthSession();
const lambda = new LambdaClient({
  region: 'us-east-1',
  credentials: session.credentials,
});
```

### Benefits
- ✅ **Zero code divergence** - Local and production use identical code paths
- ✅ **True production parity** - You're testing actual deployed Lambda functions
- ✅ **Single source of truth** - Lambda code is the only implementation
- ✅ **No proxy server** - Simpler setup, fewer moving parts
- ⚠️ **Lambda cold starts** - First request may take 1-2 seconds (acceptable for UI dev)

## AWS Resources

The application connects to these AWS resources:

### Cognito
- **User Pool:** `us-east-1_ZLHm2fLyp`
- **App Client:** `2smngtn57ruleme3l989r9kpb6`
- **User:** `rpm228@gmail.com`

### DynamoDB
- **Table Name:** `LakeHouse_Logs`
- **Primary Key:** 
  - Partition Key: `device` (String)
  - Sort Key: `timestamp` (Number - Unix timestamp in seconds)
- **Attributes:**
  - `uptime_sec` (Number)
  - `signal_strength` (Number - dBm)
  - `internet_ok` (Boolean)

### Lambda Functions
- **getDeviceStatus:** Queries DynamoDB for ESP32 latest status
- **getLogs:** Queries DynamoDB for recent activity (last 10 records)
- **triggerReboot:** Calls Logmor Lambda via Function URL to trigger reboot
- **LakeHouse_Logmor_Controller:** Existing Particle.io integration (called via Function URL)

## Environment Variables

No local `.env` file needed - the app uses Amplify outputs (`amplify_outputs.json`) which is auto-generated during deployment.

## Development Workflow

1. **Make UI changes** - frontend hot-reloads automatically (Vite)
2. **Test locally** - app calls production Lambda functions
3. **Need Lambda changes?** Deploy via `git push` (5-10 min build)
4. **Ready to deploy?** Run `npm run build` to verify, then `git push`

## Troubleshooting

### "getLogs function not configured"
Run `npx ampx generate outputs` to regenerate `amplify_outputs.json` with the latest Lambda function names.

### "Access Denied" calling Lambda
Check your AWS credentials and Cognito sign-in:
```bash
aws sts get-caller-identity
```

### Lambda cold starts (1-2 seconds)
First request after inactivity may be slow - this is normal. Subsequent requests are fast.

### Changes to Lambda functions
Lambda code changes require deployment:
1. Edit `amplify/functions/*/handler.ts`
2. Run `npm run build` to verify TypeScript compiles
3. Run `git push` to trigger Amplify build (5-10 minutes)
4. Lambda updates automatically

## Two-Device Architecture

The dashboard monitors two devices:

1. **ESP32 (URL_Monitor_XIAO)**
   - Hardware: Seeed Studio XIAO ESP32
   - Function: Monitors internet connectivity, sends status to DynamoDB
   - Data: uptime, WiFi signal strength, internet status, timestamp
   - Status: Queried via `getDeviceStatus` Lambda

2. **Logmor Switch (logmor-switch-01)**
   - Hardware: Particle.io-based smart switch
   - Function: Controls power to devices
   - Control: Reboot via `triggerReboot` Lambda → Function URL
   - Status: TODO (currently shows "unreachable")
