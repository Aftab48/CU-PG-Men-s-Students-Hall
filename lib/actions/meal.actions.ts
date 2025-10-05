// lib/actions/meal.actions.ts

import { Stats } from "@/types";
import { appwriteConfig, ID, Query, tables } from "../appwrite";
import { toISODate } from "../utils";

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
  const isoDate = toISODate(date);
  try {
    // Look for existing meal row
    const response = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.mealsTableId,
      queries: [
        Query.equal("boarderId", boarderId),
        Query.equal("date", isoDate),
        Query.equal("mealType", mealType),
      ],
    });

    if (response.rows.length > 0) {
      return response.rows[0];
    }

    // Create new meal row if it doesn't exist
    const newRecord = await tables.createRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.mealsTableId,
      rowId: ID.unique(),
      data: {
        boarderId,
        date,
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
   const isoDate = toISODate(date);
  try {
    const mealRecord = await getOrCreateMealRecord(boarderId, isoDate, mealType);
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
   const isoDate = toISODate(date);
  try {
    const response = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.mealsTableId,
      queries: [Query.equal("date", isoDate), Query.orderAsc("boarderId")],
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
 * Get meal count statistics for a specific date and meal preference
 */
export async function getMealCountStats(date: string) {
  const isoDate = toISODate(date);
  try {
    const mealRecords = await getMealRecordsForDate(isoDate);

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
