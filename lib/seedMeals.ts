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
