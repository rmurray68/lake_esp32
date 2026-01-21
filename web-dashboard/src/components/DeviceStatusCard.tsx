import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Stack,
} from '@mui/material';
import {
  PowerSettingsNew,
  WifiTwoTone,
  Thermostat,
  AccessTime,
} from '@mui/icons-material';
import type { DeviceStatus } from '../services/api';

interface DeviceStatusCardProps {
  device: DeviceStatus;
  title?: string;
  onReboot?: () => void;
}

function DeviceStatusCard({ device, title, onReboot }: DeviceStatusCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'success';
      case 'offline':
        return 'error';
      case 'unreachable':
        return 'error';
      case 'error':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatLastSeen = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" component="div">
            {title || device.deviceId}
          </Typography>
          <Chip
            label={device.status.toUpperCase()}
            color={getStatusColor(device.status)}
            size="small"
          />
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Device ID: {device.deviceId}
        </Typography>

        <Stack spacing={2} sx={{ mt: 2 }}>
          {device.lastSeen && (
            <>
              <Stack direction="row" spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                  <AccessTime fontSize="small" color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Last Seen
                    </Typography>
                    <Typography variant="body2">
                      {formatLastSeen(device.lastSeen)}
                    </Typography>
                  </Box>
                </Box>

                {device.uptime !== undefined && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <PowerSettingsNew fontSize="small" color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Uptime
                      </Typography>
                      <Typography variant="body2">
                        {formatUptime(device.uptime)}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Stack>

              <Stack direction="row" spacing={2}>
                {device.temperature !== undefined && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <Thermostat fontSize="small" color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Temperature
                      </Typography>
                      <Typography variant="body2">
                        {device.temperature}°C
                      </Typography>
                    </Box>
                  </Box>
                )}

                {device.wifiSignal !== undefined && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <WifiTwoTone fontSize="small" color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        WiFi Signal
                      </Typography>
                      <Typography variant="body2">
                        {device.wifiSignal} dBm
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Stack>
            </>
          )}
        </Stack>
      </CardContent>
      {onReboot && (
        <CardActions>
          <Button
            size="small"
            variant="contained"
            color="warning"
            startIcon={<PowerSettingsNew />}
            onClick={onReboot}
            disabled={device.status !== 'online'}
          >
            Reboot Device
          </Button>
        </CardActions>
      )}
    </Card>
  );
}

export default DeviceStatusCard;
