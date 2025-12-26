import { Box, Card, CardContent, Typography } from '@mui/material';
import { getActivityTypeLabel } from '../types/activity';

interface EmissionsBreakdownProps {
  emissionsByType: Record<string, number>;
  totalEmissions: number;
}

export function EmissionsBreakdown({ emissionsByType, totalEmissions }: EmissionsBreakdownProps) {
  const sortedEmissions = Object.entries(emissionsByType).sort((a, b) => b[1] - a[1]);
  const hasData = sortedEmissions.length > 0;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Emissions by Category
        </Typography>
        {!hasData ? (
          <Typography color="text.secondary">
            No activities logged yet. Start tracking to see your breakdown!
          </Typography>
        ) : (
          <Box>
            {sortedEmissions.map(([type, emissions]) => (
              <Box key={type} sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography>{getActivityTypeLabel(type)}</Typography>
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
  );
}
