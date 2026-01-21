# Integration Checklist - Connect to Your Existing AWS Resources

This file helps you connect the new Amplify dashboard to your existing AWS infrastructure.

## Prerequisites

Before integrating, collect this information from your AWS Console:

- [ ] DynamoDB table name (where device logs are stored)
- [ ] DynamoDB table region
- [ ] Existing Lambda function ARN (for Logmor switch reboot)
- [ ] IoT Core endpoint (for PubSub)
- [ ] IoT topic names (ESP32 publishes to)
- [ ] SNS topic ARN (for failure notifications)

## Step-by-Step Integration

### 1️⃣ Connect getDeviceStatus to DynamoDB

**File**: `amplify/functions/getDeviceStatus/resource.ts`

```typescript
import { defineFunction } from '@aws-amplify/backend';

export const getDeviceStatus = defineFunction({
  name: 'getDeviceStatus',
  entry: './handler.ts',
  environment: {
    DEVICE_TABLE_NAME: 'YOUR_DYNAMODB_TABLE_NAME',  // ← Replace this
    DEVICE_TABLE_REGION: 'us-east-1',                // ← Replace this
  },
});
```

**File**: `amplify/functions/getDeviceStatus/handler.ts`

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetItemCommand } from '@aws-sdk/lib-dynamodb';
import type { Handler } from 'aws-lambda';

const client = new DynamoDBClient({ 
  region: process.env.DEVICE_TABLE_REGION 
});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: Handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const deviceId = event.queryStringParameters?.deviceId || 'logmor-switch-01';

    // Query your DynamoDB table
    const result = await docClient.send(
      new QueryCommand({
        TableName: process.env.DEVICE_TABLE_NAME,
        KeyConditionExpression: 'deviceId = :deviceId',
        ExpressionAttributeValues: {
          ':deviceId': deviceId,
        },
        Limit: 1,
        ScanIndexForward: false, // Get latest record
      })
    );

    const item = result.Items?.[0];

    if (!item) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
        },
        body: JSON.stringify({ error: 'Device not found' }),
      };
    }

    // Transform your DynamoDB item to the expected format
    const response = {
      deviceId: item.deviceId,
      status: item.status || 'unknown',
      lastSeen: item.timestamp || new Date().toISOString(),
      uptime: item.uptime || 0,
      temperature: item.temperature,
      wifiSignal: item.wifiSignal,
    };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
```

**File**: `amplify/backend.ts` (add DynamoDB permissions)

```typescript
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';

// ... existing code ...

// Grant DynamoDB permissions
backend.getDeviceStatus.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:Query', 'dynamodb:GetItem', 'dynamodb:Scan'],
    resources: [
      'arn:aws:dynamodb:REGION:ACCOUNT_ID:table/YOUR_TABLE_NAME',  // ← Replace
      'arn:aws:dynamodb:REGION:ACCOUNT_ID:table/YOUR_TABLE_NAME/index/*',
    ],
  })
);
```

### 2️⃣ Connect triggerReboot to Existing Lambda

**File**: `amplify/functions/triggerReboot/resource.ts`

```typescript
import { defineFunction } from '@aws-amplify/backend';

export const triggerReboot = defineFunction({
  name: 'triggerReboot',
  entry: './handler.ts',
  environment: {
    REBOOT_LAMBDA_ARN: 'arn:aws:lambda:REGION:ACCOUNT:function/YOUR_REBOOT_FUNCTION',  // ← Replace
  },
});
```

**File**: `amplify/functions/triggerReboot/handler.ts`

```typescript
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import type { Handler } from 'aws-lambda';

const lambda = new LambdaClient({});

export const handler: Handler = async (event, context) => {
  console.log('Reboot Event:', JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body || '{}');
    const deviceId = body.deviceId;

    if (!deviceId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
        },
        body: JSON.stringify({ error: 'deviceId is required' }),
      };
    }

    // Invoke your existing Lambda function
    const result = await lambda.send(
      new InvokeCommand({
        FunctionName: process.env.REBOOT_LAMBDA_ARN,
        InvocationType: 'RequestResponse',  // Wait for response
        Payload: JSON.stringify({ 
          action: 'reboot',
          deviceId: deviceId,
        }),
      })
    );

    const responsePayload = JSON.parse(
      new TextDecoder().decode(result.Payload)
    );

    console.log('Lambda response:', responsePayload);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
      body: JSON.stringify({ 
        message: 'Reboot command sent',
        deviceId,
        timestamp: new Date().toISOString(),
        response: responsePayload,
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
```

**File**: `amplify/backend.ts` (add Lambda invoke permissions)

```typescript
backend.triggerReboot.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['lambda:InvokeFunction'],
    resources: [
      'arn:aws:lambda:REGION:ACCOUNT_ID:function/YOUR_REBOOT_FUNCTION',  // ← Replace
    ],
  })
);
```

### 3️⃣ Connect Frontend to Backend APIs

After deploying the backend, update the frontend:

**File**: `web-dashboard/src/components/Dashboard.tsx`

```typescript
import { fetchAuthSession } from 'aws-amplify/auth';

