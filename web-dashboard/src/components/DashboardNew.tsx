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

function DashboardNew({ user, signOut }: DashboardProps) {
  const [esp32Status, setEsp32Status] = useState<DeviceStatus | null>(null);
  const [logmorStatus, setLogmorStatus] = useState<DeviceStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEsp32Status();
    fetchLogmorStatus();
    
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
      
      if (data.error) throw new Error(data.error);
      
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
      setTimeout(fetchLogmorStatus, 2000);
    } catch (error) {
      console.error('Error triggering reboot:', error);
      alert('Failed to trigger reboot');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
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

      <Box sx={{ flex: 1, p: { xs: 2, sm: 3 } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Device Cards Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(2, 1fr)',
                },
                gap: 3,
                mb: 3,
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

            {/* Recent Logs */}
            <RecentLogs deviceId={esp32Status?.deviceId || ''} />
          </>
        )}
      </Box>
    </Box>
  );
}

export default DashboardNew;
