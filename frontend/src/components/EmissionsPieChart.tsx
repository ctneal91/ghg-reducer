import { Card, CardContent, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, PieLabelRenderProps } from 'recharts';
import { getActivityTypeLabel, ActivityType } from '../types/activity';

interface EmissionsPieChartProps {
  emissionsByType: Record<string, number>;
}

const CHART_COLORS: Record<string, string> = {
  driving: '#2e7d32',
  flight: '#00695c',
  electricity: '#f57c00',
  natural_gas: '#1976d2',
  food_beef: '#d32f2f',
  food_chicken: '#c62828',
  purchase: '#388e3c',
};

interface ChartDataItem {
  name: string;
  value: number;
  type: string;
  [key: string]: string | number;
}

export default function EmissionsPieChart({ emissionsByType }: EmissionsPieChartProps) {
  const chartData: ChartDataItem[] = Object.entries(emissionsByType)
    .filter(([, value]) => value > 0)
    .map(([type, value]) => ({
      name: getActivityTypeLabel(type),
      value: Number(value.toFixed(2)),
      type,
    }))
    .sort((a, b) => b.value - a.value);

  const totalEmissions = chartData.reduce((sum, item) => sum + item.value, 0);

  const renderCustomLabel = (props: PieLabelRenderProps) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    if (
      typeof cx !== 'number' ||
      typeof cy !== 'number' ||
      typeof midAngle !== 'number' ||
      typeof innerRadius !== 'number' ||
      typeof outerRadius !== 'number' ||
      typeof percent !== 'number' ||
      percent < 0.05
    ) {
      return null;
    }
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: ChartDataItem }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalEmissions) * 100).toFixed(1);
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
            {data.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data.value.toFixed(2)} kg CO₂ ({percentage}%)
          </Typography>
        </Box>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Emissions by Category
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
        <Typography variant="h6" gutterBottom>
          Emissions by Category
        </Typography>
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                innerRadius={40}
                dataKey="value"
                paddingAngle={2}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={`cell-${entry.type}`}
                    fill={CHART_COLORS[entry.type as ActivityType] || '#9e9e9e'}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string) => (
                  <span style={{ color: '#666', fontSize: 12 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
