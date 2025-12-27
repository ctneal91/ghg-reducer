import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { UserMenu } from './UserMenu';
import { useAuth } from '../contexts/AuthContext';

// Mock the useAuth hook
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock window.location.reload
const mockReload = jest.fn();
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true,
});

describe('UserMenu', () => {
  const onLoginClick = jest.fn();
  const onSignupClick = jest.fn();
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when not authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        login: jest.fn(),
        signup: jest.fn(),
        logout: mockLogout,
        claimGuestActivities: jest.fn(),
      });
    });

    test('shows login and signup buttons', () => {
      render(<UserMenu onLoginClick={onLoginClick} onSignupClick={onSignupClick} />);

      expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
    });

    test('calls onLoginClick when login button is clicked', () => {
      render(<UserMenu onLoginClick={onLoginClick} onSignupClick={onSignupClick} />);

      fireEvent.click(screen.getByRole('button', { name: 'Log In' }));
      expect(onLoginClick).toHaveBeenCalled();
    });

    test('calls onSignupClick when signup button is clicked', () => {
      render(<UserMenu onLoginClick={onLoginClick} onSignupClick={onSignupClick} />);

      fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
      expect(onSignupClick).toHaveBeenCalled();
    });
  });

  describe('when authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, email: 'test@example.com', name: 'Test User' },
        loading: false,
        login: jest.fn(),
        signup: jest.fn(),
        logout: mockLogout,
        claimGuestActivities: jest.fn(),
      });
    });

    test('shows avatar button with user initial', () => {
      render(<UserMenu onLoginClick={onLoginClick} onSignupClick={onSignupClick} />);

      // Should show avatar with first letter of name
      expect(screen.getByText('T')).toBeInTheDocument();
      // Should not show login/signup buttons
      expect(screen.queryByRole('button', { name: 'Log In' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Sign Up' })).not.toBeInTheDocument();
    });

    test('opens menu when avatar is clicked', async () => {
      render(<UserMenu onLoginClick={onLoginClick} onSignupClick={onSignupClick} />);

      // Click avatar button
      const avatarButton = screen.getByRole('button');
      fireEvent.click(avatarButton);

      // Menu should show user info
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Log Out' })).toBeInTheDocument();
    });

    test('closes menu when clicking away', async () => {
      render(<UserMenu onLoginClick={onLoginClick} onSignupClick={onSignupClick} />);

      // Click avatar button
      const avatarButton = screen.getByRole('button');
      fireEvent.click(avatarButton);

      // Wait for menu to open
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      // Click backdrop to close menu
      const backdrop = document.querySelector('.MuiBackdrop-root');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      // Menu should close
      await waitFor(() => {
        expect(screen.queryByRole('menuitem', { name: 'Log Out' })).not.toBeInTheDocument();
      });
    });

    test('calls logout and reloads page when Log Out is clicked', async () => {
      mockLogout.mockResolvedValue(undefined);

      render(<UserMenu onLoginClick={onLoginClick} onSignupClick={onSignupClick} />);

      // Click avatar button
      const avatarButton = screen.getByRole('button');
      fireEvent.click(avatarButton);

      // Wait for menu to open
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Log Out' })).toBeInTheDocument();
      });

      // Click logout
      await act(async () => {
        fireEvent.click(screen.getByRole('menuitem', { name: 'Log Out' }));
      });

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockReload).toHaveBeenCalled();
      });
    });
  });
});
