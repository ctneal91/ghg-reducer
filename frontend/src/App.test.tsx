import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

// Mock the API client
jest.mock('./api/client', () => ({
  api: {
    getMe: jest.fn().mockRejectedValue(new Error('Unauthorized')),
    getActivities: jest.fn().mockResolvedValue({
      activities: [],
      summary: { activity_count: 0, total_emissions_kg: 0 },
    }),
  },
  setToken: jest.fn(),
  clearSession: jest.fn(),
}));

describe('App', () => {
  test('renders the app with loading state initially', () => {
    render(<App />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders the layout after loading', async () => {
    render(<App />);
    await waitFor(() => {
      // GHG Reducer appears in both mobile and desktop drawers
      expect(screen.getAllByText('GHG Reducer').length).toBeGreaterThan(0);
    });
  });

  test('shows navigation items', async () => {
    render(<App />);
    await waitFor(() => {
      // Dashboard appears in both nav and header, so check for at least one
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    });
    // Activities and Log Activity are in the nav drawer (may appear multiple times in mobile/desktop drawers)
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
});
