import { Activity, ActivityFormData, ActivitiesResponse, EmissionFactor } from '../types/activity';

const API_BASE = '/api/v1';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.errors?.join(', ') || error.error || 'Request failed');
  }
  return response.json();
}

export const api = {
  async getActivities(): Promise<ActivitiesResponse> {
    const response = await fetch(`${API_BASE}/activities`);
    return handleResponse<ActivitiesResponse>(response);
  },

  async getActivity(id: number): Promise<Activity> {
    const response = await fetch(`${API_BASE}/activities/${id}`);
    return handleResponse<Activity>(response);
  },

  async createActivity(data: ActivityFormData): Promise<Activity> {
    const response = await fetch(`${API_BASE}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activity: data }),
    });
    return handleResponse<Activity>(response);
  },

  async updateActivity(id: number, data: Partial<ActivityFormData>): Promise<Activity> {
    const response = await fetch(`${API_BASE}/activities/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activity: data }),
    });
    return handleResponse<Activity>(response);
  },

  async deleteActivity(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/activities/${id}`, {
      method: 'DELETE',
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
