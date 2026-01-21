import { fetchAuthSession } from 'aws-amplify/auth';
import outputs from '../amplify_outputs.json';

export interface DeviceStatus {
  deviceId: string;
  status: 'online' | 'offline' | 'error' | 'unreachable';
  lastSeen?: string;
  uptime?: number;
  temperature?: number;
  wifiSignal?: number;
}

export interface LogEntry {
  timestamp: string;
  status: 'success' | 'warning' | 'error';
  message: string;
}

// Fetch ESP32 device status - calls Lambda directly
export async function fetchEsp32Status(): Promise<DeviceStatus> {
  const session = await fetchAuthSession();
  const functionName = (outputs as any).custom?.getDeviceStatusFunctionName;
  
  if (!functionName) {
    throw new Error('getDeviceStatus function not configured');
  }

  const { LambdaClient, InvokeCommand } = await import('@aws-sdk/client-lambda');
  const lambda = new LambdaClient({
    region: 'us-east-1',
    credentials: session.credentials,
  });

  const result = await lambda.send(
    new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify({ deviceId: 'URL_Monitor_XIAO' }),
    })
  );

  const responsePayload = result.Payload 
    ? JSON.parse(new TextDecoder().decode(result.Payload))
    : {};
  
  const data = JSON.parse(responsePayload.body || '{}');
  
  if (data.error) throw new Error(data.error);
  
  return {
    deviceId: data.deviceId,
    status: data.status,
    lastSeen: data.lastSeen,
    uptime: data.uptime,
    temperature: data.temperature,
    wifiSignal: data.wifiSignal,
  };
}

// Fetch Logmor switch status
export async function fetchLogmorStatus(): Promise<DeviceStatus> {
  try {
    const session = await fetchAuthSession();
    const { LambdaClient, InvokeCommand } = await import('@aws-sdk/client-lambda');
    const lambda = new LambdaClient({
      region: 'us-east-1',
      credentials: session.credentials,
    });

    await lambda.send(
      new InvokeCommand({
        FunctionName: 'LakeHouse_Logmor_Controller',
        Payload: JSON.stringify({ action: 'status' }),
      })
    );
    
    // Lambda responded successfully, it's online
    return {
      deviceId: 'logmor-switch-01',
      status: 'online',
    };
  } catch (error) {
    console.error('Logmor status error:', error);
    return {
      deviceId: 'logmor-switch-01',
      status: 'unreachable',
    };
  }
}

// Trigger reboot - calls Lambda directly
export async function triggerReboot(deviceId: string): Promise<void> {
  const session = await fetchAuthSession();
  const functionName = (outputs as any).custom?.triggerRebootFunctionName;
  
  if (!functionName) {
    throw new Error('triggerReboot function not configured');
  }

  const { LambdaClient, InvokeCommand } = await import('@aws-sdk/client-lambda');
  const lambda = new LambdaClient({
    region: 'us-east-1',
    credentials: session.credentials,
  });

  const result = await lambda.send(
    new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify({ deviceId }),
    })
  );

  const responsePayload = result.Payload 
    ? JSON.parse(new TextDecoder().decode(result.Payload))
    : {};
  
  console.log('Reboot response:', responsePayload);
}

// Fetch recent logs - calls Lambda directly
export async function fetchRecentLogs(): Promise<LogEntry[]> {
  const session = await fetchAuthSession();
  const functionName = (outputs as any).custom?.getLogsFunctionName;
  
  if (!functionName) {
    throw new Error('getLogs function not configured');
  }

  const { LambdaClient, InvokeCommand } = await import('@aws-sdk/client-lambda');
  const lambda = new LambdaClient({
    region: 'us-east-1',
    credentials: session.credentials,
  });

  const result = await lambda.send(
    new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify({}),
    })
  );

  const responsePayload = result.Payload 
    ? JSON.parse(new TextDecoder().decode(result.Payload))
    : {};
  
  const data = JSON.parse(responsePayload.body || '[]');
  
  return data;
}
