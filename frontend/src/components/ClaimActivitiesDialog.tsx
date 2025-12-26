import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

interface ClaimActivitiesDialogProps {
  open: boolean;
  onClose: () => void;
  onClaimed: () => void;
}

export function ClaimActivitiesDialog({ open, onClose, onClaimed }: ClaimActivitiesDialogProps) {
  const { claimGuestActivities } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleClaim = async () => {
    setLoading(true);
    try {
      await claimGuestActivities();
      onClaimed();
    } catch {
      // Silently fail - activities will remain as guest
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Transfer Your Activities?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          You have activities from your guest session. Would you like to transfer them to your account?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSkip} disabled={loading}>
          Skip
        </Button>
        <Button onClick={handleClaim} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Transfer Activities'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
