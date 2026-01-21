# Lake ESP32 Dashboard 🏠

A modern, responsive web dashboard for monitoring and controlling your remote lake house internet connectivity system.

## 🌟 Features

- **Real-time Monitoring**: View device status, uptime, temperature, and WiFi signal strength
- **Remote Control**: Trigger device reboots with a single click
- **Activity Logs**: See recent health checks and system events
- **Responsive Design**: Works perfectly on both desktop and mobile devices
- **Secure Authentication**: AWS Cognito user management
- **Serverless Architecture**: Scales automatically, pay only for what you use

## 📱 Screenshots

The dashboard displays:
- Device online/offline status with color indicators
- Last seen timestamp
- System uptime
- Temperature readings
- WiFi signal strength
- Recent activity log
- Reboot button with confirmation dialog

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
│  │   Cognito    │  │   Lambda     │  │   Lambda     │      │
│  │     Auth     │  │ getDevice    │  │ triggerReboot│      │
│  └──────────────┘  └──────┬───────┘  └──────┬───────┘      │
└────────────────────────────┼──────────────────┼─────────────┘
                             │                  │
                    ┌────────▼────────┐ ┌──────▼──────────┐
                    │   DynamoDB      │ │ Existing Lambda │
                    │ LakeHouse_Logs  │ │   (Logmor)      │
                    └─────────────────┘ └─────────────────┘
                             ▲
                             │
                    ┌────────┴─────────┐
                    │  ESP32-C3        │
                    │  (IoT Device)    │
                    └──────────────────┘
```

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
│   │   ├── getDeviceStatus/    # Query DynamoDB
│   │   └── triggerReboot/      # Invoke existing Lambda
│   └── backend.ts              # Main config
│
├── web-dashboard/              # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DeviceStatusCard.tsx
│   │   │   └── RecentLogs.tsx
│   │   ├── App.tsx             # With authentication
│   │   ├── App.demo.tsx        # Demo mode (testing)
│   │   └── main.tsx
│   └── package.json
│
├── QUICK_START.md              # Quick start guide
├── AMPLIFY_SETUP.md            # Setup instructions
├── INTEGRATION_GUIDE.md        # AWS integration
├── DEPLOYMENT_CHECKLIST.md     # Deployment steps
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
