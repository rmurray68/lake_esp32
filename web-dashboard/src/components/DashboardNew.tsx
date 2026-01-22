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
  const [cycling, setCycling] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [esp32Rebooting, setEsp32Rebooting] = useState(false);
  const [esp32Countdown, setEsp32Countdown] = useState(0);

  useEffect(() => {
    loadDeviceStatuses();
    
    const interval = setInterval(loadDeviceStatuses, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (cycling && countdown === 0) {
      setCycling(false);
      loadDeviceStatuses();
    }
  }, [countdown, cycling]);

  useEffect(() => {
    if (esp32Countdown > 0) {
      const timer = setTimeout(() => setEsp32Countdown(esp32Countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (esp32Rebooting && esp32Countdown === 0) {
      setEsp32Rebooting(false);
      loadDeviceStatuses();
    }
  }, [esp32Countdown, esp32Rebooting]);

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
      setCycling(true);
      setCountdown(30);
    } catch (error) {
      console.error('Error triggering reboot:', error);
      alert('Failed to trigger reboot');
    }
  };

  const handlePowerOn = async () => {
    if (!logmorStatus) return;
    
    try {
      await api.powerOn(logmorStatus.deviceId);
      // Refresh immediately to show new relay state
      await loadDeviceStatuses();
    } catch (error) {
      console.error('Error turning power on:', error);
      alert('Failed to turn power on');
    }
  };

  const handlePowerOff = async () => {
    if (!logmorStatus) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to turn OFF power? This will disconnect the internet!`
    );
    
    if (!confirmed) return;
    
    try {
      await api.powerOff(logmorStatus.deviceId);
      // Refresh immediately to show new relay state
      await loadDeviceStatuses();
    } catch (error) {
      console.error('Error turning power off:', error);
      alert('Failed to turn power off');
    }
  };

  const handleEsp32Reboot = async () => {
    const confirmed = window.confirm('Are you sure you want to reboot the ESP32 device?');
    if (!confirmed) return;
    
    try {
      await api.triggerEsp32Reboot();
      setEsp32Rebooting(true);
      setEsp32Countdown(30);
    } catch (error) {
      console.error('Error rebooting ESP32:', error);
      alert('Failed to send reboot command');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Lake House Internet Dashboard
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
                  title="URL Monitor (ESP32)"
                  onReboot={handleEsp32Reboot}
                  onRefresh={loadDeviceStatuses}
                  cycling={esp32Rebooting}
                  countdown={esp32Countdown}
                />
              )}
              {logmorStatus && (
                <DeviceStatusCard
                  device={logmorStatus}
                  title="Remote LTE Switch (Logmor)"
                  onReboot={handleReboot}
                  onPowerOn={handlePowerOn}
                  onPowerOff={handlePowerOff}
                  onRefresh={loadDeviceStatuses}
                  cycling={cycling}
                  countdown={countdown}
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
