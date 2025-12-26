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

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface FetchOptions {
  method?: HttpMethod;
  body?: unknown;
  useAuth?: boolean;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, useAuth = true } = options;
  const config: RequestInit = {
    method,
    headers: useAuth ? getHeaders() : { 'Content-Type': 'application/json' },
  };
  if (body) {
    config.body = JSON.stringify(body);
  }
  const response = await fetch(`${API_BASE}${endpoint}`, config);
  return handleResponse<T>(response);
}

export const api = {
  // Auth endpoints
  signup: (data: SignupData): Promise<AuthResponse> =>
    apiFetch('/auth/signup', { method: 'POST', body: data, useAuth: false }),

  login: (data: LoginData): Promise<AuthResponse> =>
    apiFetch('/auth/login', { method: 'POST', body: data, useAuth: false }),

  logout: async (): Promise<void> => {
    if (getToken()) {
      await apiFetch('/auth/logout', { method: 'DELETE' });
    }
  },

  getMe: (): Promise<{ user: User }> =>
    apiFetch('/auth/me'),

  claimActivities: (): Promise<{ claimed_count: number }> =>
    apiFetch('/auth/claim', {
      method: 'POST',
      body: { session_id: localStorage.getItem(SESSION_ID_KEY) },
    }),

  getSessionId,

  // Activity endpoints
  getActivities: (): Promise<ActivitiesResponse> =>
    apiFetch('/activities'),

  getActivity: (id: number): Promise<Activity> =>
    apiFetch(`/activities/${id}`),

  createActivity: (data: ActivityFormData): Promise<Activity> =>
    apiFetch('/activities', { method: 'POST', body: { activity: data } }),

  updateActivity: (id: number, data: Partial<ActivityFormData>): Promise<Activity> =>
    apiFetch(`/activities/${id}`, { method: 'PATCH', body: { activity: data } }),

  deleteActivity: (id: number): Promise<void> =>
    apiFetch(`/activities/${id}`, { method: 'DELETE' }),

  getEmissionFactors: (): Promise<Record<string, EmissionFactor>> =>
    apiFetch('/emission_factors', { useAuth: false }),
};
