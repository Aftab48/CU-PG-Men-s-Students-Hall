import { appwriteConfig, Query, tables } from "../appwrite";
import { CacheKeys, cacheManager } from "../cache";

export interface PaymentRecord {
  $id: string;
  amount: number;
  boarderId: string;
  paymentURL: string;
  $createdAt: string;
  $updatedAt: string;
}

/**
 * Get payments for a specific date range
 * @param forceRefresh - If true, bypasses cache and fetches fresh data
 */
export async function getPaymentsForDateRange(
  startDate: string,
  endDate: string,
  forceRefresh: boolean = false
): Promise<PaymentRecord[]> {
  try {
    const cacheKey = CacheKeys.paymentsForDateRange(startDate, endDate);
    
    return await cacheManager.cacheOrFetch(
      cacheKey,
      async () => {
        // Convert YYYY-MM-DD to ISO timestamp
        // Start date: beginning of the day (00:00:00.000Z)
        const startISO = `${startDate}T00:00:00.000Z`;
        // End date: end of the day (23:59:59.999Z)
        const endISO = `${endDate}T23:59:59.999Z`;

        const response = await tables.listRows({
          databaseId: appwriteConfig.databaseId,
          tableId: appwriteConfig.paymentsTableId,
          queries: [
            Query.greaterThanEqual("$createdAt", startISO),
            Query.lessThanEqual("$createdAt", endISO),
            Query.orderDesc("$createdAt"),
          ],
        });

        return response.rows as unknown as PaymentRecord[];
      },
      forceRefresh
    );
  } catch (error: any) {
    console.error("Get payments for date range error:", error);
    return [];
  }
}

/**
 * Get all payments (no date filter)
 * @param forceRefresh - If true, bypasses cache and fetches fresh data
 */
export async function getAllPayments(forceRefresh: boolean = false): Promise<PaymentRecord[]> {
  try {
    const cacheKey = CacheKeys.allPayments();
    
    return await cacheManager.cacheOrFetch(
      cacheKey,
      async () => {
        const response = await tables.listRows({
          databaseId: appwriteConfig.databaseId,
          tableId: appwriteConfig.paymentsTableId,
          queries: [Query.orderDesc("$createdAt")],
        });

        return response.rows as unknown as PaymentRecord[];
      },
      forceRefresh
    );
  } catch (error: any) {
    console.error("Get all payments error:", error);
    return [];
  }
}

/**
 * Compute total payments over an optional date range.
 * If not provided, computes the sum of all payment rows.
 * @param forceRefresh - If true, bypasses cache and fetches fresh data
 */
export async function getTotalPayments(options?: {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  forceRefresh?: boolean;
}): Promise<{ success: boolean; total?: number; error?: string }> {
  try {
    const cacheKey = CacheKeys.totalPayments(options?.startDate, options?.endDate);
    
    return await cacheManager.cacheOrFetch(
      cacheKey,
      async () => {
        const queries = [] as any[];
        if (options?.startDate) {
          const startISO = `${options.startDate}T00:00:00.000Z`;
          queries.push(Query.greaterThanEqual("$createdAt", startISO));
        }
        if (options?.endDate) {
          const endISO = `${options.endDate}T23:59:59.999Z`;
          queries.push(Query.lessThanEqual("$createdAt", endISO));
        }

        const response = await tables.listRows({
          databaseId: appwriteConfig.databaseId,
          tableId: appwriteConfig.paymentsTableId,
          queries,
        });

        const rows = response.rows as unknown as { amount?: number }[];
        const total = rows.reduce((sum, row) => sum + (row.amount || 0), 0);
        return { success: true, total };
      },
      options?.forceRefresh || false
    );
  } catch (error: any) {
    console.error("Get total payments error:", error);
    return { success: false, error: error.message || "Failed to compute total payments" };
  }
}

/**
 * Get payments by boarder ID
 * @param forceRefresh - If true, bypasses cache and fetches fresh data
 */
export async function getPaymentsByBoarder(
  boarderId: string,
  forceRefresh: boolean = false
): Promise<PaymentRecord[]> {
  try {
    const cacheKey = CacheKeys.paymentsByBoarder(boarderId);
    
    return await cacheManager.cacheOrFetch(
      cacheKey,
      async () => {
        const response = await tables.listRows({
          databaseId: appwriteConfig.databaseId,
          tableId: appwriteConfig.paymentsTableId,
          queries: [
            Query.equal("boarderId", boarderId),
            Query.orderDesc("$createdAt"),
          ],
        });

        return response.rows as unknown as PaymentRecord[];
      },
      forceRefresh
    );
  } catch (error: any) {
    console.error("Get payments by boarder error:", error);
    return [];
  }
}

