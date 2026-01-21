import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION_NAME });

export const handler = async (event: any) => {
  console.log('getLogs handler called');

  const tableName = process.env.DEVICE_TABLE_NAME;
  const deviceId = 'URL_Monitor_XIAO';

  try {
    // Query DynamoDB for the last 10 records for this device
    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: '#device = :deviceId',
      ExpressionAttributeNames: {
        '#device': 'device'
      },
      ExpressionAttributeValues: {
        ':deviceId': { S: deviceId }
      },
      Limit: 10,
      ScanIndexForward: false // Get most recent records first
    });

    const response = await dynamoDBClient.send(command);

    if (!response.Items || response.Items.length === 0) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([])
      };
    }

    // Convert DynamoDB items to log format
    const logs = response.Items.map(item => ({
      timestamp: new Date(parseInt(item.timestamp.N!) * 1000).toISOString(),
      status: item.internet_ok?.BOOL ? 'success' : 'error',
      message: item.internet_ok?.BOOL ? 'Device online' : 'Device offline'
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(logs)
    };

  } catch (error) {
    console.error('Error querying DynamoDB:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Failed to fetch logs' })
    };
  }
};
