# Lake ESP32 Dashboard - Amplify Gen 2 Setup

This project combines your existing AWS IoT infrastructure with a modern React dashboard hosted on AWS Amplify.

## Architecture

- **Frontend**: React + TypeScript + Vite + Material-UI
- **Backend**: AWS Amplify Gen 2 (code-first)
- **Authentication**: AWS Cognito (via Amplify Auth)
- **API**: Lambda Functions (getDeviceStatus, triggerReboot)
- **Existing Infrastructure**: 
  - AWS IoT Core (PubSub from ESP32)
  - SNS (email notifications)
  - DynamoDB (device logs)
  - Lambda (Logmor switch control)

## Project Structure

```
lake_esp32/
├── amplify/                    # Amplify Gen 2 backend
│   ├── auth/                   # Cognito auth configuration
│   ├── data/                   # GraphQL API (optional)
│   ├── functions/              # Lambda functions
│   │   ├── getDeviceStatus/    # Get device status from DynamoDB
│   │   └── triggerReboot/      # Trigger device reboot
│   └── backend.ts              # Backend configuration
├── web-dashboard/              # React frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DeviceStatusCard.tsx
│   │   │   └── RecentLogs.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── project_manifest.txt
```

## Setup Instructions

### 1. Start Amplify Sandbox (Development)

The sandbox creates a personal cloud development environment:

```bash
# From the root directory
npx ampx sandbox
```

This will:
- Deploy your backend resources (Auth, Lambda functions)
- Generate `amplify_outputs.json` with configuration
- Watch for changes and auto-deploy updates

**Important**: Keep this running in a terminal window during development.

### 2. Run the Frontend (Separate Terminal)

```bash
cd web-dashboard
npm run dev
```

The app will open at `http://localhost:5173`

### 3. Create Your First User

1. Open the app in your browser
2. Click "Create Account" on the login screen
3. Enter your email and password
4. Verify your email (check spam folder for verification code)
5. Sign in with your credentials

## Connecting to Your Existing AWS Resources

### DynamoDB Integration

Update [`amplify/functions/getDeviceStatus/handler.ts`](amplify/functions/getDeviceStatus/handler.ts):

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  const result = await docClient.send(
    new QueryCommand({
      TableName: process.env.DEVICE_TABLE_NAME,
      KeyConditionExpression: 'deviceId = :deviceId',
      ExpressionAttributeValues: {
        ':deviceId': 'logmor-switch-01',
      },
      Limit: 1,
      ScanIndexForward: false, // Get latest record
    })
  );
  
  return {
    statusCode: 200,
    body: JSON.stringify(result.Items[0]),
  };
};
```

Then update the resource configuration:

```typescript
// amplify/functions/getDeviceStatus/resource.ts
export const getDeviceStatus = defineFunction({
  name: 'getDeviceStatus',
  entry: './handler.ts',
  environment: {
    DEVICE_TABLE_NAME: 'your-table-name', // Replace with your DynamoDB table
  },
});
```

And grant DynamoDB permissions in [`amplify/backend.ts`](amplify/backend.ts):

```typescript
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';

const backend = defineBackend({
  auth,
  data,
  getDeviceStatus,
  triggerReboot,
});

// Grant DynamoDB read permissions
backend.getDeviceStatus.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:Query', 'dynamodb:GetItem'],
    resources: ['arn:aws:dynamodb:REGION:ACCOUNT:table/YOUR_TABLE_NAME'],
  })
);
```

### Lambda Integration (Reboot Function)

Update [`amplify/functions/triggerReboot/handler.ts`](amplify/functions/triggerReboot/handler.ts):

```typescript
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambda = new LambdaClient({});

