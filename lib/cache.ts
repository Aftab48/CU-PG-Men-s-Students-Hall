// lib/cache.ts
// Centralized caching utility for all data fetches

import AsyncStorage from "@react-native-async-storage/async-storage";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_PREFIX = "app_cache_";

/**
 * Cache utility class for managing local data storage
 */
class CacheManager {
  /**
   * Get cached data for a given key
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (!cached) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);
      return entry.data;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached data for a given key
   */
  async set<T>(key: string, data: T): Promise<void> {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Remove cached data for a given key
   */
  async invalidate(key: string): Promise<void> {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      await AsyncStorage.removeItem(cacheKey);
    } catch (error) {
      console.error(`Cache invalidate error for key ${key}:`, error);
    }
  }

  /**
   * Clear all cached data
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error("Cache clear all error:", error);
    }
  }

  /**
   * Wrapper function to cache API calls
   * @param key - Cache key
   * @param fetchFn - Function that fetches data from API
   * @param forceRefresh - Whether to bypass cache and fetch fresh data
   */
  async cacheOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    forceRefresh: boolean = false
  ): Promise<T> {
    // If force refresh, invalidate cache first
    if (forceRefresh) {
      await this.invalidate(key);
    }

    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null && !forceRefresh) {
      console.log(`Using cached data for key: ${key}`);
      return cached;
    }

    // Fetch fresh data
    console.log(`Fetching fresh data for key: ${key}`);
    const freshData = await fetchFn();
    
    // Cache the fresh data
    await this.set(key, freshData);
    
    return freshData;
  }
}

export const cacheManager = new CacheManager();

// Cache key generators for consistent naming
export const CacheKeys = {
  boarderProfile: (userId: string) => `boarder_profile_${userId}`,
  boarderProfileById: (profileId: string) => `boarder_profile_by_id_${profileId}`,
  boarderProfileByEmail: (email: string) => `boarder_profile_by_email_${email}`,
  allActiveBoarders: () => `all_active_boarders`,
  pendingBoarders: () => `pending_boarders`,
  mealRecord: (boarderId: string, date: string, mealType: string) => 
    `meal_record_${boarderId}_${date}_${mealType}`,
  mealRecordsForDate: (date: string) => `meal_records_date_${date}`,
  mealRecordsForBoarder: (boarderId: string, limit: number) => 
    `meal_records_boarder_${boarderId}_${limit}`,
  mealCountStats: (date: string) => `meal_count_stats_${date}`,
  expensesForDateRange: (startDate: string, endDate: string) => 
    `expenses_${startDate}_to_${endDate}`,
  totalExpenses: (startDate?: string, endDate?: string) => 
    `total_expenses_${startDate || 'all'}_${endDate || 'all'}`,
  monthlyExpensesSummary: (year: number, month: number) => 
    `monthly_expenses_${year}_${month}`,
  paymentsForDateRange: (startDate: string, endDate: string, status?: string) => 
    `payments_${startDate}_to_${endDate}_${status || 'all'}`,
  allPayments: () => `all_payments`,
  totalPayments: (startDate?: string, endDate?: string) => 
    `total_payments_${startDate || 'all'}_${endDate || 'all'}`,
  paymentsByBoarder: (boarderId: string, status?: string) => 
    `payments_boarder_${boarderId}_${status || 'all'}`,
  pendingPayments: () => `pending_payments`,
  monthlyMealsCount: (boarderId: string) => `monthly_meals_count_${boarderId}`,
  pendingStaff: () => `pending_staff`,
  mealLogForSlot: (date: string, mealType: string) => `meal_log_${date}_${mealType}`,
  staffProfile: (userId: string) => `staff_profile_${userId}`,
};

