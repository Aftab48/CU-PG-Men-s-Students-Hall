// lib/seedMeals.ts

import { appwriteConfig, ID, tables } from "./appwrite";

// Dummy staff ID for testing
//const DUMMY_STAFF_ID = "68dummy1234567890";

/**
 * Seeds the meals table for all boarders for a given number of days.
 * @param days Number of days to seed (default 24)
 */
export async function seedMeals(days: 24) {
  try {
    // Fetch all boarders
    const boardersResponse = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.boardersTableId,
    });
    const boarders = boardersResponse.rows;

    const mealTypes = ["brunch", "dinner"];
    const today = new Date();

    for (const boarder of boarders) {
      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const isoDate = date.toISOString();

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
      `✅ Meals table seeded successfully for all boarders for ${days} days!`
    );
  } catch (err) {
    console.error("❌ Error seeding meals table:", err);
  }
}
