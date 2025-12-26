export type ActivityType =
  | 'driving'
  | 'flight'
  | 'electricity'
  | 'natural_gas'
  | 'food_beef'
  | 'food_chicken'
  | 'purchase';

export interface ActivityTypeInfo {
  value: ActivityType;
  label: string;
  pluralLabel: string;
  unit: string;
}

export const ACTIVITY_TYPES: ActivityTypeInfo[] = [
  { value: 'driving', label: 'Driving', pluralLabel: 'Driving', unit: 'km' },
  { value: 'flight', label: 'Flight', pluralLabel: 'Flights', unit: 'km' },
  { value: 'electricity', label: 'Electricity', pluralLabel: 'Electricity', unit: 'kWh' },
  { value: 'natural_gas', label: 'Natural Gas', pluralLabel: 'Natural Gas', unit: 'therms' },
  { value: 'food_beef', label: 'Food (Beef)', pluralLabel: 'Beef', unit: 'kg' },
  { value: 'food_chicken', label: 'Food (Chicken)', pluralLabel: 'Chicken', unit: 'kg' },
  { value: 'purchase', label: 'Purchase', pluralLabel: 'Purchases', unit: 'USD' },
];

export const getActivityTypeInfo = (type: ActivityType): ActivityTypeInfo | undefined =>
  ACTIVITY_TYPES.find((t) => t.value === type);

export const getActivityTypeLabel = (type: string): string =>
  ACTIVITY_TYPES.find((t) => t.value === type)?.pluralLabel || type;

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
