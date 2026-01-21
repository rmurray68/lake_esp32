import type { Handler } from 'aws-lambda';

export const handler: Handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // TODO: Query your DynamoDB table for device status
    // TODO: Or call your existing Lambda function
    
    // Mock response for now
    const response = {
      deviceId: 'logmor-switch-01',
      status: 'online',
      lastSeen: new Date().toISOString(),
      uptime: 86400,
      temperature: 45.2,
      wifiSignal: -55,
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
