import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignupForm } from './SignupForm';
import { AuthProvider } from '../contexts/AuthContext';
import { api } from '../api/client';

jest.mock('../api/client', () => ({
  api: {
    getMe: jest.fn().mockRejectedValue(new Error('Unauthorized')),
    signup: jest.fn(),
    getActivities: jest.fn().mockResolvedValue({
      activities: [],
      summary: { activity_count: 0, total_emissions_kg: 0 },
    }),
  },
  setToken: jest.fn(),
  clearSession: jest.fn(),
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('SignupForm', () => {
  const onSuccess = jest.fn();
  const onSwitchToLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders signup form', async () => {
    render(
      <AuthProvider>
        <SignupForm onSuccess={onSuccess} onSwitchToLogin={onSwitchToLogin} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
  });

  test('shows password helper text', async () => {
    render(
      <AuthProvider>
        <SignupForm onSuccess={onSuccess} onSwitchToLogin={onSwitchToLogin} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Minimum 6 characters')).toBeInTheDocument();
    });
  });

  test('shows link to login', async () => {
    render(
      <AuthProvider>
        <SignupForm onSuccess={onSuccess} onSwitchToLogin={onSwitchToLogin} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Already have an account?')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  });

  test('calls onSwitchToLogin when log in link is clicked', async () => {
    render(
      <AuthProvider>
        <SignupForm onSuccess={onSuccess} onSwitchToLogin={onSwitchToLogin} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(onSwitchToLogin).toHaveBeenCalled();
  });

  test('submits form with all fields', async () => {
    mockApi.signup.mockResolvedValue({
      user: { id: 1, email: 'test@example.com', name: 'Test User' },
      token: 'test-token',
    });

    render(
      <AuthProvider>
        <SignupForm onSuccess={onSuccess} onSwitchToLogin={onSwitchToLogin} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
    });

    // Get inputs by role - signup has name (textbox), email (textbox), password
    const textboxes = screen.getAllByRole('textbox');
    const nameInput = textboxes[0];
    const emailInput = textboxes[1];
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

    await userEvent.type(nameInput, 'Test User');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');

    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(mockApi.signup).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  test('shows error message on signup failure', async () => {
    mockApi.signup.mockRejectedValue(new Error('Email has already been taken'));

    render(
      <AuthProvider>
        <SignupForm onSuccess={onSuccess} onSwitchToLogin={onSwitchToLogin} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
    });

    const textboxes = screen.getAllByRole('textbox');
    const nameInput = textboxes[0];
    const emailInput = textboxes[1];
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

    await userEvent.type(nameInput, 'Test User');
    await userEvent.type(emailInput, 'existing@example.com');
    await userEvent.type(passwordInput, 'password123');

    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(screen.getByText('Email has already been taken')).toBeInTheDocument();
    });
  });
});