const fetchDeviceStatus = async () => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();

    // Get the Lambda function URL from amplify_outputs.json
    const response = await fetch(
      `https://YOUR_API_ENDPOINT/getDeviceStatus?deviceId=logmor-switch-01`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    setDeviceStatus(data);
    setLoading(false);
  } catch (error) {
    console.error('Error fetching device status:', error);
    setLoading(false);
  }
};

const handleReboot = async () => {
  if (!deviceStatus) return;
  
  const confirmed = window.confirm(
    `Are you sure you want to reboot ${deviceStatus.deviceId}?`
  );
  
  if (!confirmed) return;

  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();

    const response = await fetch(
      `https://YOUR_API_ENDPOINT/triggerReboot`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceId: deviceStatus.deviceId }),
      }
    );

    const data = await response.json();
    
    if (response.ok) {
      alert('Reboot command sent successfully!');
      // Refresh status after a delay
      setTimeout(fetchDeviceStatus, 2000);
    } else {
      alert(`Failed to reboot: ${data.error}`);
    }
  } catch (error) {
    console.error('Error triggering reboot:', error);
    alert('Failed to trigger reboot');
  }
};
```

### 4️⃣ Add IoT PubSub for Real-time Updates

**File**: `amplify/backend.ts` (add IoT permissions)

```typescript
backend.auth.resources.authenticatedUserIamRole.addToPrincipalPolicy(
  new PolicyStatement({
    actions: [
      'iot:Connect',
      'iot:Subscribe',
      'iot:Receive',
      'iot:GetThingShadow',
    ],
    resources: ['*'],  // Narrow this in production
  })
);
```

**File**: `web-dashboard/src/components/Dashboard.tsx` (add PubSub)

```typescript
import { PubSub } from '@aws-amplify/pubsub';

useEffect(() => {
  // Subscribe to IoT topic for real-time updates
  const subscription = PubSub.subscribe('esp32/status/logmor-switch-01').subscribe({
    next: (data) => {
      console.log('Real-time update:', data);
      // Update device status from IoT message
      setDeviceStatus((prev) => ({
        ...prev,
        ...data.value,
        lastSeen: new Date().toISOString(),
      }));
    },
    error: (error) => console.error('PubSub error:', error),
  });

  return () => subscription.unsubscribe();
}, []);
```

### 5️⃣ Query Recent Logs from DynamoDB

**File**: `web-dashboard/src/components/RecentLogs.tsx`

```typescript
const fetchLogs = async () => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();

    const response = await fetch(
      `https://YOUR_API_ENDPOINT/getLogs?deviceId=${deviceId}&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    setLogs(data.logs || []);
    setLoading(false);
  } catch (error) {
    console.error('Error fetching logs:', error);
    setLoading(false);
  }
};
```

You'll need to create a new Lambda function `getLogs` similar to `getDeviceStatus` that queries your DynamoDB table for recent entries.

## Testing Checklist

After making changes:

- [ ] Deploy backend: `npx ampx sandbox`
- [ ] Check CloudWatch Logs for errors
- [ ] Test API in AWS Console (Lambda → Test)
- [ ] Test frontend with real data
- [ ] Verify authentication works
- [ ] Test reboot functionality (be careful!)
- [ ] Check real-time updates from ESP32

## Common Issues

**Issue**: "Access Denied" when querying DynamoDB  
**Fix**: Check IAM permissions in `amplify/backend.ts`, verify table ARN

**Issue**: Lambda timeout  
**Fix**: Increase timeout in function resource.ts:
```typescript
export const getDeviceStatus = defineFunction({
  name: 'getDeviceStatus',
  entry: './handler.ts',
  timeoutSeconds: 30,  // ← Add this
});
```

**Issue**: CORS errors in browser  
**Fix**: Verify `Access-Control-Allow-Origin: *` in all Lambda responses

**Issue**: IoT PubSub not receiving messages  
**Fix**: Check IoT topic name matches exactly, verify IAM permissions

## Need Help?

1. Check CloudWatch Logs for Lambda function errors
2. Use AWS Console to test Lambda functions directly
3. Check browser DevTools Network tab for API errors
4. Review Amplify documentation: https://docs.amplify.aws/react/

## Security Notes

Before going to production:

- [ ] Replace wildcard `*` in IoT permissions with specific resources
- [ ] Add rate limiting to Lambda functions
- [ ] Enable CloudWatch Logs encryption
- [ ] Add input validation to all Lambda functions
- [ ] Use environment variables for all sensitive config
- [ ] Review Cognito password policies
- [ ] Enable MFA for Cognito users (optional)
