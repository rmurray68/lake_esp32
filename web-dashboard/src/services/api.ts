import { fetchAuthSession } from 'aws-amplify/auth';
import outputs from '../amplify_outputs.json';

// Auto-detect environment
const IS_LOCAL = window.location.hostname === 'localhost';
const API_BASE_URL = IS_LOCAL ? 'http://localhost:3001/api' : '';

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

// Fetch ESP32 device status
export async function fetchEsp32Status(): Promise<DeviceStatus> {
  if (IS_LOCAL) {
    // Local: call Express backend
    const response = await fetch(`${API_BASE_URL}/device-status`);
    const data = await response.json();
    
    if (data.error) throw new Error(data.error);
    
    return {
      deviceId: data.deviceId,
      status: data.status,
      lastSeen: data.lastSeen,
      uptime: data.uptime,
      temperature: data.temperature,
      wifiSignal: data.wifiSignal,
    };
  } else {
    // Production: call Lambda directly
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
}

// Fetch Logmor switch status
export async function fetchLogmorStatus(): Promise<DeviceStatus> {
  if (IS_LOCAL) {
    // Local: call Express backend
    const response = await fetch(`${API_BASE_URL}/logmor-status`);
    const data = await response.json();
    
    return {
      deviceId: 'logmor-switch-01',
      status: data.status,
    };
  } else {
    // Production: TODO - implement Lambda call
    return {
      deviceId: 'logmor-switch-01',
      status: 'unreachable',
    };
  }
}

// Trigger reboot
export async function triggerReboot(deviceId: string): Promise<void> {
  if (IS_LOCAL) {
    // Local: call Express backend
    const response = await fetch(`${API_BASE_URL}/reboot`, {
      method: 'POST',
    });
    const data = await response.json();
    console.log('Reboot response:', data);
  } else {
    // Production: call Lambda
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
}

// Fetch recent logs
export async function fetchRecentLogs(): Promise<LogEntry[]> {
  if (IS_LOCAL) {
    // Local: call Express backend
    const response = await fetch(`${API_BASE_URL}/logs`);
    return await response.json();
  } else {
    // Production: call Lambda
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
}
