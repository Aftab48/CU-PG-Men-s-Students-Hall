import { appwriteConfig, ID, Query, tables } from "../appwrite";
import { toISODate } from "../utils";

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
 * Create a new expense record
 */
export async function createExpense(expenseData: ExpenseCreateData) {
  try {
    const newExpense = await tables.createRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.expensesTableId,
      rowId: ID.unique(),
      data: {
        date: toISODate(expenseData.date),
        category: expenseData.category,
        amount: expenseData.amount,
        description: expenseData.description,
        receipt: expenseData.receipt || "",
      },
    });

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
 */
export async function getExpensesForDateRange(
  startDate: string,
  endDate: string
): Promise<ExpenseRecord[]> {
  try {
    const response = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.expensesTableId,
      queries: [
        Query.greaterThanEqual("date", toISODate(startDate)),
        Query.lessThanEqual("date", toISODate(endDate)),
        Query.orderDesc("date"),
      ],
    });

    return response.rows as unknown as ExpenseRecord[];
  } catch (error: any) {
    console.error("Get expenses for date range error:", error);
    return [];
  }
}

/**
 * Compute total expenses over an optional date range. If not provided,
 * computes the sum of all expense rows.
 */
export async function getTotalExpenses(options?: {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}): Promise<{ success: boolean; total?: number; error?: string }> {
  try {
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
  } catch (error: any) {
    console.error("Get total expenses error:", error);
    return { success: false, error: error.message || "Failed to compute total expenses" };
  }
}

/**
 * Get monthly expenses summary
 */
export async function getMonthlyExpensesSummary(year: number, month: number) {
  try {
    const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0];
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];

    const expenses = await getExpensesForDateRange(startDate, endDate);

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
        updatedAt: new Date().toISOString(),
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
