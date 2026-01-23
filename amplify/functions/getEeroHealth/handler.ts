import { Lambda } from '@aws-sdk/client-lambda';

const lambda = new Lambda({ region: 'us-east-1' });

export const handler = async () => {
  try {
    // Invoke the Eero test Lambda to get network status
    const response = await lambda.invoke({
      FunctionName: 'LakeHouse_Eero_Test',
      Payload: JSON.stringify({ action: 'networks' })
    });

    const payload = JSON.parse(new TextDecoder().decode(response.Payload));
    const body = JSON.parse(payload.body);

    // Get device count
    const devicesResponse = await lambda.invoke({
      FunctionName: 'LakeHouse_Eero_Test',
      Payload: JSON.stringify({ action: 'devices' })
    });

    const devicesPayload = JSON.parse(new TextDecoder().decode(devicesResponse.Payload));
    const devicesBody = JSON.parse(devicesPayload.body);

    const connectedDevices = devicesBody.devices.filter((d: any) => d.connected);
    const disconnectedDevices = devicesBody.devices.filter((d: any) => !d.connected);

    return {
      statusCode: 200,
      body: JSON.stringify({
        network: body.networks[0],
        deviceCount: connectedDevices.length,
        totalDevices: devicesBody.devices.length,
        disconnectedCount: disconnectedDevices.length,
        connectedDevices: connectedDevices.map((d: any) => ({
          name: d.display_name || d.hostname,
          ip: d.ip,
          signal: d.connectivity?.signal,
          location: d.source?.location
        })),
        disconnectedDevices: disconnectedDevices.map((d: any) => ({
          name: d.display_name || d.hostname,
          lastActive: d.last_active,
          ip: d.ip || 'N/A',
          location: d.source?.location || 'Unknown'
        }))
      })
    };
  } catch (error) {
    console.error('Error getting Eero health:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get Eero health' })
    };
  }
};
