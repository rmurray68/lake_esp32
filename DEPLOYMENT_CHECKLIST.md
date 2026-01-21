# Deployment Checklist

Use this checklist to deploy your Lake ESP32 Dashboard to production.

## ✅ Pre-Deployment (Complete)

- [x] React frontend created
- [x] Material-UI components built
- [x] Amplify backend configured
- [x] Lambda functions written
- [x] AWS SDK dependencies installed
- [x] Documentation created
- [x] .gitignore updated

## 🔧 Before Deploying Backend

### Install Compatible Node.js Version

```bash
# Install nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.zshrc

# Install Node LTS
nvm install 22
nvm use 22

# Verify
node --version  # Should show v22.x.x
```

### Collect AWS Resource Information

Gather this info from your AWS Console:

- [ ] DynamoDB table name: _______________________________
- [ ] DynamoDB table region: _______________________________
- [ ] DynamoDB table ARN: _______________________________
- [ ] Existing Lambda ARN (reboot): _______________________________
- [ ] IoT endpoint: _______________________________
- [ ] IoT topic name: _______________________________
- [ ] AWS region: _______________________________
- [ ] AWS account ID: _______________________________

### Update Configuration Files

- [ ] Edit `amplify/functions/getDeviceStatus/resource.ts`
  - Add DynamoDB table name to environment variables
  
- [ ] Edit `amplify/functions/triggerReboot/resource.ts`
  - Add Lambda ARN to environment variables
  
- [ ] Edit `amplify/backend.ts`
  - Add DynamoDB permissions with real table ARN
  - Add Lambda invoke permissions with real function ARN
  - Add IoT permissions (if using PubSub)

## 🚀 Deployment Options

### Option A: Local Sandbox (Development)

```bash
# From project root
npx ampx sandbox
```

This creates a personal cloud environment for testing.

**Leave this running** - it auto-deploys changes.

### Option B: Deploy to Amplify Hosting (Production)

#### Step 1: Push to GitHub

```bash
git add .
git commit -m "Add Amplify dashboard for Lake ESP32"
git push origin main
```

#### Step 2: Create Amplify App in AWS Console

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "Create new app" → "Host web app"
3. Select "GitHub" and authenticate
4. Select your repository and branch (main)
5. Amplify auto-detects build settings

#### Step 3: Configure Build Settings

Verify/update the build configuration:

```yaml
version: 1
backend:
  phases:
    build:
      commands:
        - npm ci
        - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
frontend:
  phases:
    preBuild:
      commands:
        - cd web-dashboard
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: web-dashboard/dist
    files:
      - '**/*'
  cache:
    paths:
      - web-dashboard/node_modules/**/*
```

#### Step 4: Set Environment Variables

In Amplify Console → App Settings → Environment Variables, add:

- `NODE_VERSION`: `22`
- Any other sensitive config

#### Step 5: Deploy

Click "Save and deploy"

## 📝 Post-Deployment

### Test Backend APIs

- [ ] Open CloudWatch Logs
- [ ] Test `getDeviceStatus` Lambda
- [ ] Test `triggerReboot` Lambda
- [ ] Check DynamoDB query works
- [ ] Verify Lambda invocation works

### Test Frontend

- [ ] Open the deployed URL
- [ ] Create a test user account
- [ ] Verify email confirmation works
- [ ] Log in successfully
- [ ] Check device status displays
- [ ] Test reboot button (carefully!)
- [ ] Verify logs display
- [ ] Test on iPhone/mobile

### Switch Frontend to Production Mode

- [ ] Edit `web-dashboard/src/main.tsx`
- [ ] Change from `App.demo.tsx` to `App.tsx`
- [ ] Uncomment Amplify.configure()
- [ ] Commit and push changes

```typescript
import App from './App.tsx'  // ← Use this
import { Amplify } from 'aws-amplify'
import outputs from '../../amplify_outputs.json'
Amplify.configure(outputs)
```

## 🔌 Integration Steps

Follow [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) to:

- [ ] Connect getDeviceStatus to real DynamoDB
- [ ] Connect triggerReboot to real Lambda
- [ ] Add IoT PubSub for real-time updates
- [ ] Add getLogs function for activity history
- [ ] Test all integrations

## 🔒 Security Hardening

Before production use:

- [ ] Review IAM permissions (narrow down wildcards)
- [ ] Enable Cognito MFA (optional)
- [ ] Review Cognito password policy
- [ ] Enable CloudWatch Logs encryption
- [ ] Add rate limiting to Lambda functions
- [ ] Add input validation
- [ ] Review CORS settings
- [ ] Enable AWS WAF (optional, for DDoS protection)

## 📊 Monitoring Setup

- [ ] Create CloudWatch Dashboard
- [ ] Set up SNS alerts for Lambda errors
- [ ] Monitor DynamoDB read/write capacity
- [ ] Set up billing alerts
- [ ] Enable AWS X-Ray (optional, for tracing)

## 🎯 Testing Checklist

### Functional Tests

- [ ] User registration works
- [ ] Email verification works
- [ ] Login/logout works
- [ ] Device status displays correctly
- [ ] Reboot button triggers reboot
- [ ] Confirmation dialog appears
- [ ] Recent logs display
- [ ] Real-time updates work (if using PubSub)

### Responsive Design Tests

- [ ] Works on desktop (Chrome)
- [ ] Works on desktop (Safari)
- [ ] Works on iPhone
- [ ] Works on iPad
- [ ] Works in portrait mode
- [ ] Works in landscape mode

### Error Handling Tests

- [ ] Handles device offline
- [ ] Handles network errors
- [ ] Handles invalid credentials
- [ ] Shows loading states
- [ ] Shows error messages

## 💰 Cost Monitoring

After deployment, monitor costs:

- [ ] Check AWS Cost Explorer after 1 week
- [ ] Verify staying within free tier
- [ ] Set up billing alerts (e.g., >$5/month)

Expected costs:
- Amplify Hosting: ~$0 (free tier)
- Cognito: Free (< 50k users)
- Lambda: ~$0.20/month
- DynamoDB: ~$0 (existing table)
- **Total: < $1/month**

## 🆘 Rollback Plan

If something goes wrong:

### Rollback Backend
```bash
npx ampx sandbox delete
```

### Rollback Frontend
- In Amplify Console, select previous deployment
- Click "Redeploy this version"

### Emergency Contact
- Your AWS account: _______________________________
- Support tier: _______________________________

## 📚 Documentation

Make sure these files are up to date:

- [ ] README.md (update with deployed URL)
- [ ] INTEGRATION_GUIDE.md (add real ARNs)
- [ ] QUICK_START.md
- [ ] PROJECT_SUMMARY.md

## ✨ Done!

When all checkboxes are complete:

🎉 **Your Lake ESP32 Dashboard is live!**

Access it at: `https://YOUR_APP_ID.amplifyapp.com`

---

## Quick Commands Reference

```bash
# Local development
npx ampx sandbox              # Start backend
cd web-dashboard && npm run dev  # Start frontend

# Production deployment
git push origin main          # Auto-deploys via Amplify Console

# View logs
npx ampx sandbox logs         # Local logs
# Or use CloudWatch in AWS Console

# Delete resources
npx ampx sandbox delete       # Delete personal sandbox
```

## Need Help?

- [QUICK_START.md](QUICK_START.md) - Quick start guide
- [AMPLIFY_SETUP.md](AMPLIFY_SETUP.md) - Detailed setup
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Connect to AWS resources
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Project overview
