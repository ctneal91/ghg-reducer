import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityForm } from './ActivityForm';
import { api } from '../api/client';

jest.mock('../api/client', () => ({
  api: {
    createActivity: jest.fn(),
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

describe('ActivityForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders form with all fields', () => {
    render(<ActivityForm />);

    expect(screen.getByText('Log New Activity')).toBeInTheDocument();
    // MUI Select uses combobox role
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    // MUI labels appear multiple times (in label and legend), use getAllByText
    expect(screen.getAllByText('Description (optional)').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Quantity/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Date').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Log Activity' })).toBeInTheDocument();
  });

  test('submit button is disabled when quantity is 0', () => {
    render(<ActivityForm />);

    const submitButton = screen.getByRole('button', { name: 'Log Activity' });
    expect(submitButton).toBeDisabled();
  });

  test('submit button is enabled when quantity is entered', async () => {
    render(<ActivityForm />);

    // Number input has spinbutton role
    const quantityInput = screen.getByRole('spinbutton');
    await userEvent.clear(quantityInput);
    await userEvent.type(quantityInput, '100');

    const submitButton = screen.getByRole('button', { name: 'Log Activity' });
    expect(submitButton).toBeEnabled();
  });

  test('submits form and shows success message', async () => {
    mockApi.createActivity.mockResolvedValue({
      id: 1,
      activity_type: 'driving',
      description: 'Test drive',
      quantity: 100,
      unit: 'km',
      emission_kg: 21,
      occurred_at: '2024-01-15',
      created_at: '2024-01-15',
      updated_at: '2024-01-15',
    });

    const onSuccess = jest.fn();
    render(<ActivityForm onSuccess={onSuccess} />);

    const quantityInput = screen.getByRole('spinbutton');
    await userEvent.clear(quantityInput);
    await userEvent.type(quantityInput, '100');

    const submitButton = screen.getByRole('button', { name: 'Log Activity' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Activity logged successfully!')).toBeInTheDocument();
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(mockApi.createActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        activity_type: 'driving',
        quantity: 100,
      })
    );
  });

  test('shows error message on submission failure', async () => {
    mockApi.createActivity.mockRejectedValue(new Error('Failed to create activity'));

    render(<ActivityForm />);

    const quantityInput = screen.getByRole('spinbutton');
    await userEvent.clear(quantityInput);
    await userEvent.type(quantityInput, '100');

    const submitButton = screen.getByRole('button', { name: 'Log Activity' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to create activity')).toBeInTheDocument();
    });
  });

  test('shows loading state during submission', async () => {
    mockApi.createActivity.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<ActivityForm />);

    const quantityInput = screen.getByRole('spinbutton');
    await userEvent.clear(quantityInput);
    await userEvent.type(quantityInput, '100');

    const submitButton = screen.getByRole('button', { name: 'Log Activity' });
    fireEvent.click(submitButton);

    expect(screen.getByRole('button', { name: 'Saving...' })).toBeInTheDocument();
  });

  test('resets form after successful submission', async () => {
    mockApi.createActivity.mockResolvedValue({
      id: 1,
      activity_type: 'driving',
      description: '',
      quantity: 100,
      unit: 'km',
      emission_kg: 21,
      occurred_at: '2024-01-15',
      created_at: '2024-01-15',
      updated_at: '2024-01-15',
    });

    render(<ActivityForm />);

    const quantityInput = screen.getByRole('spinbutton') as HTMLInputElement;
    await userEvent.clear(quantityInput);
    await userEvent.type(quantityInput, '100');

    const submitButton = screen.getByRole('button', { name: 'Log Activity' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Activity logged successfully!')).toBeInTheDocument();
    });

    expect(quantityInput.value).toBe('');
  });
});
