// lib/actions/meal.actions.ts

import { Stats } from "@/types";
import { appwriteConfig, ID, Query, tables } from "../appwrite";
import { toISODate, toLocalISOString } from "../utils";

export interface MealRecord {
  $id: string;
  boarderId: string;
  date: string;
  mealType: "brunch" | "dinner";
  status: "ON" | "OFF";
  servedByStaffId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MealToggleData {
  boarderId: string;
  date: string;
  mealType: "brunch" | "dinner";
  status: "ON" | "OFF";
}

/**
 * Get or create meal record for a specific boarder and date
 */
export async function getOrCreateMealRecord(
  boarderId: string,
  date: string,
  mealType: "brunch" | "dinner"
) {
  // Compute same-day range using local time ISO strings
  const { startOfDayIso, endOfDayIso } = getDayRangeIso(date);
  try {
    // Look for existing meal row for same day and meal type
    const response = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.mealsTableId,
      queries: [
        Query.equal("boarderId", boarderId),
        Query.equal("mealType", mealType),
        Query.between("date", startOfDayIso, endOfDayIso),
      ],
    });

    if (response.rows.length > 0) {
      return response.rows[0];
    }

    // Create new meal row if none exists; store ISO at start of local day
    const newRecord = await tables.createRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.mealsTableId,
      rowId: ID.unique(),
      data: {
        boarderId,
        date: startOfDayIso,
        mealType,
        status: "ON", // default
        servedByStaffId: "", // default not served
      },
    });

    return newRecord;
  } catch (error: any) {
    console.error("Get or create meal record error:", error);
    return null;
  }
}

/**
 * Toggle meal status for a boarder
 */
export async function toggleMealStatus(
  boarderId: string,
  date: string,
  mealType: "brunch" | "dinner",
  status: "ON" | "OFF"
) {
  try {
    const mealRecord = await getOrCreateMealRecord(boarderId, date, mealType);
    if (!mealRecord) throw new Error("Failed to get meal record");

    const updatedRecord = await tables.updateRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.mealsTableId,
      rowId: mealRecord.$id,
      data: { status },
    });

    return { success: true, record: updatedRecord };
  } catch (error: any) {
    console.error("Toggle meal status error:", error);
    return {
      success: false,
      error: error.message || "Failed to toggle meal status",
    };
  }
}

/**
 * Bulk set meal status for a boarder within a date range (inclusive) for one or both meal types.
 * Dates are normalized to ISO (YYYY-MM-DD). Only future dates within current month should be passed by callers.
 */
export async function setMealStatusForDateRange(
  boarderId: string,
  startDate: string,
  endDate: string,
  options: { brunch?: boolean; dinner?: boolean; status: "ON" | "OFF" }
) {
  const { startOfDayIso: startIso } = getDayRangeIso(startDate);
  const { endOfDayIso: endIso } = getDayRangeIso(endDate);
  try {
    const dates: string[] = [];
    const start = new Date(startIso);
    const end = new Date(endIso);
    for (
      let d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      d <= end;
      d.setDate(d.getDate() + 1)
    ) {
      // push local YYYY-MM-DD for per-day iteration; creation/search uses same-day range
      dates.push(formatLocalYMD(d));
    }

    const results: { date: string; brunch?: any; dinner?: any; error?: string }[] = [];
    for (const d of dates) {
      const entry: any = { date: d };
      try {
        if (options.brunch) {
          const mealRecord = await getOrCreateMealRecord(boarderId, d, "brunch");
          if (mealRecord) {
            entry.brunch = await tables.updateRow({
              databaseId: appwriteConfig.databaseId,
              tableId: appwriteConfig.mealsTableId,
              rowId: mealRecord.$id,
              data: { status: options.status },
            });
          }
        }
        if (options.dinner) {
          const mealRecord = await getOrCreateMealRecord(boarderId, d, "dinner");
          if (mealRecord) {
            entry.dinner = await tables.updateRow({
              databaseId: appwriteConfig.databaseId,
              tableId: appwriteConfig.mealsTableId,
              rowId: mealRecord.$id,
              data: { status: options.status },
            });
          }
        }
      } catch (err: any) {
        entry.error = err?.message || "Failed to update";
      }
      results.push(entry);
    }

    return { success: true, results };
  } catch (error: any) {
    console.error("Bulk set meal status error:", error);
    return { success: false, error: error.message || "Failed bulk status" };
  }
}

/**
 * Mark meal as taken by staff
 */
export async function markMealAsTaken(
  boarderId: string,
  date: string,
  mealType: "brunch" | "dinner",
  staffId: string
) {
   const isoDate = toISODate(date);
  try {
    const mealRecord = await getOrCreateMealRecord(boarderId, isoDate, mealType);
    if (!mealRecord) throw new Error("Failed to get meal record");

    const updatedRecord = await tables.updateRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.mealsTableId,
      rowId: mealRecord.$id,
      data: { servedByStaffId: staffId },
    });

    return { success: true, record: updatedRecord };
  } catch (error: any) {
    console.error("Mark meal as taken error:", error);
    return {
      success: false,
      error: error.message || "Failed to mark meal as taken",
    };
  }
}