export const handler = async (event) => {
  const body = JSON.parse(event.body || '{}');
  
  await lambda.send(
    new InvokeCommand({
      FunctionName: process.env.REBOOT_LAMBDA_ARN,
      InvocationType: 'Event', // Async invocation
      Payload: JSON.stringify({ action: 'reboot', deviceId: body.deviceId }),
    })
  );
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Reboot triggered' }),
  };
};
```

Grant Lambda invoke permissions in backend.ts:

```typescript
backend.triggerReboot.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['lambda:InvokeFunction'],
    resources: ['arn:aws:lambda:REGION:ACCOUNT:function/YOUR_REBOOT_FUNCTION'],
  })
);
```

### AWS IoT PubSub (Real-time Updates)

To receive real-time updates from your ESP32, add IoT policy to the authenticated role:

```typescript
// In amplify/backend.ts
backend.auth.resources.authenticatedUserIamRole.addToPrincipalPolicy(
  new PolicyStatement({
    actions: ['iot:Connect', 'iot:Subscribe', 'iot:Receive'],
    resources: ['*'], // Narrow this down in production
  })
);
```

Then in your React component:

```typescript
import { PubSub } from 'aws-amplify/pubsub';

// Subscribe to IoT topic
useEffect(() => {
  const subscription = PubSub.subscribe('esp32/status').subscribe({
    next: (data) => console.log('Message received', data),
    error: (error) => console.error('Error', error),
  });
  
  return () => subscription.unsubscribe();
}, []);
```

## Deployment to Production

### Deploy to Amplify Hosting

1. **Create a new branch** (recommended for production):
   ```bash
   git checkout -b production
   git add .
   git commit -m "Add Amplify dashboard"
   git push origin production
   ```

2. **Deploy backend**:
   ```bash
   npx ampx pipeline-deploy --branch production --app-id YOUR_APP_ID
   ```

3. **Set up Amplify Hosting**:
   - Go to AWS Amplify Console
   - Click "New app" → "Host web app"
   - Connect your GitHub repo
   - Select the `production` branch
   - Build settings (auto-detected):
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
   - Deploy!

### Environment Variables

For production, set these in Amplify Console → App Settings → Environment Variables:

- `DEVICE_TABLE_NAME`: Your DynamoDB table name
- `REBOOT_LAMBDA_ARN`: Your existing Lambda function ARN
- Any other sensitive configuration

## Features

### Current
- ✅ User authentication (Cognito)
- ✅ Responsive dashboard (works on laptop and iPhone)
- ✅ Device status display
- ✅ Reboot trigger button
- ✅ Recent activity logs
- ✅ Mock data for development

### To Implement
- [ ] Connect to actual DynamoDB
- [ ] Connect to existing Lambda functions
- [ ] Real-time IoT updates via PubSub
- [ ] SNS notifications integration
- [ ] Historical data charts
- [ ] Multiple device support

## Development Workflow

1. Make changes to backend code in `amplify/`
2. Sandbox auto-deploys the changes
3. Make changes to frontend in `web-dashboard/src/`
4. Vite hot-reloads automatically
5. Test in browser

## Useful Commands

```bash
# Start sandbox (backend)
npx ampx sandbox

# Start frontend dev server
cd web-dashboard && npm run dev

# Build frontend for production
cd web-dashboard && npm run build

# Generate backend outputs
npx ampx generate outputs --branch main

# Delete sandbox resources
npx ampx sandbox delete
```

## Troubleshooting

### "amplify_outputs.json not found"
- Make sure `npx ampx sandbox` is running
- Check that it successfully deployed

### Authentication errors
- Clear browser cache and cookies
- Check Cognito user pool in AWS Console
- Verify email is confirmed

### Lambda function errors
- Check CloudWatch Logs in AWS Console
- Verify IAM permissions in backend.ts
- Test Lambda function directly in AWS Console

## Next Steps

1. ✅ You've created the basic structure
2. Run `npx ampx sandbox` to deploy your backend
3. Test the dashboard locally
4. Update Lambda functions to connect to real resources
5. Deploy to production using Amplify Hosting

## Resources

- [Amplify Gen 2 Documentation](https://docs.amplify.aws/react/)
- [Material-UI Documentation](https://mui.com/)
- [AWS IoT Core Documentation](https://docs.aws.amazon.com/iot/)
