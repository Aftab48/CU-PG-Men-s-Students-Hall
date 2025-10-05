import { Expense } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ExpenseState {
  expenses: Expense[];
  addExpense: (expense: Expense) => void;
  removeExpense: (id: string) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set) => ({
      expenses: [],
      addExpense: (expense: Expense) => {
        set((state) => ({
          expenses: [...state.expenses, expense],
        }));
      },
      removeExpense: (id: string) => {
        set((state) => ({
          expenses: state.expenses.filter((expense) => expense.id !== id),
        }));
      },
      updateExpense: (id: string, updatedExpense: Partial<Expense>) => {
        set((state) => ({
          expenses: state.expenses.map((expense) =>
            expense.id === id ? { ...expense, ...updatedExpense } : expense
          ),
        }));
      },
    }),
    {
      name: "expense-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
