import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import { manageEeroToken } from '../services/api';

interface EeroTokenDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function EeroTokenDialog({ open, onClose }: EeroTokenDialogProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [userToken, setUserToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const steps = ['Enter Phone', 'Verify Code', 'Complete'];

  const handleStartLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await manageEeroToken({ action: 'login', phone });
      setUserToken(result.user_token);
      setSuccess('SMS code sent! Check your phone.');
      setActiveStep(1);
    } catch (err) {
      setError(`Failed to send code: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setLoading(true);
    setError('');
    try {
      await manageEeroToken({ action: 'verify', code, user_token: userToken });
      setSuccess('Token saved successfully!');
      setActiveStep(2);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(`Verification failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setPhone('');
    setCode('');
    setUserToken('');
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Eero Token Management</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {activeStep === 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Enter the phone number or email associated with your Eero account.
                You'll receive an SMS verification code.
              </Typography>
              <TextField
                fullWidth
                label="Phone Number or Email"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890 or email@example.com"
                sx={{ mt: 2 }}
                disabled={loading}
              />
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Enter the 6-digit verification code sent to your phone.
              </Typography>
              <TextField
                fullWidth
                label="Verification Code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                sx={{ mt: 2 }}
                disabled={loading}
                inputProps={{ maxLength: 6 }}
              />
            </Box>
          )}

          {activeStep === 2 && (
            <Box textAlign="center">
              <Typography variant="h6" color="success.main">
                ✓ Token Updated Successfully
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Your Eero session has been refreshed.
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {activeStep === 2 ? 'Done' : 'Cancel'}
        </Button>
        {activeStep === 0 && (
          <Button
            onClick={handleStartLogin}
            variant="contained"
            disabled={!phone || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Send Code'}
          </Button>
        )}
        {activeStep === 1 && (
          <Button
            onClick={handleVerifyCode}
            variant="contained"
            disabled={!code || code.length !== 6 || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Verify'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
