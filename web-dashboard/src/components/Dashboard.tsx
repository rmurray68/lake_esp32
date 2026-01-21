import { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
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
  status: 'online' | 'offline' | 'error' | 'unreachable';
  lastSeen?: string;
  uptime?: number;
  temperature?: number;
  wifiSignal?: number;
}

function Dashboard({ user, signOut }: DashboardProps) {
  const [esp32Status, setEsp32Status] = useState<DeviceStatus | null>(null);
  const [logmorStatus, setLogmorStatus] = useState<DeviceStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial device status
    fetchEsp32Status();
    fetchLogmorStatus();
    
    // Set up polling for status updates (every 30 seconds)
    const interval = setInterval(() => {
      fetchEsp32Status();
      fetchLogmorStatus();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchEsp32Status = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/device-status');
      const data = await response.json();
      
      console.log('ESP32 status:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setEsp32Status({
        deviceId: data.deviceId,
        status: data.status,
        lastSeen: data.lastSeen,
        uptime: data.uptime,
        temperature: data.temperature,
        wifiSignal: data.wifiSignal,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ESP32 status:', error);
      setLoading(false);
    }
  };

  const fetchLogmorStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/logmor-status');
      const data = await response.json();
      
      console.log('Logmor status:', data);
      
      setLogmorStatus({
        deviceId: 'logmor-switch-01',
        status: data.status,
      });
    } catch (error) {
      console.error('Error fetching Logmor status:', error);
      setLogmorStatus({
        deviceId: 'logmor-switch-01',
        status: 'error',
      });
    }
  };

  const handleReboot = async () => {
    if (!logmorStatus) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to reboot ${logmorStatus.deviceId}?`
    );
    
    if (!confirmed) return;
    
    try {
      const response = await fetch('http://localhost:3001/api/reboot', {
        method: 'POST',
      });
      const data = await response.json();
      
      console.log('Reboot response:', data);
      
      alert('Reboot command sent successfully!');
      
      // Refresh status after a delay
      setTimeout(fetchLogmorStatus, 2000);
    } catch (error) {
      console.error('Error triggering reboot:', error);
      alert('Failed to trigger reboot');
    }
  };

  return (
    <Box sx={{ flexGrow: 1, width: '100%' }}>
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

      <Box sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 3,
              }}
            >
              {esp32Status && (
                <DeviceStatusCard
                  device={esp32Status}
                  title="ESP32 Monitor"
                />
              )}
              {logmorStatus && (
                <DeviceStatusCard
                  device={logmorStatus}
                  title="Logmor Switch"
                  onReboot={handleReboot}
                />
              )}
            </Box>
            <RecentLogs deviceId={esp32Status?.deviceId || ''} />
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default Dashboard;
