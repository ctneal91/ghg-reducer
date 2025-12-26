import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import Co2Icon from '@mui/icons-material/Co2';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { api } from '../api/client';
import { Activity } from '../types/activity';

interface DashboardProps {
  refreshTrigger?: number;
}

interface EmissionsByType {
  [key: string]: number;
}

export function Dashboard({ refreshTrigger }: DashboardProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await api.getActivities();
        setActivities(data.activities);
        setTotalEmissions(Number(data.summary.total_emissions_kg));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshTrigger]);

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

  const emissionsByType = activities.reduce<EmissionsByType>((acc, activity) => {
    const type = activity.activity_type;
    acc[type] = (acc[type] || 0) + Number(activity.emission_kg);
    return acc;
  }, {});

  const topEmitter = Object.entries(emissionsByType).sort((a, b) => b[1] - a[1])[0];

  const typeLabels: Record<string, string> = {
    driving: 'Driving',
    flight: 'Flights',
    electricity: 'Electricity',
    natural_gas: 'Natural Gas',
    food_beef: 'Beef',
    food_chicken: 'Chicken',
    purchase: 'Purchases',
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Co2Icon color="error" sx={{ fontSize: 48 }} />
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Emissions
                  </Typography>
                  <Typography variant="h4">
                    {totalEmissions.toFixed(1)}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    kg CO2
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <LocalActivityIcon color="primary" sx={{ fontSize: 48 }} />
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Activities Logged
                  </Typography>
                  <Typography variant="h4">{activities.length}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    total activities
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TrendingUpIcon color="warning" sx={{ fontSize: 48 }} />
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Top Emitter
                  </Typography>
                  <Typography variant="h4">
                    {topEmitter ? typeLabels[topEmitter[0]] || topEmitter[0] : '-'}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {topEmitter ? `${topEmitter[1].toFixed(1)} kg CO2` : 'No data'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Emissions by Category
              </Typography>
              {Object.keys(emissionsByType).length === 0 ? (
                <Typography color="text.secondary">
                  No activities logged yet. Start tracking to see your breakdown!
                </Typography>
              ) : (
                <Box>
                  {Object.entries(emissionsByType)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, emissions]) => (
                      <Box key={type} sx={{ mb: 2 }}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography>{typeLabels[type] || type}</Typography>
                          <Typography fontWeight="bold">
                            {emissions.toFixed(1)} kg CO2
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            height: 8,
                            bgcolor: 'grey.200',
                            borderRadius: 1,
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              height: '100%',
                              width: `${(emissions / totalEmissions) * 100}%`,
                              bgcolor: 'primary.main',
                              borderRadius: 1,
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
