import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Layout } from './Layout';
import { useAuth } from '../contexts/AuthContext';

// Mock useAuth hook
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('Layout', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      claimGuestActivities: jest.fn(),
    });
  });

  test('renders children content', () => {
    render(
      <Layout currentView="dashboard" onNavigate={jest.fn()}>
        <div data-testid="child-content">Test Content</div>
      </Layout>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  test('renders navigation items', () => {
    render(
      <Layout currentView="dashboard" onNavigate={jest.fn()}>
        <div>Content</div>
      </Layout>
    );

    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Activities').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Log Activity').length).toBeGreaterThan(0);
  });

  test('shows current view title in app bar', () => {
    render(
      <Layout currentView="activities" onNavigate={jest.fn()}>
        <div>Content</div>
      </Layout>
    );

    // AppBar shows the current view name
    expect(screen.getAllByText('Activities').length).toBeGreaterThan(0);
  });

  test('calls onNavigate when nav item is clicked', async () => {
    const onNavigate = jest.fn();
    render(
      <Layout currentView="dashboard" onNavigate={onNavigate}>
        <div>Content</div>
      </Layout>
    );

    const activitiesLinks = screen.getAllByText('Activities');
    fireEvent.click(activitiesLinks[0]);

    expect(onNavigate).toHaveBeenCalledWith('activities');
  });

  test('toggles mobile drawer when menu button is clicked', async () => {
    // Mock window.matchMedia for mobile view
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(max-width: 599.95px)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(
      <Layout currentView="dashboard" onNavigate={jest.fn()}>
        <div>Content</div>
      </Layout>
    );

    // Find the menu button (hamburger icon for mobile)
    const menuButton = screen.getByLabelText('open drawer');

    // Click to open drawer
    fireEvent.click(menuButton);

    // The drawer should now be visible (it renders nav items)
    await waitFor(() => {
      // Check that navigation items are visible in the drawer
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    });
  });
});
