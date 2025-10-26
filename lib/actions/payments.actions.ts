import { appwriteConfig, Query, tables } from "../appwrite";
import { CacheKeys, cacheManager } from "../cache";
import { sendPushNotification } from "./notifications.actions";

export interface PaymentRecord {
  $id: string;
  amount: number;
  boarderId: string;
  paymentURL: string;
  status: "pending" | "approved" | "rejected";
  $createdAt: string;
  $updatedAt: string;
}

/**
 * Get payments for a specific date range
 * @param forceRefresh - If true, bypasses cache and fetches fresh data
 * @param status - Filter by payment status (defaults to "approved" for backward compatibility)
 */
export async function getPaymentsForDateRange(
  startDate: string,
  endDate: string,
  forceRefresh: boolean = false,
  status: "pending" | "approved" | "rejected" | "all" = "approved"
): Promise<PaymentRecord[]> {
  try {
    const cacheKey = CacheKeys.paymentsForDateRange(startDate, endDate, status);
    
    return await cacheManager.cacheOrFetch(
      cacheKey,
      async () => {
        // Convert YYYY-MM-DD to ISO timestamp
        // Start date: beginning of the day (00:00:00.000Z)
        const startISO = `${startDate}T00:00:00.000Z`;
        // End date: end of the day (23:59:59.999Z)
        const endISO = `${endDate}T23:59:59.999Z`;

        const queries = [
          Query.greaterThanEqual("$createdAt", startISO),
          Query.lessThanEqual("$createdAt", endISO),
          Query.orderDesc("$createdAt"),
        ];

        // Only add status filter if not "all"
        if (status !== "all") {
          queries.push(Query.equal("status", status));
        }

        const response = await tables.listRows({
          databaseId: appwriteConfig.databaseId,
          tableId: appwriteConfig.paymentsTableId,
          queries,
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
 * Only counts approved payments by default.
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
        const queries = [Query.equal("status", "approved")] as any[];
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
 * @param status - Filter by payment status (defaults to "all")
 */
export async function getPaymentsByBoarder(
  boarderId: string,
  forceRefresh: boolean = false,
  status: "pending" | "approved" | "rejected" | "all" = "all"
): Promise<PaymentRecord[]> {
  try {
    const cacheKey = CacheKeys.paymentsByBoarder(boarderId, status);
    
    return await cacheManager.cacheOrFetch(
      cacheKey,
      async () => {
        const queries = [
          Query.equal("boarderId", boarderId),
          Query.orderDesc("$createdAt"),
        ] as any[];

        // Only add status filter if not "all"
        if (status !== "all") {
          queries.push(Query.equal("status", status));
        }

        const response = await tables.listRows({
          databaseId: appwriteConfig.databaseId,
          tableId: appwriteConfig.paymentsTableId,
          queries,
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

/**
 * Get all pending payments (for manager approval)
 * @param forceRefresh - If true, bypasses cache and fetches fresh data
 */
export async function getPendingPayments(
  forceRefresh: boolean = false
): Promise<PaymentRecord[]> {
  try {
    const cacheKey = CacheKeys.pendingPayments();
    
    return await cacheManager.cacheOrFetch(
      cacheKey,
      async () => {
        const response = await tables.listRows({
          databaseId: appwriteConfig.databaseId,
          tableId: appwriteConfig.paymentsTableId,
          queries: [
            Query.equal("status", "pending"),
            Query.orderDesc("$createdAt"),
          ],
        });

        return response.rows as unknown as PaymentRecord[];
      },
      forceRefresh
    );
  } catch (error: any) {
    console.error("Get pending payments error:", error);
    return [];
  }
}

/**
 * Approve a payment: updates payment status and adds amount to boarder's advance
 */
export async function approvePayment(
  paymentId: string,
  boarderId: string,
  amount: number
) {
  try {
    if (!paymentId?.trim()) {
      throw new Error("Payment ID is required");
    }
    if (!boarderId?.trim()) {
      throw new Error("Boarder ID is required");
    }

    // Update payment status to approved
    await tables.updateRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.paymentsTableId,
      rowId: paymentId,
      data: { status: "approved" },
    });

    // Get current boarder profile
    const currentProfile = await tables.getRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.boardersTableId,
      rowId: boarderId,
    });

    const currentAdvance = currentProfile?.advance ?? 0;
    const newAdvance = currentAdvance + amount;

    // Update boarder's advance balance
    await tables.updateRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.boardersTableId,
      rowId: boarderId,
      data: { advance: newAdvance },
    });

    // Invalidate relevant caches
    await cacheManager.invalidate(CacheKeys.pendingPayments());
    await cacheManager.invalidate(CacheKeys.allPayments());
    await cacheManager.invalidate(CacheKeys.totalPayments());
    await cacheManager.invalidate(CacheKeys.paymentsByBoarder(boarderId));
    await cacheManager.invalidate(CacheKeys.boarderProfileById(boarderId));
    
    // Also invalidate boarder profile by userId if available
    if (currentProfile?.userId) {
      await cacheManager.invalidate(CacheKeys.boarderProfile(currentProfile.userId));
    }

    // Send push notification to boarder (don't block on failure)
    if (currentProfile?.userId) {
      sendPushNotification(
        currentProfile.userId,
        "Payment Approved",
        `Your payment of ₹${amount} has been approved. New balance: ₹${newAdvance}`,
        { type: "payment_approved", paymentId, amount, newAdvance }
      ).catch((error) => {
        console.error("Failed to send payment approval notification:", error);
      });
    }

    return {
      success: true,
      newAdvance,
    };
  } catch (error: any) {
    console.error("Approve payment error:", error);
    return {
      success: false,
      error: error.message || "Failed to approve payment",
    };
  }
}

/**
 * Reject a payment: updates payment status to rejected
 */
export async function rejectPayment(
  paymentId: string,
  reason?: string
) {
  try {
    if (!paymentId?.trim()) {
      throw new Error("Payment ID is required");
    }

    // Get payment to find boarderId for cache invalidation
    const payment = await tables.getRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.paymentsTableId,
      rowId: paymentId,
    });

    const boarderId = payment?.boarderId;

    // Update payment status to rejected
    await tables.updateRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.paymentsTableId,
      rowId: paymentId,
      data: { status: "rejected" },
    });

    // Invalidate relevant caches
    await cacheManager.invalidate(CacheKeys.pendingPayments());
    if (boarderId) {
      await cacheManager.invalidate(CacheKeys.paymentsByBoarder(boarderId));
    }

    return {
      success: true,
      reason,
    };
  } catch (error: any) {
    console.error("Reject payment error:", error);
    return {
      success: false,
      error: error.message || "Failed to reject payment",
    };
  }
}

