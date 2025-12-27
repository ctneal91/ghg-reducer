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

  test('changes activity type', async () => {
    render(<ActivityForm />);

    // Open the select dropdown
    const selectButton = screen.getByRole('combobox');
    await userEvent.click(selectButton);

    // Select a different activity type
    const flightOption = await screen.findByRole('option', { name: 'Flight' });
    await userEvent.click(flightOption);

    // Verify the selection changed (the label in the combobox should update)
    expect(selectButton).toHaveTextContent('Flight');
  });

  test('updates description field', async () => {
    render(<ActivityForm />);

    const descriptionInput = screen.getByLabelText('Description (optional)');
    await userEvent.type(descriptionInput, 'My commute to work');

    expect(descriptionInput).toHaveValue('My commute to work');
  });

  test('updates date field', async () => {
    render(<ActivityForm />);

    // Find the date input by its type attribute
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2024-06-15' } });

    expect(dateInput).toHaveValue('2024-06-15');
  });

  test('handles non-Error exception in submission', async () => {
    mockApi.createActivity.mockRejectedValue('String error');

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
});
