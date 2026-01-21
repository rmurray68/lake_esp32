# Quick Start Guide

## Node.js Version Issue

The Amplify CLI currently has compatibility issues with Node.js v25. You have two options:

### Option 1: Install Node Version Manager (Recommended)

Install nvm to manage Node versions:

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash

# Restart your terminal or run:
source ~/.zshrc

# Install and use Node LTS (v22)
nvm install 22
nvm use 22

# Verify
node --version  # Should show v22.x.x

# Now run sandbox
npx ampx sandbox
```

### Option 2: Use AWS Amplify Console (No CLI needed)

Since the sandbox has compatibility issues, you can deploy directly through the Amplify Console:

1. **Push your code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Add Amplify dashboard"
   git push origin main
   ```

2. **Deploy via Amplify Console**:
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Click "Create new app" → "Host web app"
   - Connect your GitHub repository
   - Select the `main` branch
   - Amplify will auto-detect the configuration

3. **First-time setup** will create all resources

### Option 3: Test Frontend with Mock Data (Works Now!)

The frontend is already set up with mock data, so you can test the UI immediately:

```bash
cd web-dashboard
npm run dev
```

Open http://localhost:5173 in your browser.

**Note**: Auth won't work without the backend, but you can see the UI components.

To bypass auth for testing, temporarily modify `web-dashboard/src/App.tsx`:

```typescript
// Comment out the Authenticator wrapper:
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* <Authenticator> */}
        {/* {({ signOut, user }) => ( */}
          <Container maxWidth="lg">
            <Dashboard 
              user={undefined} 
              signOut={() => console.log('signout')} 
            />
          </Container>
        {/* )} */}
      {/* </Authenticator> */}
    </ThemeProvider>
  );
}
```

## What's Built So Far

✅ **Frontend Dashboard** (React + Material-UI)
- Device status card with temperature, WiFi signal, uptime
- Reboot button with confirmation
- Recent activity log table
- Responsive design (works on laptop & iPhone)
- Authentication UI (Cognito integration ready)

✅ **Backend Lambda Functions** (Amplify Gen 2)
- `getDeviceStatus`: Query device status from DynamoDB
- `triggerReboot`: Trigger device reboot via existing Lambda

✅ **Infrastructure as Code**
- Amplify backend configuration
- Auth (Cognito) setup
- IAM permissions configured

## Next Steps After Fixing Node Issue

1. **Start sandbox** (after installing Node 22):
   ```bash
   npx ampx sandbox
   ```

2. **Test the app**:
   - Open web-dashboard in browser
   - Create a Cognito user account
   - View dashboard with mock data

3. **Connect to real AWS resources**:
   - Update Lambda handlers to query your DynamoDB table
   - Update Lambda handlers to invoke your existing Lambda functions
   - Add IoT PubSub for real-time updates

## Files Created

```
lake_esp32/
├── amplify/
│   ├── auth/resource.ts                           # Cognito configuration
│   ├── data/resource.ts                           # GraphQL API (template)
│   ├── functions/
│   │   ├── getDeviceStatus/
│   │   │   ├── resource.ts                        # Lambda config
│   │   │   └── handler.ts                         # Lambda code
│   │   └── triggerReboot/
│   │       ├── resource.ts                        # Lambda config
│   │       └── handler.ts                         # Lambda code
│   └── backend.ts                                 # Main backend config
├── web-dashboard/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx                      # Main dashboard
│   │   │   ├── DeviceStatusCard.tsx               # Device status UI
│   │   │   └── RecentLogs.tsx                     # Activity log UI
│   │   ├── App.tsx                                # App with auth
│   │   └── main.tsx                               # Entry point
│   └── package.json
├── AMPLIFY_SETUP.md                               # Detailed setup guide
└── QUICK_START.md                                 # This file
```

## Troubleshooting

**Q: Why does `npx ampx sandbox` fail?**  
A: Node.js v25 is too new. Downgrade to Node.js v22 LTS using nvm.

**Q: Can I skip the sandbox and deploy directly?**  
A: Yes! Use the Amplify Console to deploy from GitHub (Option 2 above).

**Q: How do I test without AWS?**  
A: Use Option 3 to run the frontend with mock data.

**Q: Where do I configure my DynamoDB table?**  
A: In `amplify/functions/getDeviceStatus/resource.ts`, add your table name to environment variables.

## Support

- AWS Amplify Docs: https://docs.amplify.aws/react/
- Amplify Discord: https://discord.gg/amplify
- GitHub Issues: File in your repo
