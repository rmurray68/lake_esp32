import { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  CircularProgress,
  IconButton,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import type { AuthUser } from 'aws-amplify/auth';
import DeviceStatusCard from './DeviceStatusCard.tsx';
import EeroStatusCard from './EeroStatusCard.tsx';
import EeroTokenDialog from './EeroTokenDialog.tsx';
import RecentLogs from './RecentLogs.tsx';
import * as api from '../services/api';
import type { DeviceStatus, EeroHealth } from '../services/api';

interface DashboardProps {
  user: AuthUser | undefined;
  signOut: (() => void) | undefined;
}

function DashboardNew({ user, signOut }: DashboardProps) {
  const [eeroHealth, setEeroHealth] = useState<EeroHealth | null>(null);
  const [logmorStatus, setLogmorStatus] = useState<DeviceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [eeroLoading, setEeroLoading] = useState(true);
  const [cycling, setCycling] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);

  useEffect(() => {
    loadDeviceStatuses();
    loadEeroHealth();
    
    const interval = setInterval(() => {
      loadDeviceStatuses();
      loadEeroHealth();
    }, 30000);
    
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

  const loadDeviceStatuses = async () => {
    try {
      const logmor = await api.fetchLogmorStatus();
      setLogmorStatus(logmor);
      setLoading(false);
    } catch (error) {
      console.error('Error loading device statuses:', error);
      setLoading(false);
    }
  };

  const loadEeroHealth = async () => {
    try {
      const health = await api.fetchEeroHealth();
      setEeroHealth(health);
      setEeroLoading(false);
    } catch (error) {
      console.error('Error loading Eero health:', error);
      setEeroLoading(false);
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

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Lake House Internet Dashboard
          </Typography>
          <IconButton color="inherit" onClick={() => setTokenDialogOpen(true)}>
            <SettingsIcon />
          </IconButton>
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
              <EeroStatusCard
                eeroHealth={eeroHealth}
                loading={eeroLoading}
                onRefresh={loadEeroHealth}
              />
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
            <RecentLogs deviceId="network" />
          </>
        )}
      </Box>

      <EeroTokenDialog
        open={tokenDialogOpen}
        onClose={() => setTokenDialogOpen(false)}
      />
    </Box>
  );
}

export default DashboardNew;
