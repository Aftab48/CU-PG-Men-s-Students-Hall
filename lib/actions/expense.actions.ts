import { File } from "expo-file-system";
import { appwriteConfig, ID, Query, storage, tables } from "../appwrite";
import { CacheKeys, cacheManager } from "../cache";
import { getLocalTimestamp, toISODate } from "../utils";

export interface ExpenseRecord {
  $id: string;
  date: string;
  category:
    | "fish"
    | "chicken"
    | "paneer"
    | "veg"
    | "gas"
    | "grocery"
    | "eggs"
    | "rice/potato"
    | "misc"
    | "grand"
    | "prev"
    | "staff";
  amount: number;
  description: string;
  receipt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCreateData {
  date: string;
  category:
    | "fish"
    | "chicken"
    | "paneer"
    | "veg"
    | "gas"
    | "grocery"
    | "eggs"
    | "rice/potato"
    | "misc"
    | "grand"
    | "prev"
    | "staff";
  amount: number;
  description: string;
  receipt?: string;
}

/**
 * Upload receipt image to Appwrite Storage
 */
async function uploadReceiptToStorage(localUri: string): Promise<string | null> {
  try {
    // Extract file name from URI
    const fileName = localUri.split("/").pop() || `receipt_${Date.now()}.jpg`;
    
    // Get file info using the new File API
    const fileHandle = new File(localUri);
    if (!fileHandle.exists) {
      throw new Error("File does not exist");
    }

    const fileInfo = await fileHandle.info();

    // Determine file type based on extension
    const fileExtension = fileName.split(".").pop()?.toLowerCase() || "jpg";
    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };
    const mimeType = mimeTypes[fileExtension] || "image/jpeg";
    
    // Create file object for upload
    const file = {
      name: fileName,
      type: mimeType,
      size: fileInfo.size || 0,
      uri: localUri,
    };

    // Upload to Appwrite Storage
    const uploadedFile = await storage.createFile({
      bucketId:appwriteConfig.bucketId,
      fileId: ID.unique(),
      file
    });

    // Construct the file view URL manually
    const fileUrl = `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucketId}/files/${uploadedFile.$id}/view?project=${appwriteConfig.projectId}`;
    
    return fileUrl;
  } catch (error: any) {
    console.error("Upload receipt error:", error);
    throw new Error(error.message || "Failed to upload receipt");
  }
}

/**
 * Create a new expense record
 */
export async function createExpense(expenseData: ExpenseCreateData) {
  try {
    let receiptUrl: string | null = null;

    // Upload receipt image if provided
    if (expenseData.receipt) {
      receiptUrl = await uploadReceiptToStorage(expenseData.receipt) || null;
    }

    const newExpense = await tables.createRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.expensesTableId,
      rowId: ID.unique(),
      data: {
        date: toISODate(expenseData.date),
        category: expenseData.category,
        amount: expenseData.amount,
        description: expenseData.description,
        ...(receiptUrl && { receipt: receiptUrl }),
      },
    });

    // Invalidate relevant caches
    const dateObj = new Date(expenseData.date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    await cacheManager.invalidate(CacheKeys.totalExpenses());
    await cacheManager.invalidate(CacheKeys.monthlyExpensesSummary(year, month));

    return {
      success: true,
      expense: newExpense,
    };
  } catch (error: any) {
    console.error("Create expense error:", error);
    return {
      success: false,
      error: error.message || "Failed to create expense",
    };
  }
}

/**
 * Get expenses for a specific date range
 * @param forceRefresh - If true, bypasses cache and fetches fresh data
 */
export async function getExpensesForDateRange(
  startDate: string,
  endDate: string,
  forceRefresh: boolean = false
): Promise<ExpenseRecord[]> {
  try {
    const cacheKey = CacheKeys.expensesForDateRange(startDate, endDate);
    
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
          tableId: appwriteConfig.expensesTableId,
          queries: [
            Query.greaterThanEqual("date", startISO),
            Query.lessThanEqual("date", endISO),
            Query.orderDesc("date"),
          ],
        });

        return response.rows as unknown as ExpenseRecord[];
      },
      forceRefresh
    );
  } catch (error: any) {
    console.error("Get expenses for date range error:", error);
    return [];
  }
}

