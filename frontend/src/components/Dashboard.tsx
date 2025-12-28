import { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, Grid } from '@mui/material';
import Co2Icon from '@mui/icons-material/Co2';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { api } from '../api/client';
import { Activity, getActivityTypeLabel } from '../types/activity';
import { StatCard } from './StatCard';
import { EmissionsBreakdown } from './EmissionsBreakdown';
import EmissionsPieChart from './EmissionsPieChart';
import EmissionsTimeChart from './EmissionsTimeChart';

interface DashboardProps {
  refreshTrigger?: number;
}

function calculateEmissionsByType(activities: Activity[]): Record<string, number> {
  return activities.reduce<Record<string, number>>((acc, activity) => {
    const type = activity.activity_type;
    acc[type] = (acc[type] || 0) + Number(activity.emission_kg);
    return acc;
  }, {});
}

function getTopEmitter(emissionsByType: Record<string, number>): [string, number] | undefined {
  const entries = Object.entries(emissionsByType);
  if (entries.length === 0) return undefined;
  return entries.sort((a, b) => b[1] - a[1])[0];
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

  const emissionsByType = calculateEmissionsByType(activities);
  const topEmitter = getTopEmitter(emissionsByType);

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatCard
            icon={<Co2Icon color="error" sx={{ fontSize: 48 }} />}
            label="Total Emissions"
            value={totalEmissions.toFixed(1)}
            subtitle="kg CO2"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <StatCard
            icon={<LocalActivityIcon color="primary" sx={{ fontSize: 48 }} />}
            label="Activities Logged"
            value={activities.length}
            subtitle="total activities"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <StatCard
            icon={<TrendingUpIcon color="warning" sx={{ fontSize: 48 }} />}
            label="Top Emitter"
            value={topEmitter ? getActivityTypeLabel(topEmitter[0]) : '-'}
            subtitle={topEmitter ? `${topEmitter[1].toFixed(1)} kg CO2` : 'No data'}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <EmissionsBreakdown
            emissionsByType={emissionsByType}
            totalEmissions={totalEmissions}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <EmissionsPieChart emissionsByType={emissionsByType} />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <EmissionsTimeChart activities={activities} />
        </Grid>
      </Grid>
    </Box>
  );
}
