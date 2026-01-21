import type { Handler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const handler: Handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const deviceId = 'URL_Monitor_XIAO';
    
    // Query DynamoDB for the latest record for this device
    const result = await docClient.send(new QueryCommand({
      TableName: process.env.DEVICE_TABLE_NAME || 'LakeHouse_Logs',
      KeyConditionExpression: 'device = :deviceId',
      ExpressionAttributeValues: {
        ':deviceId': deviceId,
      },
      ScanIndexForward: false, // Sort descending by timestamp
      Limit: 1, // Get only the most recent record
    }));

    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
        },
        body: JSON.stringify({ error: 'No data found for device' }),
      };
    }

    const latestRecord = result.Items[0];
    
    const response = {
      deviceId: latestRecord.device,
      status: latestRecord.internet_ok ? 'online' : 'offline',
      lastSeen: latestRecord.timestamp,
      uptime: latestRecord.uptime_sec,
      wifiSignal: latestRecord.signal_strength,
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
