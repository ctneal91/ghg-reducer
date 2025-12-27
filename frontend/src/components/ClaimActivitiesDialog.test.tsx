import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClaimActivitiesDialog } from './ClaimActivitiesDialog';
import { useAuth } from '../contexts/AuthContext';

// Mock useAuth hook
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('ClaimActivitiesDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnClaimed = jest.fn();
  const mockClaimGuestActivities = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      claimGuestActivities: mockClaimGuestActivities,
    });
  });

  test('renders dialog when open', () => {
    render(
      <ClaimActivitiesDialog
        open={true}
        onClose={mockOnClose}
        onClaimed={mockOnClaimed}
      />
    );

    expect(screen.getByText('Transfer Your Activities?')).toBeInTheDocument();
    expect(screen.getByText(/You have activities from your guest session/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Transfer Activities' })).toBeInTheDocument();
  });

  test('does not render dialog when closed', () => {
    render(
      <ClaimActivitiesDialog
        open={false}
        onClose={mockOnClose}
        onClaimed={mockOnClaimed}
      />
    );

    expect(screen.queryByText('Transfer Your Activities?')).not.toBeInTheDocument();
  });

  test('calls onClose when Skip button is clicked', () => {
    render(
      <ClaimActivitiesDialog
        open={true}
        onClose={mockOnClose}
        onClaimed={mockOnClaimed}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('calls claimGuestActivities and onClaimed when Transfer Activities is clicked', async () => {
    mockClaimGuestActivities.mockResolvedValue(5);

    render(
      <ClaimActivitiesDialog
        open={true}
        onClose={mockOnClose}
        onClaimed={mockOnClaimed}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Transfer Activities' }));

    await waitFor(() => {
      expect(mockClaimGuestActivities).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockOnClaimed).toHaveBeenCalled();
    });
  });

  test('calls onClose when claim fails', async () => {
    mockClaimGuestActivities.mockRejectedValue(new Error('Claim failed'));

    render(
      <ClaimActivitiesDialog
        open={true}
        onClose={mockOnClose}
        onClaimed={mockOnClaimed}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Transfer Activities' }));

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });

    expect(mockOnClaimed).not.toHaveBeenCalled();
  });

  test('shows loading state while claiming', async () => {
    // Make claim take a while
    mockClaimGuestActivities.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(5), 100))
    );

    render(
      <ClaimActivitiesDialog
        open={true}
        onClose={mockOnClose}
        onClaimed={mockOnClaimed}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Transfer Activities' }));

    // Loading indicator should appear
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    // Buttons should be disabled
    expect(screen.getByRole('button', { name: 'Skip' })).toBeDisabled();

    // Wait for claim to complete
    await waitFor(() => {
      expect(mockOnClaimed).toHaveBeenCalled();
    });
  });
});
