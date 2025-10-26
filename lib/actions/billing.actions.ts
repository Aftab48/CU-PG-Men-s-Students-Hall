// lib/actions/billing.actions.ts

import { getAllActiveBoarders } from "./boarder.actions";
import { getExpensesForDateRange } from "./expense.actions";
import { countOnMealsForBoarder } from "./meal.actions";
import { getPaymentsForDateRange } from "./payments.actions";

/**
 * Generate monthly billing CSV with three tables:
 * 1. Expenditure vs Source
 * 2. Summary & Calculations
 * 3. Room-wise Billing Details
 */
export async function generateMonthlyBillingCSV(): Promise<string> {
  try {
    // Get current month date range
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    // Fetch all required data
    const [boarders, expenses, payments] = await Promise.all([
      getAllActiveBoarders(),
      getExpensesForDateRange(startDate, endDate),
      getPaymentsForDateRange(startDate, endDate, false, "approved"),
    ]);

    // Calculate expense totals by category
    const expensesByCategory: Record<string, number> = {
      fish: 0,
      "rice/potato": 0,
      veg: 0,
      chicken: 0,
      paneer: 0,
      eggs: 0,
      grocery: 0,
      gas: 0,
      grand: 0,
      misc: 0,
      prev: 0,
      staff: 0,
    };

    expenses.forEach((expense) => {
      const category = expense.category;
      if (expensesByCategory[category] !== undefined) {
        expensesByCategory[category] += expense.amount;
      }
    });

    // Combine chicken and paneer
    const chickenPaneerTotal = expensesByCategory.chicken + expensesByCategory.paneer;

    // Calculate totals
    const totalExpenditure = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalSource = payments.reduce((sum, pay) => sum + pay.amount, 0);
    const numberOfBoarders = boarders.length;
    const est = numberOfBoarders > 0 ? (totalExpenditure - totalSource) / numberOfBoarders : 0;

    // Fetch meal counts for each boarder
    const boarderBillingData = await Promise.all(
      boarders.map(async (boarder) => {
        const mealCountResult = await countOnMealsForBoarder(
          boarder.$id,
          startDate,
          endDate,
          false
        );
        const mealCount = mealCountResult.success ? mealCountResult.count || 0 : 0;
        const mealCost = mealCount * 30;
        const finalDue = mealCost + est - (boarder.advance || 0);

        return {
          roomNumber: boarder.roomNumber || "N/A",
          mealCount,
          mealCost,
          est,
          totalDeposit: boarder.advance || 0,
          finalDue,
        };
      })
    );

    // Build CSV content
    let csv = "";

    // Table 1: Expenditure vs Source
    csv += "EXPENDITURE (₹),AMOUNT,SOURCE (₹) (incoming),AMOUNT\n";
    csv += `TOTAL FISH MARKET,${expensesByCategory.fish},MONEY FROM BOARDER MEAL,${totalSource}\n`;
    csv += `TOTAL RICE + POTATO,${expensesByCategory["rice/potato"]},,,\n`;
    csv += `TOTAL VEG MARKET,${expensesByCategory.veg},,,\n`;
    csv += `CHICKEN + PANEER MARKET,${chickenPaneerTotal},,,\n`;
    csv += `EGGS,${expensesByCategory.eggs},,,\n`;
    csv += `GROCERY,${expensesByCategory.grocery},,,\n`;
    csv += `GAS,${expensesByCategory.gas},,,\n`;
    csv += `GRAND,${expensesByCategory.grand},,,\n`;
    csv += `MISC,${expensesByCategory.misc},,,\n`;
    csv += `PREVIOUS MONTH MESS,${expensesByCategory.prev},,,\n`;
    csv += `BAPI DA SALARY,${expensesByCategory.staff},,,\n`;
    csv += ",,,,\n";
    csv += `TOTAL EXPENDITURE,${totalExpenditure},TOTAL SOURCE,${totalSource}\n`;
    csv += "\n";

    // Table 2: Summary & Calculations
    csv += "ITEM / DESCRIPTION,VALUE / REMARK\n";
    csv += `EST,(${totalExpenditure} - ${totalSource}) / ${numberOfBoarders} = ${est.toFixed(2)}\n`;
    csv += `TOTAL NUMBER OF BOARDERS,${numberOfBoarders}\n`;
    csv += `NUMBER OF STAFF (IN MESS BILL),0\n`;
    csv += `RICE + POTATO DUE,0\n`;
    csv += `GROCERY DUE,0\n`;
    csv += `EGG DUE,0\n`;
    csv += `OTHER DUE,0\n`;
    csv += "\n";

    // Table 3: Room-wise Billing Details
    csv += "ROOM NO.,MEAL COUNT,MEAL * 30,EST,GUEST MEAL (C) *50,GUEST MEAL (N) *40,Previous Month Due (+/-),Total Deposit,Final Due (+/-)\n";
    boarderBillingData.forEach((data) => {
      csv += `${data.roomNumber},${data.mealCount},${data.mealCost},${est.toFixed(2)},0,0,0,${data.totalDeposit},${data.finalDue.toFixed(2)}\n`;
    });

    return csv;
  } catch (error: any) {
    console.error("Generate monthly billing CSV error:", error);
    throw new Error(error.message || "Failed to generate billing CSV");
  }
}

