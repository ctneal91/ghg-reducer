import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { api } from '../api/client';
import { ActivityType, ActivityFormData } from '../types/activity';

const activityTypes: { value: ActivityType; label: string; unit: string }[] = [
  { value: 'driving', label: 'Driving', unit: 'km' },
  { value: 'flight', label: 'Flight', unit: 'km' },
  { value: 'electricity', label: 'Electricity', unit: 'kWh' },
  { value: 'natural_gas', label: 'Natural Gas', unit: 'therms' },
  { value: 'food_beef', label: 'Food (Beef)', unit: 'kg' },
  { value: 'food_chicken', label: 'Food (Chicken)', unit: 'kg' },
  { value: 'purchase', label: 'Purchase', unit: 'USD' },
];

interface ActivityFormProps {
  onSuccess?: () => void;
}

export function ActivityForm({ onSuccess }: ActivityFormProps) {
  const [formData, setFormData] = useState<ActivityFormData>({
    activity_type: 'driving',
    description: '',
    quantity: 0,
    occurred_at: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedType = activityTypes.find((t) => t.value === formData.activity_type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.createActivity({
        ...formData,
        occurred_at: new Date(formData.occurred_at).toISOString(),
      });
      setSuccess(true);
      setFormData({
        activity_type: 'driving',
        description: '',
        quantity: 0,
        occurred_at: new Date().toISOString().split('T')[0],
      });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Log New Activity
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Activity logged successfully!
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Activity Type</InputLabel>
            <Select
              value={formData.activity_type}
              label="Activity Type"
              onChange={(e) =>
                setFormData({ ...formData, activity_type: e.target.value as ActivityType })
              }
            >
              {activityTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            label="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <TextField
            fullWidth
            margin="normal"
            label={`Quantity (${selectedType?.unit || 'units'})`}
            type="number"
            inputProps={{ min: 0, step: 'any' }}
            value={formData.quantity || ''}
            onChange={(e) =>
              setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })
            }
            required
          />

          <TextField
            fullWidth
            margin="normal"
            label="Date"
            type="date"
            value={formData.occurred_at}
            onChange={(e) => setFormData({ ...formData, occurred_at: e.target.value })}
            required
            slotProps={{
              inputLabel: { shrink: true },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading || formData.quantity <= 0}
            sx={{ mt: 2 }}
          >
            {loading ? 'Saving...' : 'Log Activity'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
