import { useState, useMemo } from 'react';
import { Card, CardContent, Typography, Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity } from '../types/activity';

interface EmissionsTimeChartProps {
  activities: Activity[];
}

type TimeGrouping = 'weekly' | 'monthly';

interface TimeDataPoint {
  label: string;
  emissions: number;
  date: Date;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(date: Date): string {
  const month = date.toLocaleString('default', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleString('default', { month: 'short', year: '2-digit' });
}

function groupByWeek(activities: Activity[]): TimeDataPoint[] {
  const groups = new Map<string, { emissions: number; date: Date }>();

  activities.forEach((activity) => {
    const date = new Date(activity.occurred_at);
    const weekStart = getWeekStart(date);
    const key = weekStart.toISOString().split('T')[0];

    if (!groups.has(key)) {
      groups.set(key, { emissions: 0, date: weekStart });
    }
    const group = groups.get(key)!;
    group.emissions += Number(activity.emission_kg);
  });

  return Array.from(groups.entries())
    .map(([, data]) => ({
      label: formatWeekLabel(data.date),
      emissions: Number(data.emissions.toFixed(2)),
      date: data.date,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

function groupByMonth(activities: Activity[]): TimeDataPoint[] {
  const groups = new Map<string, { emissions: number; date: Date }>();

  activities.forEach((activity) => {
    const date = new Date(activity.occurred_at);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;

    if (!groups.has(key)) {
      groups.set(key, { emissions: 0, date: monthStart });
    }
    const group = groups.get(key)!;
    group.emissions += Number(activity.emission_kg);
  });

  return Array.from(groups.entries())
    .map(([, data]) => ({
      label: formatMonthLabel(data.date),
      emissions: Number(data.emissions.toFixed(2)),
      date: data.date,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          bgcolor: 'background.paper',
          p: 1.5,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          boxShadow: 1,
        }}
      >
        <Typography variant="body2" fontWeight="bold">
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {payload[0].value.toFixed(2)} kg CO₂
        </Typography>
      </Box>
    );
  }
  return null;
};

export default function EmissionsTimeChart({ activities }: EmissionsTimeChartProps) {
  const [grouping, setGrouping] = useState<TimeGrouping>('monthly');

  const chartData = useMemo(() => {
    if (activities.length === 0) return [];
    return grouping === 'weekly' ? groupByWeek(activities) : groupByMonth(activities);
  }, [activities, grouping]);

  const handleGroupingChange = (
    _event: React.MouseEvent<HTMLElement>,
    newGrouping: TimeGrouping | null
  ) => {
    if (newGrouping !== null) {
      setGrouping(newGrouping);
    }
  };

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Emissions Over Time
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No emissions data to display
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Emissions Over Time</Typography>
          <ToggleButtonGroup
            value={grouping}
            exclusive
            onChange={handleGroupingChange}
            size="small"
          >
            <ToggleButton value="weekly">Weekly</ToggleButton>
            <ToggleButton value="monthly">Monthly</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e0e0e0' }}
                tickFormatter={(value) => `${value}`}
                label={{
                  value: 'kg CO₂',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12, fill: '#666' },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="emissions"
                stroke="#2e7d32"
                fill="#2e7d32"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
