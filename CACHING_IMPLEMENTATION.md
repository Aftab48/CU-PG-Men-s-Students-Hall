# Data Caching Implementation

This document describes the comprehensive caching system implemented for the application, which stores all database fetches locally and only refetches when the user explicitly clicks the refresh button.

## Overview

The caching system uses `AsyncStorage` to persist data locally on the device. Data is fetched from the database on first load, cached locally, and subsequent loads use the cached data unless the user explicitly refreshes.

## Architecture

### 1. Cache Manager (`lib/cache.ts`)

A centralized caching utility that handles all cache operations:

**Key Features:**
- `get<T>(key: string)`: Retrieves cached data for a given key
- `set<T>(key: string, data: T)`: Stores data in cache with timestamp
- `invalidate(key: string)`: Removes cached data for a specific key
- `clearAll()`: Clears all cached data
- `cacheOrFetch<T>(key, fetchFn, forceRefresh)`: Smart wrapper that checks cache first, then fetches if needed

**Cache Keys:**
Consistent key generators for all data types:
- `boarderProfile(userId)`: Boarder profile by user ID
- `mealRecordsForDate(date)`: Meal records for specific date
- `expensesForDateRange(start, end)`: Expenses in date range
- `paymentsForDateRange(start, end)`: Payments in date range
- `mealCountStats(date)`: Meal statistics for date
- And many more...

### 2. Action Files Updated

All data-fetching functions in action files now support caching:

#### **Boarder Actions** (`lib/actions/boarder.actions.ts`)
- `getBoarderProfile(userId, forceRefresh)`
- `getBoarderProfileById(profileId, forceRefresh)`
- `getAllActiveBoarders(forceRefresh)`
- Cache invalidation on profile updates

#### **Meal Actions** (`lib/actions/meal.actions.ts`)
- `getMealRecordsForDate(date, forceRefresh)`
- `getMealRecordsForBoarder(boarderId, limit, forceRefresh)`
- `countOnMealsForBoarder(boarderId, startDate, endDate, forceRefresh)`
- `countCurrentMonthMealsForBoarder(boarderId, forceRefresh)`
- `getMealCountStats(date, forceRefresh)`
- Cache invalidation on meal toggles

#### **Expense Actions** (`lib/actions/expense.actions.ts`)
- `getExpensesForDateRange(startDate, endDate, forceRefresh)`
- `getTotalExpenses(options)`
- `getMonthlyExpensesSummary(year, month, forceRefresh)`
- Cache invalidation on expense creation

#### **Payment Actions** (`lib/actions/payments.actions.ts`)
- `getPaymentsForDateRange(startDate, endDate, forceRefresh)`
- `getAllPayments(forceRefresh)`
- `getTotalPayments(options)`
- `getPaymentsByBoarder(boarderId, forceRefresh)`

### 3. Screen Updates

#### **Boarder Screens:**

**Balance Screen** (`app/(boarder)/(tabs)/balance.tsx`)
- Uses cached data on initial load
- Force refresh when clicking refresh button
- Shows advance payment and monthly meal count

**Meals Screen** (`app/(boarder)/(tabs)/meals.tsx`)
- Uses cached data for boarder profile
- Force refresh on button click
- Meal toggles invalidate relevant caches

**Payments Screen** (`app/(boarder)/(tabs)/payments.tsx`)
- Uses cached profile data
- Force refresh after successful payment submission

#### **Manager Screens:**

**Meals Count Screen** (`app/(manager)/(tabs)/meals.tsx`)
- Uses cached meal statistics
- Force refresh on button click
- Shows live meal counts by preference

**Summary Screen** (`app/(manager)/(tabs)/summary.tsx`)
- Uses cached expenses and payments
- Force refresh on button click
- Shows financial summary and recent transactions

**Expense Screen** (`app/(manager)/(tabs)/expense.tsx`)
- Clears form on refresh (for new entry)
- Cache invalidated after expense creation

## How It Works

### Initial Load (Using Cache)
```typescript
// Screen component useEffect
useEffect(() => {
  if (user) {
    loadData(false); // forceRefresh = false, uses cache
  }
}, [user]);

const loadData = async (forceRefresh: boolean = false) => {
  const data = await getBoarderProfile(user.id, forceRefresh);
  // Cache is checked first, returns cached data if available
  setData(data);
};
```

### Refresh Button Click (Force Fetch)
```typescript
const handleRefresh = () => {
  loadData(true); // forceRefresh = true, bypasses cache
};
```

### Cache Invalidation on Updates
```typescript
// When data is updated (create/update/delete operations)
export async function updateBoarderProfile(profileId, updates) {
  const updatedProfile = await tables.updateRow({...});
  
  // Invalidate related caches
  await cacheManager.invalidate(CacheKeys.boarderProfileById(profileId));
  
  return { success: true, profile: updatedProfile };
}
```

## Benefits

1. **Faster Load Times**: Subsequent loads use cached data, eliminating network delays
2. **Offline Support**: Users can view previously loaded data even without internet
3. **Reduced Server Load**: Fewer database queries
4. **Better User Experience**: Instant data display on app reopening
5. **Explicit Refresh**: Users control when to fetch fresh data via refresh button

## Cache Strategy

- **On Initial Load**: Check cache first, use if available
- **On Refresh Button**: Force fetch from database, update cache
- **On Data Mutation**: Invalidate related caches to ensure consistency
- **Cache Persistence**: Data stored in AsyncStorage survives app restarts

## Refresh Points

Users can explicitly refresh data by clicking the refresh icon (🔄) in:
- Balance screen header
- Meals screen header  
- Payments screen header
- Manager meals count screen header
- Manager summary screen header

## Future Enhancements

Potential improvements:
1. Add cache expiration (TTL) for time-sensitive data
2. Implement selective cache invalidation strategies
3. Add cache size management
4. Implement background sync when network is available
5. Add cache statistics and monitoring

## Testing

To test the caching implementation:

1. **Initial Load Test**:
   - Open the app and navigate to any screen
   - Observe data loads from database (first time)
   - Close and reopen app
   - Data should load instantly from cache

2. **Refresh Test**:
   - Click refresh button
   - Observe loading indicator
   - Data should be fetched fresh from database

3. **Update Test**:
   - Make a change (e.g., toggle meal, submit payment)
   - Click refresh to see updated data
   - Changes should be reflected

4. **Offline Test**:
   - Load data with internet
   - Disable internet
   - Navigate screens - cached data should display
   - Click refresh - should show appropriate error

## Notes

- Cache keys are generated consistently using the `CacheKeys` utility
- All cached data includes a timestamp for potential future TTL implementation
- The system is designed to be fail-safe - if cache operations fail, the app continues to work normally by fetching from database

