import { render, screen } from '@testing-library/react';
import EmissionsPieChart from './EmissionsPieChart';

// Mock Recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ data }: { data: Array<{ name: string; value: number }> }) => (
    <div data-testid="pie" data-items={data.length} />
  ),
  Cell: () => <div data-testid="cell" />,
  Legend: () => <div data-testid="legend" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

describe('EmissionsPieChart', () => {
  it('renders chart title', () => {
    const emissionsByType = { driving: 10, flight: 20 };
    render(<EmissionsPieChart emissionsByType={emissionsByType} />);

    expect(screen.getByText('Emissions by Category')).toBeInTheDocument();
  });

  it('renders pie chart when data is provided', () => {
    const emissionsByType = { driving: 10, flight: 20, electricity: 15 };
    render(<EmissionsPieChart emissionsByType={emissionsByType} />);

    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie')).toBeInTheDocument();
  });

  it('shows empty state when no emissions data', () => {
    render(<EmissionsPieChart emissionsByType={{}} />);

    expect(screen.getByText('No emissions data to display')).toBeInTheDocument();
    expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument();
  });

  it('filters out zero-value entries', () => {
    const emissionsByType = { driving: 10, flight: 0, electricity: 5 };
    render(<EmissionsPieChart emissionsByType={emissionsByType} />);

    const pie = screen.getByTestId('pie');
    expect(pie).toHaveAttribute('data-items', '2');
  });

  it('renders responsive container for chart sizing', () => {
    const emissionsByType = { driving: 50 };
    render(<EmissionsPieChart emissionsByType={emissionsByType} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('includes legend and tooltip', () => {
    const emissionsByType = { driving: 25, flight: 75 };
    render(<EmissionsPieChart emissionsByType={emissionsByType} />);

    expect(screen.getByTestId('legend')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });
});
