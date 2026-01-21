# Lake ESP32 Dashboard Deployment Guide

## Prerequisites
- AWS Account
- GitHub Account
- AWS CLI configured

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Add Amplify Gen 2 dashboard with DynamoDB and Lambda integration"
git push origin main
```

### 2. Deploy via AWS Amplify Console
1. Go to https://console.aws.amazon.com/amplify
2. Click "New app" → "Host web app"
3. Select GitHub → Connect your `lake_esp32` repository
4. Amplify will auto-detect the `amplify.yml` configuration
5. Click "Save and deploy"

### 3. Set Secret for Lambda API Key
After deployment, set the Lambda API key secret:

**Via Amplify Console:**
1. Go to your app in Amplify Console
2. Navigate to "Secrets management"
3. Add secret:
   - Name: `LAMBDA_API_KEY`
   - Value: `lakehouse2026`

**Or via CLI:**
```bash
npx ampx sandbox secret set LAMBDA_API_KEY
# Enter: lakehouse2026
```

### 4. Create Cognito User
After the backend deploys, create the admin user:

```bash
# Get the User Pool ID from amplify_outputs.json or Amplify Console
aws cognito-idp admin-create-user \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --username rpm228@gmail.com \
  --user-attributes Name=email,Value=rpm228@gmail.com Name=email_verified,Value=true \
  --temporary-password TempPassword123! \
  --message-action SUPPRESS

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --username rpm228@gmail.com \
  --password 'Rocky25$$' \
  --permanent
```

### 5. Access the Dashboard
1. Navigate to your Amplify app URL (e.g., `https://main.xxxxxx.amplifyapp.com`)
2. Login with:
   - Email: `rpm228@gmail.com`
   - Password: `Rocky25$$`

## Architecture
- **Frontend**: React + TypeScript + Vite + Material-UI
- **Backend**: AWS Amplify Gen 2
- **Auth**: AWS Cognito
- **Database**: DynamoDB table `LakeHouse_Logs`
- **Device Control**: Lambda Function URL (LakeHouse_Logmor_Controller)

## Environment Variables
The following are configured in the backend:
- `DYNAMODB_TABLE_NAME`: LakeHouse_Logs
- `DYNAMODB_REGION`: us-east-1
- `LAMBDA_FUNCTION_URL`: Your Logmor controller URL
- `LAMBDA_API_KEY`: Secret stored in AWS Systems Manager Parameter Store

## Troubleshooting
- If login fails, verify the Cognito user was created successfully
- If device status doesn't load, check Lambda function logs in CloudWatch
- If reboot fails, verify the LAMBDA_API_KEY secret is set correctly
