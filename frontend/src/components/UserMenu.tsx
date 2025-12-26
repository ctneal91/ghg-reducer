import { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

interface UserMenuProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
}

export function UserMenu({ onLoginClick, onSignupClick }: UserMenuProps) {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    window.location.reload();
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button color="inherit" onClick={onLoginClick}>
          Log In
        </Button>
        <Button color="inherit" variant="outlined" onClick={onSignupClick}>
          Sign Up
        </Button>
      </Box>
    );
  }

  return (
    <>
      <IconButton color="inherit" onClick={handleMenuOpen}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
          {user.name.charAt(0).toUpperCase()}
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem disabled>
          <Box>
            <Typography variant="body2" fontWeight="bold">
              {user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleLogout}>Log Out</MenuItem>
      </Menu>
    </>
  );
}
