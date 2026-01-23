# Lake House Network Dashboard 🏠

A modern, responsive web dashboard for monitoring and controlling your remote lake house network and devices via Eero WiFi and Logmor LTE switch.

## 🌟 Features

- **Eero Network Monitoring**: 
  - View all connected and disconnected devices
  - Real-time device count and status
  - Device details (name, location, IP, signal strength)
  - Clickable device lists with full details dialog
  - Network health tracking

- **Logmor LTE Switch Control**: 
  - **Reboot (30s)** - Power cycle with automatic restore
  - **Power ON** - Turn relay on immediately
  - **Power OFF** - Full power down with manual restore
  - Cell signal strength monitoring
  - Real-time relay status (ON/OFF)

- **Admin Token Management**:
  - GUI-based Eero token renewal (Settings icon)
  - 3-step wizard: Phone → SMS Code → Verify
  - Automatic session storage in AWS SSM

- **Network Issues & Alerts**: 
  - Device disconnect/reconnect notifications
  - Low signal strength warnings
  - Power state change tracking
  - Automatic monitoring every 5 minutes

- **Smart UI Features**:
  - Buttons automatically enable/disable based on relay state
  - Visual feedback with color-coded status chips
  - Live countdown timer during power cycling
  - Manual refresh for instant status updates
  - Responsive design for desktop and mobile

- **Secure & Scalable**:
  - AWS Cognito authentication
  - IAM-based Lambda invocation
  - Serverless architecture
  - Auto-scaling infrastructure

## 📱 Dashboard Interface

The dashboard displays:
- **Eero Network Status Card**:
  - Network name (RM-WiFi)
  - Online/offline device counts with color chips
  - Top 5 connected devices with clickable "see more"
  - Recently disconnected devices with last seen timestamps
  - Full device list dialogs for both connected and disconnected

- **Logmor LTE Switch Card**:
  - Device online/offline status
  - Relay power status (ON/OFF) with green/red indicators
  - Cell signal strength percentage
  - Last seen timestamp
  - Temperature and uptime readings
  - Power control buttons (Reboot/ON/OFF)

- **Network Issues & Alerts**:
  - Recent errors and warnings only
  - Device disconnection events
  - Low signal alerts
  - Power state changes
  - Empty state when all systems healthy

## 🏗️ Architecture

### New Design (January 2026)
- **Frontend**: React 18 + TypeScript + Vite + Material-UI
- **Backend**: AWS Amplify Gen 2 (serverless)
- **Monitoring**: EventBridge scheduled Lambda (every 5 minutes)
- **Database**: DynamoDB (LakeHouse_Logs, 90-day TTL)
- **External Integrations**:
  - Eero API via LakeHouse_Eero_Test Lambda
  - Logmor control via LakeHouse_Logmor_Controller Lambda
- **Authentication**: AWS Cognito User Pool
- **Session Storage**: AWS Systems Manager Parameter Store

### Removed (Legacy ESP32 Design)
- ~~ESP32-based URL monitoring device~~
- ~~AWS IoT Core gateway~~
- ~~SNS topics for notifications~~
- ~~ESP32 controller Lambda~~

## 🚀 Quick Start

**Currently Running**: The dashboard is live at http://localhost:5173 with demo data!

### For Full Functionality (Connect to AWS):

1. **Install Node.js 22** (required for Amplify CLI):
   ```bash
   # Install nvm
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
   source ~/.zshrc
   
   # Install Node 22
   nvm install 22
   nvm use 22
   ```

2. **Deploy the Backend**:
   ```bash
   npx ampx sandbox
   ```

3. **Start the Frontend** (in a new terminal):
   ```bash
   cd web-dashboard
   npm run dev
   ```

4. **Open in Browser**: http://localhost:5173

See [QUICK_START.md](QUICK_START.md) for detailed instructions.

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Get up and running in minutes
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Complete project overview
- **[AMPLIFY_SETUP.md](AMPLIFY_SETUP.md)** - Detailed setup guide
- **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** - Connect to your existing AWS resources
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Production deployment steps

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      React Dashboard                         │
│              (Laptop & iPhone Responsive)                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ HTTPS + Auth
                      │
