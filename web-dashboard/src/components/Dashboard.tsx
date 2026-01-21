import { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Stack,
  Box,
  CircularProgress,
} from '@mui/material';
import type { AuthUser } from 'aws-amplify/auth';
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
      const functionUrl = (outputs as any).custom?.getDeviceStatus;
      
      if (!functionUrl) {
        throw new Error('getDeviceStatus function URL not found in outputs');
      }

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: 'URL_Monitor_XIAO' }),
      });

      const data = await response.json();
      
      if (data.item) {
        setDeviceStatus({
          deviceId: data.item.device,
          status: data.item.internet_ok ? 'online' : 'offline',
          lastSeen: new Date(data.item.timestamp * 1000).toISOString(),
          uptime: data.item.uptime_sec,
          temperature: undefined, // Not in current schema
          wifiSignal: data.item.signal_strength,
        });
      }
      setLoading(false);
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
      const functionUrl = (outputs as any).custom?.triggerReboot;
      
      if (!functionUrl) {
        throw new Error('triggerReboot function URL not found in outputs');
      }

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: deviceStatus.deviceId }),
      });

      const data = await response.json();
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

      <Box sx={{ mt: 4 }}>
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
      </Box>
    </Box>
  );
}

export default Dashboard;
