import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';
import { AuthProvider } from '../contexts/AuthContext';
import { api } from '../api/client';

jest.mock('../api/client', () => ({
  api: {
    getMe: jest.fn().mockRejectedValue(new Error('Unauthorized')),
    login: jest.fn(),
    getActivities: jest.fn().mockResolvedValue({
      activities: [],
      summary: { activity_count: 0, total_emissions_kg: 0 },
    }),
  },
  setToken: jest.fn(),
  clearSession: jest.fn(),
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('LoginForm', () => {
  const onSuccess = jest.fn();
  const onSwitchToSignup = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form', async () => {
    render(
      <AuthProvider>
        <LoginForm onSuccess={onSuccess} onSwitchToSignup={onSwitchToSignup} />
      </AuthProvider>
    );

    await waitFor(() => {
      // "Log In" appears as heading and button
      expect(screen.getAllByText('Log In').length).toBeGreaterThan(0);
    });
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
  });

  test('shows link to signup', async () => {
    render(
      <AuthProvider>
        <LoginForm onSuccess={onSuccess} onSwitchToSignup={onSwitchToSignup} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument();
  });

  test('calls onSwitchToSignup when sign up link is clicked', async () => {
    render(
      <AuthProvider>
        <LoginForm onSuccess={onSuccess} onSwitchToSignup={onSwitchToSignup} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));
    expect(onSwitchToSignup).toHaveBeenCalled();
  });

  test('submits form with email and password', async () => {
    mockApi.login.mockResolvedValue({
      user: { id: 1, email: 'test@example.com', name: 'Test User' },
      token: 'test-token',
    });

    render(
      <AuthProvider>
        <LoginForm onSuccess={onSuccess} onSwitchToSignup={onSwitchToSignup} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
    });

    // Get all textboxes and password input
    const emailInput = screen.getByRole('textbox');
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');

    fireEvent.click(screen.getByRole('button', { name: 'Log In' }));

    await waitFor(() => {
      expect(mockApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  test('shows error message on login failure', async () => {
    mockApi.login.mockRejectedValue(new Error('Invalid email or password'));

    render(
      <AuthProvider>
        <LoginForm onSuccess={onSuccess} onSwitchToSignup={onSwitchToSignup} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
    });

    const emailInput = screen.getByRole('textbox');
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'wrongpassword');

    fireEvent.click(screen.getByRole('button', { name: 'Log In' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });
});
