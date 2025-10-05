import { appwriteConfig, ID, Query, tables } from "../appwrite";
import { toISODate } from "../utils";

export interface ExpenseRecord {
  $id: string;
  managerId: string;
  date: string;
  category: "groceries" | "other";
  amount: number;
  description: string;
  receipt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCreateData {
  managerId: string;
  date: string;
  category: "groceries" | "other";
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
        managerId: expenseData.managerId,
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
    const groceriesTotal = expenses
      .filter((expense) => expense.category === "groceries")
      .reduce((sum, expense) => sum + expense.amount, 0);
    const otherTotal = expenses
      .filter((expense) => expense.category === "other")
      .reduce((sum, expense) => sum + expense.amount, 0);

    return {
      success: true,
      summary: {
        totalExpenses,
        groceriesTotal,
        otherTotal,
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
  updates: Partial<Omit<ExpenseRecord, "$id" | "managerId" | "createdAt">>
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
