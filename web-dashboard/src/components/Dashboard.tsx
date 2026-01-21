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
      // Get the outputs to find Lambda function URLs
      // TODO: Use fetchAuthSession when connecting to real backend
      
      // TODO: Replace with actual Lambda invocation using aws-amplify/api
      // For now, using mock data until sandbox is deployed
      setDeviceStatus({
        deviceId: 'logmor-switch-01',
        status: 'online',
        lastSeen: new Date().toISOString(),
        uptime: 86400, // 1 day in seconds
        temperature: 45.2,
        wifiSignal: -55,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching device status:', error);
      setLoading(false);
    }
  };

  const handleReboot = async () => {
    if (!deviceStatus) return;
    
    try {
      // TODO: Replace with actual Lambda invocation using aws-amplify/api
      // For now, just logging
      console.log('Triggering reboot for device:', deviceStatus.deviceId);
      
      const confirmed = window.confirm(
        `Are you sure you want to reboot ${deviceStatus.deviceId}?`
      );
      
      if (confirmed) {
        alert('Reboot command sent to device (mock)');
        // Refresh status after a delay
        setTimeout(fetchDeviceStatus, 2000);
      }
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