┌─────────────────────▼───────────────────────────────────────┐
│               AWS Amplify Gen 2                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Cognito    │  │   Lambda     │  │ EventBridge  │      │
│  │     Auth     │  │  Functions   │  │   Schedule   │      │
│  └──────────────┘  └──────┬───────┘  └──────┬───────┘      │
└────────────────────────────┼──────────────────┼─────────────┘
                             │                  │
                    ┌────────▼────────┐ ┌──────▼──────────┐
                    │   DynamoDB      │ │ External Lambdas│
                    │ LakeHouse_Logs  │ │ Eero & Logmor   │
                    │ Device_State    │ └─────────────────┘
                    └─────────────────┘
```

**Key Components:**
- **Frontend**: React dashboard with real-time device monitoring
- **Amplify Gen 2**: Serverless backend with Lambda functions
- **DynamoDB**: Event logs (90-day TTL) and device state storage
- **EventBridge**: Scheduled monitoring every 5 minutes
- **External Integrations**: Eero API and Logmor LTE switch

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Material-UI
- **Backend**: AWS Amplify Gen 2, Lambda (Node.js), DynamoDB
- **Authentication**: AWS Cognito
- **Infrastructure**: AWS CDK (via Amplify)
- **Hosting**: AWS Amplify Hosting (production)

## 📁 Project Structure

```
lake_esp32/
├── amplify/                    # Backend infrastructure
│   ├── auth/                   # Cognito configuration
│   ├── data/                   # GraphQL API (optional)
│   ├── functions/              # Lambda functions
│   │   ├── getEeroHealth/      # Fetch Eero network status
│   │   ├── manageEeroToken/    # Token renewal management
│   │   ├── monitorDevices/     # Periodic monitoring (EventBridge)
│   │   ├── getLogs/            # Query DynamoDB logs
│   │   └── triggerReboot/      # Logmor power control
│   └── backend.ts              # Main config
│
├── web-dashboard/              # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── DashboardNew.tsx
│   │   │   ├── EeroStatusCard.tsx
│   │   │   ├── EeroTokenDialog.tsx
│   │   │   ├── DeviceStatusCard.tsx
│   │   │   └── RecentLogs.tsx
│   │   ├── services/
│   │   │   └── api.ts          # API client
│   │   ├── App.tsx             # With authentication
│   │   └── main.tsx
│   └── package.json
│
├── QUICK_START.md              # Quick start guide
├── AMPLIFY_SETUP.md            # Setup instructions
├── DEPLOYMENT.md               # Deployment guide
├── PROJECT_SUMMARY.md          # Project overview
└── README.md                   # This file
```

## 🔐 Security

- ✅ AWS Cognito authentication
- ✅ IAM role-based access control
- ✅ HTTPS only
- ✅ Environment variables for secrets
- ✅ CORS configured
- ✅ Input validation

## 💰 Cost

With typical usage (personal dashboard):
- **Amplify Hosting**: ~$0 (free tier)
- **Cognito**: Free (< 50,000 users)
- **Lambda**: ~$0.20/month (1M requests free)
- **DynamoDB**: ~$0 (using existing table)

**Estimated Total: < $1/month** (likely $0 with AWS Free Tier)

## 🚦 Current Status

- ✅ Frontend UI complete
- ✅ Backend code written
- ✅ Mock data working
- ✅ Responsive design tested
- ⏳ Backend deployment (waiting for Node.js 22)
- ⏳ Integration with existing AWS resources

## 🎯 Next Steps

1. Install Node.js 22 (see Quick Start)
2. Deploy backend: `npx ampx sandbox`
3. Test with real data
4. Connect to your DynamoDB and Lambda
5. Deploy to production via Amplify Console

## 🆘 Troubleshooting

**Q: Dashboard won't load?**  
A: Make sure you're running `npm run dev` in the web-dashboard directory

**Q: "amplify_outputs.json not found"?**  
A: The backend isn't deployed yet. Use demo mode or deploy backend first

**Q: Can't deploy backend?**  
A: You need Node.js 22. See QUICK_START.md for installation instructions

**Q: Where is my existing infrastructure?**  
A: Your existing AWS resources (DynamoDB, Lambda, IoT) are untouched. This dashboard connects to them via new Lambda functions.

## 📞 Support

- AWS Amplify Docs: https://docs.amplify.aws/react/
- Material-UI Docs: https://mui.com/
- Issue Tracker: GitHub Issues (your repo)

## 📄 License

ISC

## 🙏 Acknowledgments

Built with:
- AWS Amplify Gen 2
- React & Material-UI
- Vite
- TypeScript

---

**Status**: Development ✨ | **Version**: 1.0.0 | **Updated**: January 2026
