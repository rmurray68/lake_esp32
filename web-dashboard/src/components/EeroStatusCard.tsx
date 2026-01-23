import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton as DialogCloseButton,
  Link,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import WifiIcon from '@mui/icons-material/Wifi';
import DevicesIcon from '@mui/icons-material/Devices';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';
import type { EeroHealth } from '../services/api';

interface EeroStatusCardProps {
  eeroHealth: EeroHealth | null;
  loading: boolean;
  onRefresh: () => void;
}

export default function EeroStatusCard({ eeroHealth, loading, onRefresh }: EeroStatusCardProps) {
  const [devicesDialogOpen, setDevicesDialogOpen] = useState(false);
  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!eeroHealth) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <WifiIcon color="action" />
              <Typography variant="h6">Eero Network</Typography>
            </Box>
            <IconButton onClick={onRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Box>
          <Typography color="error">Unable to load network status</Typography>
        </CardContent>
      </Card>
    );
  }

  const networkStatus = eeroHealth.disconnectedCount > 0 ? 'warning' : 'success';
  const statusColor = networkStatus === 'success' ? 'success' : 'warning';

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <WifiIcon color={statusColor} />
            <Typography variant="h6">{eeroHealth.network.name}</Typography>
          </Box>
          <IconButton onClick={onRefresh} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>

        <Box display="flex" gap={1} mb={2} flexWrap="wrap">
          <Chip
            icon={<DevicesIcon />}
            label={`${eeroHealth.deviceCount} Online`}
            color="success"
            size="small"
          />
          {eeroHealth.disconnectedCount > 0 && (
            <Chip
              icon={<ErrorIcon />}
              label={`${eeroHealth.disconnectedCount} Offline`}
              color="warning"
              size="small"
            />
          )}
        </Box>

        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Connected Devices ({eeroHealth.deviceCount}):
          </Typography>
          <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
            {eeroHealth.connectedDevices.slice(0, 5).map((device, index) => (
              <Box
                key={index}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                py={0.5}
                borderBottom={index < 4 ? '1px solid' : 'none'}
                borderColor="divider"
              >
                <Box>
                  <Typography variant="body2">{device.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {device.location} • {device.ip}
                  </Typography>
                </Box>
                <Tooltip title={device.signal}>
                  <Typography variant="caption" color="text.secondary">
                    {device.signal}
                  </Typography>
                </Tooltip>
              </Box>
            ))}
            {eeroHealth.deviceCount > 5 && (
              <Link
                component="button"
                variant="caption"
                onClick={() => setDevicesDialogOpen(true)}
                sx={{ pt: 1, display: 'block', cursor: 'pointer' }}
              >
                ...and {eeroHealth.deviceCount - 5} more
              </Link>
            )}
          </Box>
        </Box>

        {eeroHealth.disconnectedCount > 0 && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Recently Disconnected:
            </Typography>
            {eeroHealth.disconnectedDevices.slice(0, 3).map((device, index) => (
              <Typography key={index} variant="caption" display="block" color="warning.main">
                • {device.name} - Last seen: {new Date(device.lastActive).toLocaleString()}
              </Typography>
            ))}
          </Box>
        )}
      </CardContent>

      <Dialog
        open={devicesDialogOpen}
        onClose={() => setDevicesDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          All Connected Devices ({eeroHealth.deviceCount})
          <DialogCloseButton
            onClick={() => setDevicesDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </DialogCloseButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ maxHeight: 500, overflowY: 'auto' }}>
            {eeroHealth.connectedDevices.map((device, index) => (
              <Box
                key={index}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                py={1}
                borderBottom={index < eeroHealth.connectedDevices.length - 1 ? '1px solid' : 'none'}
                borderColor="divider"
              >
                <Box>
                  <Typography variant="body2">{device.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {device.location} • {device.ip}
                  </Typography>
                </Box>
                <Tooltip title={device.signal}>
                  <Typography variant="caption" color="text.secondary">
                    {device.signal}
                  </Typography>
                </Tooltip>
              </Box>
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