/**
 * Compute total expenses over an optional date range. If not provided,
 * computes the sum of all expense rows.
 * @param forceRefresh - If true, bypasses cache and fetches fresh data
 */
export async function getTotalExpenses(options?: {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  forceRefresh?: boolean;
}): Promise<{ success: boolean; total?: number; error?: string }> {
  try {
    const cacheKey = CacheKeys.totalExpenses(options?.startDate, options?.endDate);
    
    return await cacheManager.cacheOrFetch(
      cacheKey,
      async () => {
        const queries = [] as any[];
        if (options?.startDate) {
          queries.push(Query.greaterThanEqual("date", toISODate(options.startDate)));
        }
        if (options?.endDate) {
          queries.push(Query.lessThanEqual("date", toISODate(options.endDate)));
        }

        const response = await tables.listRows({
          databaseId: appwriteConfig.databaseId,
          tableId: appwriteConfig.expensesTableId,
          queries,
        });

        const rows = response.rows as unknown as { amount?: number }[];
        const total = rows.reduce((sum, row) => sum + (row.amount || 0), 0);
        return { success: true, total };
      },
      options?.forceRefresh || false
    );
  } catch (error: any) {
    console.error("Get total expenses error:", error);
    return { success: false, error: error.message || "Failed to compute total expenses" };
  }
}

/**
 * Get monthly expenses summary
 * @param forceRefresh - If true, bypasses cache and fetches fresh data
 */
export async function getMonthlyExpensesSummary(year: number, month: number, forceRefresh: boolean = false) {
  try {
    const cacheKey = CacheKeys.monthlyExpensesSummary(year, month);
    
    return await cacheManager.cacheOrFetch(
      cacheKey,
      async () => {
        // Use local date formatting instead of UTC
        const startDateObj = new Date(year, month - 1, 1);
        const endDateObj = new Date(year, month, 0);
        const startDate = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, "0")}-${String(startDateObj.getDate()).padStart(2, "0")}`;
        const endDate = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, "0")}-${String(endDateObj.getDate()).padStart(2, "0")}`;

        const expenses = await getExpensesForDateRange(startDate, endDate, forceRefresh);

    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    // Maintain backwards compatibility: treat "grocery" as groceriesTotal and all others as otherTotal
    const groceriesTotal = expenses
      .filter((expense) => expense.category === "grocery")
      .reduce((sum, expense) => sum + expense.amount, 0);
    const otherTotal = expenses
      .filter((expense) => expense.category !== "grocery")
      .reduce((sum, expense) => sum + expense.amount, 0);

    // Also provide per-category totals for richer UIs (non-breaking addition)
    const totalsByCategory = expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

        return {
          success: true,
          summary: {
            totalExpenses,
            groceriesTotal,
            otherTotal,
            totalsByCategory,
            expenseCount: expenses.length,
            expenses,
            period: {
              startDate,
              endDate,
              month,
              year,
            },
          },
        };
      },
      forceRefresh
    );
  } catch (error: any) {
    console.error("Get monthly expenses summary error:", error);
    return {
      success: false,
      error: error.message || "Failed to get monthly summary",
      summary: null,
    };
  }
}

/**
 * Update an expense record
 */
export async function updateExpense(
  expenseId: string,
  updates: Partial<Omit<ExpenseRecord, "$id" | "createdAt">>
) {
  try {
    const updatedExpense = await tables.updateRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.expensesTableId,
      rowId: expenseId,
      data: {
        ...updates,
        updatedAt: getLocalTimestamp(), // Use local timestamp
      },
    });

    return {
      success: true,
      expense: updatedExpense,
    };
  } catch (error: any) {
    console.error("Update expense error:", error);
    return {
      success: false,
      error: error.message || "Failed to update expense",
    };
  }
}

/**
 * Delete an expense record
 */
export async function deleteExpense(expenseId: string) {
  try {
    await tables.deleteRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.expensesTableId,
      rowId: expenseId,
    });

    return {
      success: true,
      message: "Expense deleted successfully",
    };
  } catch (error: any) {
    console.error("Delete expense error:", error);
    return {
      success: false,
      error: error.message || "Failed to delete expense",
    };
  }
}
