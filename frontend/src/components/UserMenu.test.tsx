import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserMenu } from './UserMenu';
import { AuthProvider } from '../contexts/AuthContext';

// Mock the API client
jest.mock('../api/client', () => ({
  api: {
    getMe: jest.fn().mockRejectedValue(new Error('Unauthorized')),
    logout: jest.fn().mockResolvedValue(undefined),
    getActivities: jest.fn().mockResolvedValue({
      activities: [],
      summary: { activity_count: 0, total_emissions_kg: 0 },
    }),
  },
  setToken: jest.fn(),
  clearSession: jest.fn(),
}));

// Mock window.location.reload
const mockReload = jest.fn();
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true,
});

describe('UserMenu', () => {
  const onLoginClick = jest.fn();
  const onSignupClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows login and signup buttons when not authenticated', async () => {
    render(
      <AuthProvider>
        <UserMenu onLoginClick={onLoginClick} onSignupClick={onSignupClick} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
  });

  test('calls onLoginClick when login button is clicked', async () => {
    render(
      <AuthProvider>
        <UserMenu onLoginClick={onLoginClick} onSignupClick={onSignupClick} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Log In' }));
    expect(onLoginClick).toHaveBeenCalled();
  });

  test('calls onSignupClick when signup button is clicked', async () => {
    render(
      <AuthProvider>
        <UserMenu onLoginClick={onLoginClick} onSignupClick={onSignupClick} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
    expect(onSignupClick).toHaveBeenCalled();
  });
});
