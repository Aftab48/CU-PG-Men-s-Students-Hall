// lib/utils.ts

export const formatIndianDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Format a date string from YYYY-MM-DD or ISO timestamp to DD-MM-YYYY for display
 * @param dateString - Date string in YYYY-MM-DD format or ISO timestamp
 * @returns Date string in DD-MM-YYYY format
 */
export const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return "";
  
  // If date is already in DD-MM-YYYY format, return as is
  if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
    return dateString;
  }
  
  // Parse YYYY-MM-DD format (simple date strings)
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
  }
  
  // Handle ISO timestamps (e.g., 2024-01-15T10:30:00.000Z)
  // or any other date format by parsing as Date object
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return formatIndianDate(date);
  }
  
  // If all parsing fails, return original string
  return dateString;
};

/**
 * Convert a date to YYYY-MM-DD format using LOCAL time (not UTC)
 * This ensures dates are in the user's timezone
 */
export function toISODate(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Convert a Date object to ISO string format but using LOCAL time components
 * This prevents timezone conversion that would shift dates
 */
export function toLocalISOString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const ms = String(date.getMilliseconds()).padStart(3, "0");
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}Z`;
}

/**
 * Get current timestamp as ISO string using local time
 */
export function getLocalTimestamp(): string {
  return toLocalISOString(new Date());
}

/**
 * Check if a meal can be turned off based on time restrictions
 * Brunch: Cannot turn OFF after 5am (05:00) same day
 * Dinner: Cannot turn OFF after 5pm (17:00) same day
 * 
 * @param mealType - Type of meal (brunch or dinner)
 * @param date - Date string in YYYY-MM-DD format
 * @returns Object with canToggleOff boolean and optional message
 */
export function canTurnOffMeal(
  mealType: "brunch" | "dinner",
  date: string
): { allowed: boolean; message?: string } {
  const now = new Date();
  const currentHour = now.getHours();
  
  // Get today's date string in local time
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  
  // Only apply restrictions for same-day meals
  if (date !== todayStr) {
    return { allowed: true };
  }
  
  // Brunch: Cannot turn OFF after 5am (05:00) same day
  if (mealType === "brunch" && currentHour >= 5) {
    return {
      allowed: false,
      message: "Brunch cannot be turned off after 5:00 AM on the same day."
    };
  }
  
  // Dinner: Cannot turn OFF after 5pm (17:00) same day
  if (mealType === "dinner" && currentHour >= 17) {
    return {
      allowed: false,
      message: "Dinner cannot be turned off after 5:00 PM on the same day."
    };
  }
  
  return { allowed: true };
}
