import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { api, setToken, clearSession } from '../api/client';

// Mock the API client
jest.mock('../api/client', () => ({
  api: {
    getMe: jest.fn(),
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    getActivities: jest.fn(),
    claimActivities: jest.fn(),
  },
  setToken: jest.fn(),
  clearSession: jest.fn(),
}));

const mockApi = api as jest.Mocked<typeof api>;
const mockSetToken = setToken as jest.MockedFunction<typeof setToken>;
const mockClearSession = clearSession as jest.MockedFunction<typeof clearSession>;

// Test component that uses the auth context
function TestComponent() {
  const { user, loading, login, signup, logout, claimGuestActivities } = useAuth();

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={() => signup('test@example.com', 'password', 'Test User')}>Signup</button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={() => claimGuestActivities()}>Claim</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useAuth outside provider', () => {
    test('throws error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('AuthProvider', () => {
    test('checks auth on mount and shows loading', async () => {
      mockApi.getMe.mockResolvedValue({ user: { id: 1, email: 'test@example.com', name: 'Test' } });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initially loading
      expect(screen.getByTestId('loading')).toHaveTextContent('loading');

      // After auth check completes
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });

    test('clears token on auth check failure', async () => {
      mockApi.getMe.mockRejectedValue(new Error('Unauthorized'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      expect(mockSetToken).toHaveBeenCalledWith(null);
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });

    test('login sets user and token', async () => {
      mockApi.getMe.mockRejectedValue(new Error('Unauthorized'));
      mockApi.getActivities.mockResolvedValue({
        activities: [],
        summary: { activity_count: 0, total_emissions_kg: 0 },
      });
      mockApi.login.mockResolvedValue({
        user: { id: 1, email: 'test@example.com', name: 'Test' },
        token: 'test-token',
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      await act(async () => {
        screen.getByRole('button', { name: 'Login' }).click();
      });

      await waitFor(() => {
        expect(mockApi.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password',
        });
      });

      expect(mockSetToken).toHaveBeenCalledWith('test-token');
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });

    test('login checks for guest activities first', async () => {
      mockApi.getMe.mockRejectedValue(new Error('Unauthorized'));
      mockApi.getActivities.mockResolvedValue({
        activities: [{ id: 1, activity_type: 'car_travel' }],
        summary: { activity_count: 1, total_emissions_kg: 10 },
      });
      mockApi.login.mockResolvedValue({
        user: { id: 1, email: 'test@example.com', name: 'Test' },
        token: 'test-token',
      });

      let loginResult: { hasGuestActivities: boolean } | undefined;

      function TestComponentWithResult() {
        const { user, loading, login } = useAuth();

        const handleLogin = async () => {
          loginResult = await login('test@example.com', 'password');
        };

        return (
          <div>
            <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
            <div data-testid="user">{user ? user.email : 'no-user'}</div>
            <button onClick={handleLogin}>Login</button>
          </div>
        );
      }

      render(
        <AuthProvider>
          <TestComponentWithResult />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      await act(async () => {
        screen.getByRole('button', { name: 'Login' }).click();
      });

      await waitFor(() => {
        expect(loginResult).toBeDefined();
      });

      expect(loginResult!.hasGuestActivities).toBe(true);
    });

    test('signup sets user and token', async () => {
      mockApi.getMe.mockRejectedValue(new Error('Unauthorized'));
      mockApi.getActivities.mockResolvedValue({
        activities: [],
        summary: { activity_count: 0, total_emissions_kg: 0 },
      });
      mockApi.signup.mockResolvedValue({
        user: { id: 1, email: 'test@example.com', name: 'Test User' },
        token: 'test-token',
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      await act(async () => {
        screen.getByRole('button', { name: 'Signup' }).click();
      });

      await waitFor(() => {
        expect(mockApi.signup).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password',
          name: 'Test User',
        });
      });

      expect(mockSetToken).toHaveBeenCalledWith('test-token');
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });

    test('logout clears user and session', async () => {
      mockApi.getMe.mockResolvedValue({
        user: { id: 1, email: 'test@example.com', name: 'Test' },
      });
      mockApi.logout.mockResolvedValue(undefined);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });

      await act(async () => {
        screen.getByRole('button', { name: 'Logout' }).click();
      });

      await waitFor(() => {
        expect(mockApi.logout).toHaveBeenCalled();
      });

      expect(mockSetToken).toHaveBeenCalledWith(null);
      expect(mockClearSession).toHaveBeenCalled();
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });

    test('claimGuestActivities claims and clears session', async () => {
      mockApi.getMe.mockResolvedValue({
        user: { id: 1, email: 'test@example.com', name: 'Test' },
      });
      mockApi.claimActivities.mockResolvedValue({ claimed_count: 5 });

      let claimResult: number | undefined;

      function TestComponentWithClaim() {
        const { loading, claimGuestActivities } = useAuth();

        const handleClaim = async () => {
          claimResult = await claimGuestActivities();
        };

        return (
          <div>
            <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
            <button onClick={handleClaim}>Claim</button>
          </div>
        );
      }

      render(
        <AuthProvider>
          <TestComponentWithClaim />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      await act(async () => {
        screen.getByRole('button', { name: 'Claim' }).click();
      });

      await waitFor(() => {
        expect(mockApi.claimActivities).toHaveBeenCalled();
      });

      expect(mockClearSession).toHaveBeenCalled();
      expect(claimResult).toBe(5);
    });

    test('hasGuestActivities returns false when getActivities fails', async () => {
      mockApi.getMe.mockRejectedValue(new Error('Unauthorized'));
      mockApi.getActivities.mockRejectedValue(new Error('Network error'));
      mockApi.login.mockResolvedValue({
        user: { id: 1, email: 'test@example.com', name: 'Test' },
        token: 'test-token',
      });

      let loginResult: { hasGuestActivities: boolean } | undefined;

      function TestComponentWithResult() {
        const { loading, login } = useAuth();

        const handleLogin = async () => {
          loginResult = await login('test@example.com', 'password');
        };

        return (
          <div>
            <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
            <button onClick={handleLogin}>Login</button>
          </div>
        );
      }

      render(
        <AuthProvider>
          <TestComponentWithResult />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      await act(async () => {
        screen.getByRole('button', { name: 'Login' }).click();
      });

      await waitFor(() => {
        expect(loginResult).toBeDefined();
      });

      expect(loginResult!.hasGuestActivities).toBe(false);
    });
  });
});
