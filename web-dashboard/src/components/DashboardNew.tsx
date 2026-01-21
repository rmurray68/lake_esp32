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
import * as api from '../services/api';
import type { DeviceStatus } from '../services/api';

interface DashboardProps {
  user: AuthUser | undefined;
  signOut: (() => void) | undefined;
}

function DashboardNew({ user, signOut }: DashboardProps) {
  const [esp32Status, setEsp32Status] = useState<DeviceStatus | null>(null);
  const [logmorStatus, setLogmorStatus] = useState<DeviceStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeviceStatuses();
    
    const interval = setInterval(loadDeviceStatuses, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDeviceStatuses = async () => {
    try {
      const [esp32, logmor] = await Promise.all([
        api.fetchEsp32Status(),
        api.fetchLogmorStatus(),
      ]);
      
      setEsp32Status(esp32);
      setLogmorStatus(logmor);
      setLoading(false);
    } catch (error) {
      console.error('Error loading device statuses:', error);
      setLoading(false);
    }
  };

  const handleReboot = async () => {
    if (!logmorStatus) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to reboot ${logmorStatus.deviceId}?`
    );
    
    if (!confirmed) return;
    
    try {
      await api.triggerReboot(logmorStatus.deviceId);
      alert('Reboot command sent successfully!');
      setTimeout(loadDeviceStatuses, 2000);
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
