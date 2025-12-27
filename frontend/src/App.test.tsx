import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { api } from './api/client';

// Mock the API client
jest.mock('./api/client', () => ({
  api: {
    getMe: jest.fn(),
    getActivities: jest.fn(),
    createActivity: jest.fn(),
    claimActivities: jest.fn(),
    getSessionId: jest.fn().mockReturnValue('test-session'),
    login: jest.fn(),
    signup: jest.fn(),
  },
  setToken: jest.fn(),
  clearSession: jest.fn(),
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.getMe.mockRejectedValue(new Error('Unauthorized'));
    mockApi.getActivities.mockResolvedValue({
      activities: [],
      summary: { activity_count: 0, total_emissions_kg: 0 },
    });
  });

  test('renders the app with loading state initially', () => {
    render(<App />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders the layout after loading', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getAllByText('GHG Reducer').length).toBeGreaterThan(0);
    });
  });

  test('shows navigation items', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('Activities').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Log Activity').length).toBeGreaterThan(0);
  });

  test('shows login and signup buttons', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
  });

  test('navigates to activities view', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    });

    const activitiesLinks = screen.getAllByText('Activities');
    await act(async () => {
      await userEvent.click(activitiesLinks[0]);
    });

    await waitFor(() => {
      expect(screen.getByText(/No activities logged yet/)).toBeInTheDocument();
    });
  });

  test('navigates to add activity view', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    });

    const addLinks = screen.getAllByText('Log Activity');
    await act(async () => {
      await userEvent.click(addLinks[0]);
    });

    await waitFor(() => {
      expect(screen.getByText('Log New Activity')).toBeInTheDocument();
    });
  });

  test('navigates to login view', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
    });

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Log In' }));
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Log In' })).toBeInTheDocument();
    });
  });

  test('navigates to signup view', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
    });

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    });
  });

  test('handleActivityCreated navigates to activities after creating activity', async () => {
    mockApi.createActivity.mockResolvedValue({
      id: 1,
      activity_type: 'driving',
      description: 'Test',
      quantity: 100,
      unit: 'km',
      emission_kg: 21,
      emission_source: 'local',
      occurred_at: '2024-01-15',
      created_at: '2024-01-15',
      updated_at: '2024-01-15',
    });

    render(<App />);
    await waitFor(() => {
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    });

    // Navigate to add activity
    const addLinks = screen.getAllByText('Log Activity');
    await act(async () => {
      await userEvent.click(addLinks[0]);
    });

    await waitFor(() => {
      expect(screen.getByText('Log New Activity')).toBeInTheDocument();
    });

    // Fill in and submit form
    const quantityInput = screen.getByRole('spinbutton');
    await userEvent.clear(quantityInput);
    await userEvent.type(quantityInput, '100');

    // Find submit button within the form (not nav)
    const form = screen.getByText('Log New Activity').closest('form') || document.querySelector('form');
    const submitButton = form?.querySelector('button[type="submit"]') as HTMLButtonElement;

    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Should navigate to activities view after success
    await waitFor(() => {
      expect(screen.getByText(/No activities logged yet/)).toBeInTheDocument();
    });
  });

  test('login without guest activities navigates directly to dashboard', async () => {
    mockApi.getActivities.mockResolvedValue({
      activities: [],
      summary: { activity_count: 0, total_emissions_kg: 0 },
    });
    mockApi.login.mockResolvedValue({
      user: { id: 1, email: 'test@example.com', name: 'Test' },
      token: 'test-token',
    });

    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
    });

    // Go to login
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Log In' }));
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Log In' })).toBeInTheDocument();
    });

    // Fill in login form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');

    // Find submit button in login form
    const loginForm = screen.getByRole('heading', { name: 'Log In' }).closest('form') ||
                      document.querySelector('form');
    const submitButton = loginForm?.querySelector('button[type="submit"]') as HTMLButtonElement;

    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Should NOT show claim dialog
    await waitFor(() => {
      expect(screen.queryByText('Transfer Your Activities?')).not.toBeInTheDocument();
    });
  });

});
