import express from 'express';
import cors from 'cors';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const app = express();
app.use(cors());
app.use(express.json());

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

// Get device status
app.get('/api/device-status', async (req, res) => {
  try {
    const deviceId = 'URL_Monitor_XIAO';
    
    const result = await docClient.send(new QueryCommand({
      TableName: 'LakeHouse_Logs',
      KeyConditionExpression: 'device = :deviceId',
      ExpressionAttributeValues: {
        ':deviceId': deviceId,
      },
      ScanIndexForward: false,
      Limit: 1,
    }));

    if (!result.Items || result.Items.length === 0) {
      return res.status(404).json({ error: 'No data found for device' });
    }

    const latestRecord = result.Items[0];
    
    // Consider device offline if last seen is more than 5 minutes ago
    const lastSeenDate = new Date(latestRecord.timestamp * 1000);
    const minutesSinceLastSeen = (Date.now() - lastSeenDate.getTime()) / 1000 / 60;
    const isOnline = latestRecord.internet_ok && minutesSinceLastSeen < 5;
    
    res.json({
      deviceId: latestRecord.device,
      status: isOnline ? 'online' : 'offline',
      lastSeen: lastSeenDate.toISOString(),
      uptime: latestRecord.uptime_sec,
      wifiSignal: latestRecord.signal_strength,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recent logs
app.get('/api/logs', async (req, res) => {
  try {
    const deviceId = 'URL_Monitor_XIAO';
    
    const result = await docClient.send(new QueryCommand({
      TableName: 'LakeHouse_Logs',
      KeyConditionExpression: 'device = :deviceId',
      ExpressionAttributeValues: {
        ':deviceId': deviceId,
      },
      ScanIndexForward: false,
      Limit: 10,
    }));

    if (!result.Items || result.Items.length === 0) {
      return res.json([]);
    }

    const logs = result.Items.map(item => ({
      timestamp: new Date(item.timestamp * 1000).toISOString(),
      status: item.internet_ok ? 'success' : 'error',
      message: item.internet_ok ? 'Health check passed' : 'Connection lost',
      uptime: item.uptime_sec,
      signal: item.signal_strength,
    }));

    res.json(logs);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Logmor switch status
app.get('/api/logmor-status', async (req, res) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(
      'https://poatmimq2hxlfo75ngglui4llm0fllpt.lambda-url.us-east-1.on.aws/?key=lakehouse2026',
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    
    const data = await response.json();
    res.json({
      status: 'online',
      data: data,
    });
  } catch (error) {
    console.error('Logmor Lambda error:', error.message);
    res.json({
      status: 'unreachable',
      error: error.message,
    });
  }
});

// Trigger reboot
app.post('/api/reboot', async (req, res) => {
  try {
    const response = await fetch(
      'https://nkr7qiyrhmwppokhhfkagwqtue0cdlej.lambda-url.us-east-1.on.aws/?key=lakehouse2026&action=reboot'
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Local backend running on http://localhost:${PORT}`);
});
