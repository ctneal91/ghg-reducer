import { render, screen, fireEvent } from '@testing-library/react';
import EmissionsTimeChart from './EmissionsTimeChart';
import { Activity } from '../types/activity';

// Mock Recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="area-chart" data-points={data.length}>
      {children}
    </div>
  ),
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

const createActivity = (overrides: Partial<Activity> = {}): Activity => ({
  id: 1,
  activity_type: 'driving',
  description: null,
  quantity: 100,
  unit: 'km',
  emission_kg: 21,
  emission_source: 'local',
  occurred_at: '2024-01-15T10:00:00Z',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  ...overrides,
});

describe('EmissionsTimeChart', () => {
  it('renders chart title', () => {
    const activities = [createActivity()];
    render(<EmissionsTimeChart activities={activities} />);

    expect(screen.getByText('Emissions Over Time')).toBeInTheDocument();
  });

  it('renders area chart when activities are provided', () => {
    const activities = [createActivity()];
    render(<EmissionsTimeChart activities={activities} />);

    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    expect(screen.getByTestId('area')).toBeInTheDocument();
  });

  it('shows empty state when no activities', () => {
    render(<EmissionsTimeChart activities={[]} />);

    expect(screen.getByText('No emissions data to display')).toBeInTheDocument();
    expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
  });

  it('renders weekly/monthly toggle buttons', () => {
    const activities = [createActivity()];
    render(<EmissionsTimeChart activities={activities} />);

    expect(screen.getByRole('button', { name: 'Weekly' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Monthly' })).toBeInTheDocument();
  });

  it('defaults to monthly view', () => {
    const activities = [createActivity()];
    render(<EmissionsTimeChart activities={activities} />);

    const monthlyButton = screen.getByRole('button', { name: 'Monthly' });
    expect(monthlyButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches to weekly view when toggle is clicked', () => {
    const activities = [createActivity()];
    render(<EmissionsTimeChart activities={activities} />);

    const weeklyButton = screen.getByRole('button', { name: 'Weekly' });
    fireEvent.click(weeklyButton);

    expect(weeklyButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('groups activities by month correctly', () => {
    const activities = [
      createActivity({ id: 1, occurred_at: '2024-01-15T10:00:00Z', emission_kg: 10 }),
      createActivity({ id: 2, occurred_at: '2024-01-20T10:00:00Z', emission_kg: 15 }),
      createActivity({ id: 3, occurred_at: '2024-02-10T10:00:00Z', emission_kg: 20 }),
    ];
    render(<EmissionsTimeChart activities={activities} />);

    const chart = screen.getByTestId('area-chart');
    expect(chart).toHaveAttribute('data-points', '2');
  });

  it('groups activities by week when weekly view is selected', () => {
    const activities = [
      createActivity({ id: 1, occurred_at: '2024-01-01T10:00:00Z', emission_kg: 10 }),
      createActivity({ id: 2, occurred_at: '2024-01-08T10:00:00Z', emission_kg: 15 }),
      createActivity({ id: 3, occurred_at: '2024-01-15T10:00:00Z', emission_kg: 20 }),
    ];
    render(<EmissionsTimeChart activities={activities} />);

    const weeklyButton = screen.getByRole('button', { name: 'Weekly' });
    fireEvent.click(weeklyButton);

    const chart = screen.getByTestId('area-chart');
    expect(chart).toHaveAttribute('data-points', '3');
  });

  it('renders chart axes and grid', () => {
    const activities = [createActivity()];
    render(<EmissionsTimeChart activities={activities} />);

    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
  });

  it('renders responsive container', () => {
    const activities = [createActivity()];
    render(<EmissionsTimeChart activities={activities} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });
});
