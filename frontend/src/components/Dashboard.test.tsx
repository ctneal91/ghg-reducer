import { render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { api } from '../api/client';

jest.mock('../api/client', () => ({
  api: {
    getActivities: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows loading state initially', () => {
    mockApi.getActivities.mockImplementation(() => new Promise(() => {}));
    render(<Dashboard />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays total emissions when data loads', async () => {
    mockApi.getActivities.mockResolvedValue({
      activities: [
        {
          id: 1,
          activity_type: 'driving',
          description: 'Commute',
          quantity: 100,
          unit: 'km',
          emission_kg: 21,
          occurred_at: '2024-01-15',
          created_at: '2024-01-15',
          updated_at: '2024-01-15',
        },
      ],
      summary: { activity_count: 1, total_emissions_kg: 21 },
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Total Emissions')).toBeInTheDocument();
    });
    expect(screen.getByText('21.0')).toBeInTheDocument();
    expect(screen.getByText('kg CO2')).toBeInTheDocument();
  });

  test('displays activity count', async () => {
    mockApi.getActivities.mockResolvedValue({
      activities: [
        {
          id: 1,
          activity_type: 'driving',
          description: 'Commute',
          quantity: 100,
          unit: 'km',
          emission_kg: 21,
          occurred_at: '2024-01-15',
          created_at: '2024-01-15',
          updated_at: '2024-01-15',
        },
        {
          id: 2,
          activity_type: 'flight',
          description: 'Trip',
          quantity: 500,
          unit: 'km',
          emission_kg: 127.5,
          occurred_at: '2024-01-16',
          created_at: '2024-01-16',
          updated_at: '2024-01-16',
        },
      ],
      summary: { activity_count: 2, total_emissions_kg: 148.5 },
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Activities Logged')).toBeInTheDocument();
    });
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('displays top emitter', async () => {
    mockApi.getActivities.mockResolvedValue({
      activities: [
        {
          id: 1,
          activity_type: 'flight',
          description: 'Trip',
          quantity: 500,
          unit: 'km',
          emission_kg: 127.5,
          occurred_at: '2024-01-16',
          created_at: '2024-01-16',
          updated_at: '2024-01-16',
        },
      ],
      summary: { activity_count: 1, total_emissions_kg: 127.5 },
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Top Emitter')).toBeInTheDocument();
    });
    // Use getAllByText since 'Flights' appears both in Top Emitter card and Emissions by Category
    expect(screen.getAllByText('Flights').length).toBeGreaterThan(0);
  });

  test('shows message when no activities', async () => {
    mockApi.getActivities.mockResolvedValue({
      activities: [],
      summary: { activity_count: 0, total_emissions_kg: 0 },
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(
        screen.getByText('No activities logged yet. Start tracking to see your breakdown!')
      ).toBeInTheDocument();
    });
  });

  test('shows error message on API failure', async () => {
    mockApi.getActivities.mockRejectedValue(new Error('Network error'));

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  test('refreshes when refreshTrigger changes', async () => {
    mockApi.getActivities.mockResolvedValue({
      activities: [],
      summary: { activity_count: 0, total_emissions_kg: 0 },
    });

    const { rerender } = render(<Dashboard refreshTrigger={0} />);

    await waitFor(() => {
      expect(mockApi.getActivities).toHaveBeenCalledTimes(1);
    });

    rerender(<Dashboard refreshTrigger={1} />);

    await waitFor(() => {
      expect(mockApi.getActivities).toHaveBeenCalledTimes(2);
    });
  });
});
