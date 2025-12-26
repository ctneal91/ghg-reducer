export type ActivityType =
  | 'driving'
  | 'flight'
  | 'electricity'
  | 'natural_gas'
  | 'food_beef'
  | 'food_chicken'
  | 'purchase';

export interface Activity {
  id: number;
  activity_type: ActivityType;
  description: string | null;
  quantity: number;
  unit: string;
  emission_kg: number;
  occurred_at: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityFormData {
  activity_type: ActivityType;
  description: string;
  quantity: number;
  occurred_at: string;
}

export interface EmissionFactor {
  factor: number;
  unit: string;
  description: string;
}

export interface ActivitiesResponse {
  activities: Activity[];
  summary: {
    total_emissions_kg: number;
    activity_count: number;
  };
}
