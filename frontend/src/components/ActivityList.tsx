import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { api } from '../api/client';
import { Activity } from '../types/activity';

const activityTypeLabels: Record<string, string> = {
  driving: 'Driving',
  flight: 'Flight',
  electricity: 'Electricity',
  natural_gas: 'Natural Gas',
  food_beef: 'Food (Beef)',
  food_chicken: 'Food (Chicken)',
  purchase: 'Purchase',
};

const activityTypeColors: Record<string, 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
  driving: 'primary',
  flight: 'secondary',
  electricity: 'warning',
  natural_gas: 'info',
  food_beef: 'error',
  food_chicken: 'error',
  purchase: 'success',
};

interface ActivityListProps {
  refreshTrigger?: number;
  onActivityDeleted?: () => void;
}

export function ActivityList({ refreshTrigger, onActivityDeleted }: ActivityListProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const data = await api.getActivities();
      setActivities(data.activities);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [refreshTrigger]);

  const handleDelete = async (id: number) => {
    try {
      await api.deleteActivity(id);
      setActivities(activities.filter((a) => a.id !== id));
      onActivityDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete activity');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary" align="center">
            No activities logged yet. Start by logging your first activity!
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>Description</TableCell>
            <TableCell align="right">Quantity</TableCell>
            <TableCell align="right">Emissions (kg CO2)</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {activities.map((activity) => (
            <TableRow key={activity.id}>
              <TableCell>
                <Chip
                  label={activityTypeLabels[activity.activity_type] || activity.activity_type}
                  color={activityTypeColors[activity.activity_type] || 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell>{activity.description || '-'}</TableCell>
              <TableCell align="right">
                {Number(activity.quantity).toLocaleString()} {activity.unit}
              </TableCell>
              <TableCell align="right">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                  {Number(activity.emission_kg).toFixed(2)}
                  {activity.emission_source && activity.emission_source !== 'local' && (
                    <Tooltip title={`Source: ${activity.emission_source}`} arrow>
                      <InfoOutlinedIcon sx={{ fontSize: 14, color: 'success.main', cursor: 'help' }} />
                    </Tooltip>
                  )}
                </Box>
              </TableCell>
              <TableCell>{formatDate(activity.occurred_at)}</TableCell>
              <TableCell align="center">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(activity.id)}
                  aria-label="delete"
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
