import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Box,
} from '@mui/material';

interface LogEntry {
  timestamp: string;
  status: 'success' | 'warning' | 'error';
  message: string;
}

interface RecentLogsProps {
  deviceId: string;
}

function RecentLogs({ deviceId }: RecentLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (deviceId) {
      fetchLogs();
      // Poll for new logs every minute
      const interval = setInterval(fetchLogs, 60000);
      return () => clearInterval(interval);
    }
  }, [deviceId]);

  const fetchLogs = async () => {
    try {
      // TODO: Query DynamoDB for recent logs
      // For now, using mock data
      const mockLogs: LogEntry[] = [
        {
          timestamp: new Date(Date.now() - 120000).toISOString(),
          status: 'success',
          message: 'Health check passed',
        },
        {
          timestamp: new Date(Date.now() - 180000).toISOString(),
          status: 'success',
          message: 'Health check passed',
        },
        {
          timestamp: new Date(Date.now() - 240000).toISOString(),
          status: 'success',
          message: 'Health check passed',
        },
        {
          timestamp: new Date(Date.now() - 300000).toISOString(),
          status: 'warning',
          message: 'High temperature detected',
        },
        {
          timestamp: new Date(Date.now() - 360000).toISOString(),
          status: 'success',
          message: 'Health check passed',
        },
      ];
      setLogs(mockLogs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusColor = (
    status: string
  ): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Recent Activity
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Message</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log, index) => (
                  <TableRow key={index}>
                    <TableCell>{formatTime(log.timestamp)}</TableCell>
                    <TableCell>
                      <Chip
                        label={log.status}
                        color={getStatusColor(log.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{log.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentLogs;
