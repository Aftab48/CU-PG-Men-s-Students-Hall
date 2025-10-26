// lib/seedMeals.ts

import { appwriteConfig, ID, tables } from "./appwrite";
import { toLocalISOString } from "./utils";

// Dummy staff ID for testing
//const DUMMY_STAFF_ID = "68dummy1234567890";

/**
 * Seeds the meals table for all boarders from today up to the end of the
 * current month (inclusive of today).
 */
export async function seedMeals() {
  try {
    // Fetch all boarders
    const boardersResponse = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.boardersTableId,
    });
    const boarders = boardersResponse.rows;

    const mealTypes = ["brunch", "dinner"];
    const today = new Date();

    // Calculate remaining days in the current month (including today)
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-based
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysRemaining = lastDayOfMonth - today.getDate() + 1;

    for (const boarder of boarders) {
      for (let i = 0; i < daysRemaining; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        // Use local date and time to avoid timezone issues
        const dateAtNoon = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          12, 0, 0 // Set to noon local time to avoid any date boundary issues
        );
        const isoDate = toLocalISOString(dateAtNoon);

        for (const mealType of mealTypes) {
          await tables.createRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.mealsTableId,
            rowId: ID.unique(),
            data: {
              date: isoDate,
              boarderId: boarder.userId,
              mealType,
              status: "ON",
            },
          });
        }
      }
    }

    console.log(
      `✅ Meals table seeded successfully for all boarders through end of month (${daysRemaining} days).`
    );
  } catch (err) {
    console.error("❌ Error seeding meals table:", err);
  }
}

/**
 * Seed meals for a single boarder (by userId) from tomorrow through end of month.
 */
export async function seedMealsForBoarder(boarderUserId: string) {
  try {
    if (!boarderUserId?.trim()) return;

    const mealTypes = ["brunch", "dinner"];
    const today = new Date();

    // Calculate remaining days in the current month (excluding today)
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysRemaining = lastDayOfMonth - today.getDate();

    for (let i = 1; i <= daysRemaining; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      // Use local date and time to avoid timezone issues
      const dateAtNoon = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        12, 0, 0 // Set to noon local time to avoid any date boundary issues
      );
      const isoDate = toLocalISOString(dateAtNoon);

      for (const mealType of mealTypes) {
        await tables.createRow({
          databaseId: appwriteConfig.databaseId,
          tableId: appwriteConfig.mealsTableId,
          rowId: ID.unique(),
          data: {
            date: isoDate,
            boarderId: boarderUserId,
            mealType,
            status: "ON",
          },
        });
      }
    }

    console.log(
      `✅ Meals seeded for boarder ${boarderUserId} from tomorrow through end of month (${daysRemaining} days).`
    );
  } catch (err) {
    console.error("❌ Error seeding meals for boarder:", err);
  }
}

/**
 * Seed meals for a single boarder with custom date range
 * @param boarderUserId The user ID of the boarder
 * @param startDate Start date (YYYY-MM-DD format or Date object)
 * @param endDate End date (YYYY-MM-DD format or Date object)
 * @returns Object with success status and details
 */
export async function seedMealsForDateRange(
  boarderUserId: string,
  startDate: string | Date,
  endDate: string | Date
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  details?: {
    boarderUserId: string;
    startDate: string;
    endDate: string;
    daysCount: number;
    mealsCreated: number;
    expectedMeals: number;
    meals: { date: string; mealType: string; mealId: string }[];
  };
}> {
  try {
    // Validate inputs
    if (!boarderUserId || !startDate || !endDate) {
      return {
        success: false,
        error: "Missing required fields: boarderUserId, startDate, endDate",
      };
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        success: false,
        error: "Invalid date format. Use YYYY-MM-DD format.",
      };
    }

    if (start > end) {
      return {
        success: false,
        error: "Start date must be before or equal to end date.",
      };
    }

    const mealTypes = ["brunch", "dinner"];
    const createdMeals: { date: string; mealType: string; mealId: string }[] = [];

    // Iterate through each day in the range
    for (
      let currentDate = new Date(start);
      currentDate <= end;
      currentDate.setDate(currentDate.getDate() + 1)
    ) {
      // Use local date and time to avoid timezone issues
      const dateAtNoon = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
        12,
        0,
        0
      );
      const isoDate = toLocalISOString(dateAtNoon);

      // Create meals for both brunch and dinner
      for (const mealType of mealTypes) {
        try {
          const meal = await tables.createRow({
            databaseId: appwriteConfig.databaseId,
            tableId: appwriteConfig.mealsTableId,
            rowId: ID.unique(),
            data: {
              date: isoDate,
              boarderId: boarderUserId,
              mealType,
              status: "ON",
              servedByStaffId: "",
            },
          });

          createdMeals.push({
            date: isoDate,
            mealType,
            mealId: meal.$id,
          });
        } catch (error: any) {
          console.error(
            `Error creating ${mealType} for ${isoDate}:`,
            error.message
          );
          // Continue with other meals even if one fails
        }
      }
    }

    const daysCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return {
      success: true,
      message: `Successfully seeded meals for boarder ${boarderUserId}`,
      details: {
        boarderUserId,
        startDate: typeof startDate === 'string' ? startDate : startDate.toISOString().split('T')[0],
        endDate: typeof endDate === 'string' ? endDate : endDate.toISOString().split('T')[0],
        daysCount,
        mealsCreated: createdMeals.length,
        expectedMeals: daysCount * 2, // brunch + dinner
        meals: createdMeals,
      },
    };
  } catch (error: any) {
    console.error("Error seeding meals:", error);
    return {
      success: false,
      error: error.message || "Failed to seed meals",
    };
  }
}


/**
 * Seeds meals for a specific boarder from Oct 21-31, 2025
 * This is a convenience function with pre-configured dates and boarder ID
 */
export async function seedOctoberMeals() {
  const boarderId = "68f5fcc4003c44c49d7f";
  const startDate = "2025-10-21";
  const endDate = "2025-10-31";

  return await seedMealsForDateRange(boarderId, startDate, endDate);
}