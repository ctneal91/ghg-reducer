import { Box, Card, CardContent, Typography } from '@mui/material';
import { ReactElement } from 'react';

interface StatCardProps {
  icon: ReactElement;
  label: string;
  value: string | number;
  subtitle: string;
}

export function StatCard({ icon, label, value, subtitle }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2}>
          {icon}
          <Box>
            <Typography color="text.secondary" variant="body2">
              {label}
            </Typography>
            <Typography variant="h4">{value}</Typography>
            <Typography color="text.secondary" variant="body2">
              {subtitle}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
