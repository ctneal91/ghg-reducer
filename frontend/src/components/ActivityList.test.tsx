import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityList } from './ActivityList';
import { api } from '../api/client';

jest.mock('../api/client');

const mockActivities = [
  {
    id: 1,
    activity_type: 'driving',
    description: 'Commute to work',
    quantity: 25,
    unit: 'km',
    emission_kg: 5.25,
    occurred_at: '2024-01-15T00:00:00Z',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    activity_type: 'electricity',
    description: null,
    quantity: 100,
    unit: 'kWh',
    emission_kg: 42.0,
    occurred_at: '2024-01-14T00:00:00Z',
    created_at: '2024-01-14T10:00:00Z',
    updated_at: '2024-01-14T10:00:00Z',
  },
];

describe('ActivityList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading spinner initially', () => {
    (api.getActivities as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<ActivityList />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays activities in a table', async () => {
    (api.getActivities as jest.Mock).mockResolvedValue({
      activities: mockActivities,
      summary: { total_emissions_kg: 47.25, activity_count: 2 },
    });

    render(<ActivityList />);

    await waitFor(() => {
      expect(screen.getByText('Commute to work')).toBeInTheDocument();
    });

    expect(screen.getByText('Driving')).toBeInTheDocument();
    expect(screen.getByText('Electricity')).toBeInTheDocument();
    expect(screen.getByText('5.25')).toBeInTheDocument();
    expect(screen.getByText('42.00')).toBeInTheDocument();
  });

  it('shows empty state when no activities', async () => {
    (api.getActivities as jest.Mock).mockResolvedValue({
      activities: [],
      summary: { total_emissions_kg: 0, activity_count: 0 },
    });

    render(<ActivityList />);

    await waitFor(() => {
      expect(screen.getByText(/No activities logged yet/)).toBeInTheDocument();
    });
  });

  it('shows error message on fetch failure', async () => {
    (api.getActivities as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<ActivityList />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('shows dash for null description', async () => {
    (api.getActivities as jest.Mock).mockResolvedValue({
      activities: mockActivities,
      summary: { total_emissions_kg: 47.25, activity_count: 2 },
    });

    render(<ActivityList />);

    await waitFor(() => {
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  it('deletes activity when delete button is clicked', async () => {
    const onActivityDeleted = jest.fn();
    (api.getActivities as jest.Mock).mockResolvedValue({
      activities: mockActivities,
      summary: { total_emissions_kg: 47.25, activity_count: 2 },
    });
    (api.deleteActivity as jest.Mock).mockResolvedValue({});

    render(<ActivityList onActivityDeleted={onActivityDeleted} />);

    await waitFor(() => {
      expect(screen.getByText('Commute to work')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(api.deleteActivity).toHaveBeenCalledWith(1);
    });
    expect(onActivityDeleted).toHaveBeenCalled();
  });

  it('shows error when delete fails', async () => {
    (api.getActivities as jest.Mock).mockResolvedValue({
      activities: mockActivities,
      summary: { total_emissions_kg: 47.25, activity_count: 2 },
    });
    (api.deleteActivity as jest.Mock).mockRejectedValue(new Error('Delete failed'));

    render(<ActivityList />);

    await waitFor(() => {
      expect(screen.getByText('Commute to work')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Delete failed')).toBeInTheDocument();
    });
  });

  it('refetches when refreshTrigger changes', async () => {
    (api.getActivities as jest.Mock).mockResolvedValue({
      activities: mockActivities,
      summary: { total_emissions_kg: 47.25, activity_count: 2 },
    });

    const { rerender } = render(<ActivityList refreshTrigger={1} />);

    await waitFor(() => {
      expect(api.getActivities).toHaveBeenCalledTimes(1);
    });

    rerender(<ActivityList refreshTrigger={2} />);

    await waitFor(() => {
      expect(api.getActivities).toHaveBeenCalledTimes(2);
    });
  });

});
