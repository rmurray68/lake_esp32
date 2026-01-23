import { Lambda } from '@aws-sdk/client-lambda';

const lambda = new Lambda({ region: 'us-east-1' });

export const handler = async (event: any) => {
  try {
    const { action, phone, code, user_token } = JSON.parse(event.body || '{}');

    // Invoke the Eero test Lambda with the provided action
    const response = await lambda.invoke({
      FunctionName: 'LakeHouse_Eero_Test',
      Payload: JSON.stringify({ action, phone, code, user_token })
    });

    const payload = JSON.parse(new TextDecoder().decode(response.Payload));
    
    return {
      statusCode: payload.statusCode,
      body: payload.body
    };
  } catch (error) {
    console.error('Error managing Eero token:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to manage Eero token' })
    };
  }
};