/**
 * Get meal records for a specific date
 */
export async function getMealRecordsForDate(
  date: string
): Promise<MealRecord[]> {
  const { startOfDayIso, endOfDayIso } = getDayRangeIso(date);
  try {
    const response = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.mealsTableId,
      queries: [
        Query.between("date", startOfDayIso, endOfDayIso),
        Query.orderAsc("boarderId"),
      ],
    });

    return response.rows as unknown as MealRecord[];
  } catch (error: any) {
    console.error("Get meal records for date error:", error);
    return [];
  }
}

/**
 * Get meal records for a specific boarder
 */
export async function getMealRecordsForBoarder(
  boarderId: string,
  limit: number = 30
): Promise<MealRecord[]> {
  try {
    const response = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.mealsTableId,
      queries: [
        Query.equal("boarderId", boarderId),
        Query.orderDesc("date"),
        Query.limit(limit),
      ],
    });

    return response.rows as unknown as MealRecord[];
  } catch (error: any) {
    console.error("Get meal records for boarder error:", error);
    return [];
  }
}

/**
 * Count ON meals for a boarder within a date range (inclusive)
 */
export async function countOnMealsForBoarder(
  boarderId: string,
  startDate: string,
  endDate: string
) {
  const { startOfDayIso: startIso } = getDayRangeIso(startDate);
  const { endOfDayIso: endIso } = getDayRangeIso(endDate);
  try {
    const response = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.mealsTableId,
      queries: [
        Query.equal("boarderId", boarderId),
        Query.between("date", startIso, endIso),
        Query.equal("status", "ON"),
      ],
    });

    return { success: true, count: response.rows.length };
  } catch (error: any) {
    console.error("Count ON meals for boarder error:", error);
    return { success: false, count: 0, error: error.message || "Failed to count meals" };
  }
}

/**
 * Count ON meals for the current month up to today
 */
export async function countCurrentMonthMealsForBoarder(boarderId: string) {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date();
  return countOnMealsForBoarder(boarderId, formatLocalYMD(startDate), formatLocalYMD(endDate));
}

/**
 * Get meal count statistics for a specific date and meal preference
 */
export async function getMealCountStats(date: string) {
  try {
    const mealRecords = await getMealRecordsForDate(date);

    const boardersResponse = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.boardersTableId,
      queries: [Query.equal("isActive", true)],
    });

    const boarders = boardersResponse.rows;

    // Map boarderId -> mealPreference
    const boarderPreferences = new Map<
      string,
      { name: string; mealPreference: string }
    >();
    boarders.forEach((boarder: any) => {
      boarderPreferences.set(boarder.userId, {
        name: boarder.name,
        mealPreference: boarder.mealPreference || "non-veg",
      });
    });

    const stats: Stats = {
      brunch: {
        veg: { count: 0, boarders: [] as string[] },
        "non-veg": { count: 0, boarders: [] },
        egg: { count: 0, boarders: [] },
        fish: { count: 0, boarders: [] },
      },
      dinner: {
        veg: { count: 0, boarders: [] },
        "non-veg": { count: 0, boarders: [] },
        egg: { count: 0, boarders: [] },
        fish: { count: 0, boarders: [] },
      },
    };

    mealRecords.forEach((record) => {
      const boarderInfo = boarderPreferences.get(record.boarderId);
      if (!boarderInfo) return;

      const preference = boarderInfo.mealPreference as
        | "veg"
        | "non-veg"
        | "egg"
        | "fish";
      if (record.status === "ON") {
        if (record.mealType === "brunch") {
          stats.brunch[preference].count++;
          stats.brunch[preference].boarders.push(boarderInfo.name);
        } else if (record.mealType === "dinner") {
          stats.dinner[preference].count++;
          stats.dinner[preference].boarders.push(boarderInfo.name);
        }
      }
    });

    return { success: true, stats };
  } catch (error: any) {
    console.error("Get meal count stats error:", error);
    return {
      success: false,
      error: error.message || "Failed to get meal statistics",
      stats: null,
    };
  }
}

// Helpers
function formatLocalYMD(d: Date): string {
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDayRangeIso(input: string): { startOfDayIso: string; endOfDayIso: string } {
  // Input can be YYYY-MM-DD or full ISO
  let year: number, month: number, day: number;
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [y, m, d] = input.split("-").map((v) => parseInt(v, 10));
    year = y;
    month = m - 1;
    day = d;
  } else {
    const dt = new Date(input);
    year = dt.getFullYear();
    month = dt.getMonth();
    day = dt.getDate();
  }
  const start = new Date(year, month, day, 0, 0, 0, 0);
  const end = new Date(year, month, day, 23, 59, 59, 999);
  // Use local time ISO strings to prevent timezone conversion
  return { startOfDayIso: toLocalISOString(start), endOfDayIso: toLocalISOString(end) };
}
