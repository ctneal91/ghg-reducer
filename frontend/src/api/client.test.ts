import { api, setToken, clearSession } from './client';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock crypto.randomUUID
const mockUUID = 'test-uuid-1234';
Object.defineProperty(global, 'crypto', {
  value: { randomUUID: () => mockUUID },
});

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    localStorage.clear();
  });

  describe('setToken', () => {
    it('stores token in localStorage', () => {
      setToken('test-token');
      expect(localStorage.getItem('ghg_token')).toBe('test-token');
    });

    it('removes token when null is passed', () => {
      localStorage.setItem('ghg_token', 'existing-token');
      setToken(null);
      expect(localStorage.getItem('ghg_token')).toBeNull();
    });
  });

  describe('clearSession', () => {
    it('removes session ID from localStorage', () => {
      localStorage.setItem('ghg_session_id', 'test-session');
      clearSession();
      expect(localStorage.getItem('ghg_session_id')).toBeNull();
    });
  });

  describe('getSessionId', () => {
    it('returns existing session ID', () => {
      localStorage.setItem('ghg_session_id', 'existing-session');
      expect(api.getSessionId()).toBe('existing-session');
    });

    it('creates new session ID if none exists', () => {
      expect(api.getSessionId()).toBe(mockUUID);
      expect(localStorage.getItem('ghg_session_id')).toBe(mockUUID);
    });
  });

  describe('api.signup', () => {
    it('sends POST request with signup data', async () => {
      const mockResponse = { user: { id: 1, email: 'test@example.com' }, token: 'jwt-token' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.signup({ email: 'test@example.com', password: 'password123', name: 'Test User' });

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123', name: 'Test User' }),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('api.login', () => {
    it('sends POST request with login data', async () => {
      const mockResponse = { user: { id: 1, email: 'test@example.com' }, token: 'jwt-token' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.login({ email: 'test@example.com', password: 'password123' });

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('api.logout', () => {
    it('sends DELETE request when token exists', async () => {
      localStorage.setItem('ghg_token', 'test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await api.logout();

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/logout', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
      });
    });

    it('does not send request when no token exists', async () => {
      await api.logout();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('api.getMe', () => {
    it('sends GET request with auth headers', async () => {
      localStorage.setItem('ghg_token', 'test-token');
      const mockResponse = { user: { id: 1, email: 'test@example.com' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.getMe();

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('uses session ID when no token exists', async () => {
      localStorage.setItem('ghg_session_id', 'test-session');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: null }),
      });

      await api.getMe();

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': 'test-session',
        },
      });
    });
  });

  describe('api.getActivities', () => {
    it('fetches activities list', async () => {
      localStorage.setItem('ghg_token', 'test-token');
      const mockResponse = {
        activities: [{ id: 1, activity_type: 'driving', quantity: 10 }],
        summary: { total_emissions_kg: 2.1, activity_count: 1 },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.getActivities();

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/activities', expect.any(Object));
      expect(result).toEqual(mockResponse);
    });
  });

  describe('api.createActivity', () => {
    it('sends POST request with activity data', async () => {
      localStorage.setItem('ghg_token', 'test-token');
      const activityData = {
        activity_type: 'driving' as const,
        description: 'Commute',
        quantity: 25,
        occurred_at: '2024-01-15',
      };
      const mockResponse = { id: 1, ...activityData, emission_kg: 5.25 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.createActivity(activityData);

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/activities', {
        method: 'POST',
        headers: expect.any(Object),
        body: JSON.stringify({ activity: activityData }),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('api.deleteActivity', () => {
    it('sends DELETE request', async () => {
      localStorage.setItem('ghg_token', 'test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await api.deleteActivity(123);

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/activities/123', {
        method: 'DELETE',
        headers: expect.any(Object),
      });
    });
  });

  describe('api.claimActivities', () => {
    it('sends POST request with session ID', async () => {
      localStorage.setItem('ghg_token', 'test-token');
      localStorage.setItem('ghg_session_id', 'guest-session-123');
      const mockResponse = { claimed_count: 5 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.claimActivities();

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/claim', {
        method: 'POST',
        headers: expect.any(Object),
        body: JSON.stringify({ session_id: 'guest-session-123' }),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('api.getActivity', () => {
    it('fetches a single activity by ID', async () => {
      localStorage.setItem('ghg_token', 'test-token');
      const mockResponse = { id: 42, activity_type: 'driving', quantity: 100 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.getActivity(42);

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/activities/42', {
        method: 'GET',
        headers: expect.any(Object),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('api.updateActivity', () => {
    it('sends PATCH request with activity data', async () => {
      localStorage.setItem('ghg_token', 'test-token');
      const updateData = { quantity: 200 };
      const mockResponse = { id: 42, activity_type: 'driving', quantity: 200 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.updateActivity(42, updateData);

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/activities/42', {
        method: 'PATCH',
        headers: expect.any(Object),
        body: JSON.stringify({ activity: updateData }),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('api.getEmissionFactors', () => {
    it('fetches emission factors without auth', async () => {
      const mockResponse = {
        driving: { label: 'Driving', unit: 'km', emission_factor: 0.21 },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.getEmissionFactors();

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/emission_factors', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('error handling', () => {
    it('throws error with message from API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      });

      await expect(api.login({ email: 'test@example.com', password: 'wrong' }))
        .rejects.toThrow('Invalid credentials');
    });

    it('throws error with joined errors array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ errors: ['Email is invalid', 'Password is too short'] }),
      });

      await expect(api.signup({ email: 'bad', password: '123', name: 'Test' }))
        .rejects.toThrow('Email is invalid, Password is too short');
    });

    it('throws default error when response cannot be parsed', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.reject(new Error('Parse error')),
      });

      await expect(api.login({ email: 'test@example.com', password: 'test' }))
        .rejects.toThrow('Request failed');
    });
  });
});
