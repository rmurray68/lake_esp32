import type { Handler } from 'aws-lambda';

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

    // TODO: Invoke your existing Lambda function to trigger reboot
    // TODO: Or publish to AWS IoT topic to trigger reboot
    
    console.log(`Triggering reboot for device: ${deviceId}`);

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
