/**
 * Utilities for date handling and conversion
 */

/**
 * Safely converts any date value to a Date object
 * @param dateValue - Value to convert (string, Date, or other)
 * @returns Valid Date object
 */
export function safeParseDate(dateValue: any): Date {
  // If already a Date object, return as-is
  if (dateValue instanceof Date) {
    // Verify it's a valid date
    if (isNaN(dateValue.getTime())) {
      console.warn('⚠️ Invalid Date object:', dateValue);
      return new Date();
    }
    return dateValue;
  }

  // If string, try to parse
  if (typeof dateValue === 'string') {
    try {
      const parsed = new Date(dateValue);
      if (isNaN(parsed.getTime())) {
        console.warn('⚠️ Could not parse date string:', dateValue);
        return new Date();
      }
      return parsed;
    } catch (error) {
      console.warn('⚠️ Error parsing date string:', dateValue, error);
      return new Date();
    }
  }

  // If number (timestamp), convert
  if (typeof dateValue === 'number') {
    try {
      const parsed = new Date(dateValue);
      if (isNaN(parsed.getTime())) {
        console.warn('⚠️ Invalid timestamp:', dateValue);
        return new Date();
      }
      return parsed;
    } catch (error) {
      console.warn('⚠️ Error parsing timestamp:', dateValue, error);
      return new Date();
    }
  }

  // Fallback for any other type
  console.warn('⚠️ Unexpected date value type:', typeof dateValue, dateValue);
  return new Date();
}

/**
 * Formats time from a Date object in HH:MM format
 * @param date - Date object
 * @returns Formatted time string
 */
export function formatTime(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    console.warn('⚠️ Invalid date passed to formatTime:', date);
    return '00:00';
  }

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Validates that an object has valid Date properties
 * @param obj - Object to validate
 * @param dateProperties - Array of property names that should be Date objects
 * @returns Boolean indicating if all date properties are valid
 */
export function validateDateProperties(obj: any, dateProperties: string[]): boolean {
  for (const prop of dateProperties) {
    const value = obj[prop];
    if (!(value instanceof Date) || isNaN(value.getTime())) {
      console.warn(`⚠️ Invalid date property ${prop}:`, value);
      return false;
    }
  }
  return true;
}