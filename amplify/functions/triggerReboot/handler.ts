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

    console.log(`Triggering reboot for device: ${deviceId}`);

    // Call Lambda Function URL with secret key
    const url = `${process.env.LAMBDA_FUNCTION_URL}?key=${process.env.LAMBDA_API_KEY}&action=reboot`;
    const response = await fetch(url, {
      method: 'GET',
    });

    const responseData = await response.text();
    console.log('Lambda response:', responseData);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
      body: JSON.stringify({ 
        message: 'Reboot command sent successfully',
        deviceId,
        timestamp: new Date().toISOString(),
        lambdaResponse: responseData,
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
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};
