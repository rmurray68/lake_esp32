import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Lambda } from '@aws-sdk/client-lambda';

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const lambda = new Lambda({ region: 'us-east-1' });

const TABLE_NAME = 'LakeHouse_Logs';
const STATE_TABLE_NAME = 'LakeHouse_DeviceState';

interface DeviceState {
  deviceId: string;
  connected?: boolean;
  deviceCount?: number;
  disconnectedCount?: number;
  relayPower?: string;
  cellStrength?: number;
  lastUpdated?: string;
}

export const handler = async () => {
  console.log('Starting device monitoring...');
  
  try {
    // Fetch Eero network status
    const eeroResponse = await lambda.invoke({
      FunctionName: 'LakeHouse_Eero_Test',
      Payload: JSON.stringify({ action: 'devices' })
    });

    const eeroPayload = JSON.parse(new TextDecoder().decode(eeroResponse.Payload));
    const eeroBody = JSON.parse(eeroPayload.body);

    const connectedDevices = eeroBody.devices.filter((d: any) => d.connected);
    const disconnectedDevices = eeroBody.devices.filter((d: any) => !d.connected);

    // Fetch Logmor status
    const logmorResponse = await lambda.invoke({
      FunctionName: 'LakeHouse_Logmor_Controller',
      Payload: JSON.stringify({ action: 'status' })
    });

    const logmorPayload = JSON.parse(new TextDecoder().decode(logmorResponse.Payload));
    const logmorBody = JSON.parse(logmorPayload.body);

    // Current state
    const currentEeroState: DeviceState = {
      deviceId: 'eero-network',
      connected: true,
      deviceCount: connectedDevices.length,
      disconnectedCount: disconnectedDevices.length,
    };

    const currentLogmorState: DeviceState = {
      deviceId: 'logmor-switch-01',
      connected: true,
      relayPower: logmorBody.relayPower,
      cellStrength: logmorBody.cellStrength,
      lastUpdated: new Date().toISOString(),
    };

    // Get previous state from DynamoDB
    const prevEeroState = await getPreviousState('eero-network');
    const prevLogmorState = await getPreviousState('logmor-switch-01');

    // Check for Eero device disconnections
    if (prevEeroState && prevEeroState.disconnectedCount !== currentEeroState.disconnectedCount) {
      // Devices have disconnected or reconnected
      const changeType = currentEeroState.disconnectedCount! > prevEeroState.disconnectedCount! 
        ? 'disconnected' 
        : 'reconnected';
      
      await logEvent({
        deviceId: 'eero-network',
        status: changeType === 'disconnected' ? 'warning' : 'success',
        message: `${Math.abs(currentEeroState.disconnectedCount! - prevEeroState.disconnectedCount!)} device(s) ${changeType}. Total offline: ${currentEeroState.disconnectedCount}`,
        metadata: {
          connectedCount: currentEeroState.deviceCount,
          disconnectedCount: currentEeroState.disconnectedCount,
        }
      });
    }

    // Check for Logmor power state changes
    if (prevLogmorState && prevLogmorState.relayPower !== currentLogmorState.relayPower) {
      await logEvent({
        deviceId: 'logmor-switch-01',
        status: 'success',
        message: `Relay power changed from ${prevLogmorState.relayPower} to ${currentLogmorState.relayPower}`,
        metadata: {
          previousPower: prevLogmorState.relayPower,
          currentPower: currentLogmorState.relayPower,
        }
      });
    }

    // Check for low cell signal
    if (currentLogmorState.cellStrength && currentLogmorState.cellStrength < 30) {
      await logEvent({
        deviceId: 'logmor-switch-01',
        status: 'warning',
        message: `Low cell signal detected: ${currentLogmorState.cellStrength}%`,
        metadata: {
          cellStrength: currentLogmorState.cellStrength,
        }
      });
    }

    // Save current state to DynamoDB
    await saveCurrentState(currentEeroState);
    await saveCurrentState(currentLogmorState);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Monitoring complete',
        eero: currentEeroState,
        logmor: currentLogmorState,
      })
    };

  } catch (error) {
    console.error('Error monitoring devices:', error);
    
    // Log monitoring failure
    await logEvent({
      deviceId: 'monitor-system',
      status: 'error',
      message: `Monitoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Monitoring failed' })
    };
  }
};

async function logEvent(event: {
  deviceId: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  metadata?: Record<string, any>;
}) {
  const timestamp = new Date().toISOString();
  const ttl = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60); // 90 days from now

  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          deviceId: event.deviceId,
          timestamp,
          status: event.status,
          message: event.message,
          metadata: event.metadata || {},
          ttl,
        },
      })
    );
    console.log(`Event logged: ${event.deviceId} - ${event.message}`);
  } catch (error) {
    console.error('Error logging event:', error);
  }
}

async function getPreviousState(deviceId: string): Promise<DeviceState | null> {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: STATE_TABLE_NAME,
        KeyConditionExpression: 'deviceId = :deviceId',
        ExpressionAttributeValues: {
          ':deviceId': deviceId,
        },
        Limit: 1,
      })
    );
    return result.Items?.[0] as DeviceState || null;
  } catch (error) {
    console.error(`Error getting previous state for ${deviceId}:`, error);
    return null;
  }
}

async function saveCurrentState(state: DeviceState): Promise<void> {
  try {
    await docClient.send(
      new PutCommand({
        TableName: STATE_TABLE_NAME,
        Item: state,
      })
    );
    console.log(`State saved for ${state.deviceId}`);
  } catch (error) {
    console.error(`Error saving state for ${state.deviceId}:`, error);
  }
}
