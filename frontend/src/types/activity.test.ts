import { getActivityTypeInfo, getActivityTypeLabel, ACTIVITY_TYPES } from './activity';

describe('activity types', () => {
  describe('ACTIVITY_TYPES', () => {
    test('contains expected activity types', () => {
      expect(ACTIVITY_TYPES).toHaveLength(7);
      expect(ACTIVITY_TYPES.map(t => t.value)).toEqual([
        'driving',
        'flight',
        'electricity',
        'natural_gas',
        'food_beef',
        'food_chicken',
        'purchase',
      ]);
    });
  });

  describe('getActivityTypeInfo', () => {
    test('returns info for valid activity type', () => {
      const info = getActivityTypeInfo('driving');
      expect(info).toEqual({
        value: 'driving',
        label: 'Driving',
        pluralLabel: 'Driving',
        unit: 'km',
      });
    });

    test('returns undefined for invalid activity type', () => {
      const info = getActivityTypeInfo('invalid' as never);
      expect(info).toBeUndefined();
    });
  });

  describe('getActivityTypeLabel', () => {
    test('returns plural label for valid activity type', () => {
      expect(getActivityTypeLabel('driving')).toBe('Driving');
      expect(getActivityTypeLabel('flight')).toBe('Flights');
      expect(getActivityTypeLabel('food_beef')).toBe('Beef');
    });

    test('returns the type string for unknown type', () => {
      expect(getActivityTypeLabel('unknown_type')).toBe('unknown_type');
    });
  });
});
