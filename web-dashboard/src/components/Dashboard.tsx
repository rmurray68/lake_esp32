import { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Stack,
  Box,
  Container,
  CircularProgress,
} from '@mui/material';
import type { AuthUser } from 'aws-amplify/auth';
import { fetchAuthSession } from 'aws-amplify/auth';
import outputs from '../amplify_outputs.json';

import DeviceStatusCard from './DeviceStatusCard.tsx';
import RecentLogs from './RecentLogs.tsx';

interface DashboardProps {
  user: AuthUser | undefined;
  signOut: (() => void) | undefined;
}

export interface DeviceStatus {
  deviceId: string;
  status: 'online' | 'offline' | 'error';
  lastSeen: string;
  uptime?: number;
  temperature?: number;
  wifiSignal?: number;
}

function Dashboard({ user, signOut }: DashboardProps) {
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial device status
    fetchDeviceStatus();
    
    // Set up polling for status updates (every 30 seconds)
    const interval = setInterval(fetchDeviceStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDeviceStatus = async () => {
    try {
      const session = await fetchAuthSession();
      const functionName = (outputs as any).custom?.getDeviceStatusFunctionName;
      
      if (!functionName) {
        console.error('Function name not found in outputs:', outputs);
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
      
      if (data.item) {
        setDeviceStatus({
          deviceId: data.item.device,
          status: data.item.internet_ok ? 'online' : 'offline',
          lastSeen: new Date(data.item.timestamp * 1000).toISOString(),
          uptime: data.item.uptime_sec,
          tesession = await fetchAuthSession();
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
          Payload: JSON.stringify({ deviceId: deviceStatus.deviceId }),
        })
      );

      const responsePayload = result.Payload 
        ? JSON.parse(new TextDecoder().decode(result.Payload))
        : {};
      
      const data = JSON.parse(responsePayload.body || '{}')
    } catch (error) {
      console.error('Error fetching device status:', error);
      setLoading(false);
    }
  };

  const handleReboot = async () => {
    if (!deviceStatus) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to reboot ${deviceStatus.deviceId}?`
    );
    
    if (!confirmed) return;
    
    try {
      const result: any = await client.queries.triggerReboot({
        deviceId: deviceStatus.deviceId
      });

      const data = result.data || result;
      console.log('Reboot response:', data);
      
      alert('Reboot command sent successfully!');
      
      // Refresh status after a delay
      setTimeout(fetchDeviceStatus, 2000);
    } catch (error) {
      console.error('Error triggering reboot:', error);
      alert('Failed to trigger reboot');
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Lake ESP32 Dashboard
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.signInDetails?.loginId}
          </Typography>
          <Button color="inherit" onClick={signOut}>
            Sign Out
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={3}
            sx={{ width: '100%' }}
          >
            <Box sx={{ flex: 1 }}>
              {deviceStatus && (
                <DeviceStatusCard
                  device={deviceStatus}
                  onReboot={handleReboot}
                />
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <RecentLogs deviceId={deviceStatus?.deviceId || ''} />
            </Box>
          </Stack>
        )}
      </Container>
    </Box>
  );
}

export default Dashboard;
