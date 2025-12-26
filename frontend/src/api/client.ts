import { Activity, ActivityFormData, ActivitiesResponse, EmissionFactor } from '../types/activity';
import { AuthResponse, SignupData, LoginData, User } from '../types/auth';

const API_BASE = '/api/v1';

const SESSION_ID_KEY = 'ghg_session_id';
const TOKEN_KEY = 'ghg_token';

function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_ID_KEY);
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    headers['X-Session-Id'] = getSessionId();
  }

  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.errors?.join(', ') || error.error || 'Request failed');
  }
  return response.json();
}

export const api = {
  // Auth endpoints
  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(response);
  },

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(response);
  },

  async logout(): Promise<void> {
    const token = getToken();
    if (token) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  },

  async getMe(): Promise<{ user: User }> {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse<{ user: User }>(response);
  },

  async claimActivities(): Promise<{ claimed_count: number }> {
    const sessionId = localStorage.getItem(SESSION_ID_KEY);
    const response = await fetch(`${API_BASE}/auth/claim`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ session_id: sessionId }),
    });
    return handleResponse<{ claimed_count: number }>(response);
  },

  getSessionId,

  // Activity endpoints
  async getActivities(): Promise<ActivitiesResponse> {
    const response = await fetch(`${API_BASE}/activities`, {
      headers: getHeaders(),
    });
    return handleResponse<ActivitiesResponse>(response);
  },

  async getActivity(id: number): Promise<Activity> {
    const response = await fetch(`${API_BASE}/activities/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse<Activity>(response);
  },

  async createActivity(data: ActivityFormData): Promise<Activity> {
    const response = await fetch(`${API_BASE}/activities`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ activity: data }),
    });
    return handleResponse<Activity>(response);
  },

  async updateActivity(id: number, data: Partial<ActivityFormData>): Promise<Activity> {
    const response = await fetch(`${API_BASE}/activities/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ activity: data }),
    });
    return handleResponse<Activity>(response);
  },

  async deleteActivity(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/activities/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to delete activity');
    }
  },

  async getEmissionFactors(): Promise<Record<string, EmissionFactor>> {
    const response = await fetch(`${API_BASE}/emission_factors`);
    return handleResponse<Record<string, EmissionFactor>>(response);
  },
};
