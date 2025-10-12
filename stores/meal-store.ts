import { DayMeals } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface MealState {
  meals: Record<string, DayMeals>;
  toggleMeal: (date: string, mealType: keyof DayMeals) => void;
  skipMeals: (
    startDate: string,
    endDate: string,
    mealTypes: (keyof DayMeals)[]
  ) => void;
  setMealStatus: (
    date: string,
    mealType: keyof DayMeals,
    status: boolean
  ) => void;
}

export const useMealStore = create<MealState>()(
  persist(
    (set) => ({
      meals: {},

      toggleMeal: (date: string, mealType: keyof DayMeals) => {
        const dateKey = date.slice(0, 10); // normalize date format
        set((state) => ({
          meals: {
            ...state.meals,
            [dateKey]: {
              brunch: state.meals[dateKey]?.brunch || false,
              dinner: state.meals[dateKey]?.dinner || false,
              [mealType]: !state.meals[dateKey]?.[mealType],
            },
          },
        }));
      },

      skipMeals: (startDate, endDate, mealTypes) => {
        set((state) => {
          const newMeals = { ...state.meals };
          const start = new Date(startDate);
          const end = new Date(endDate);

          for (
            let date = new Date(start);
            date <= end;
            date.setDate(date.getDate() + 1)
          ) {
            // Use local date instead of UTC
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            const dateStr = `${year}-${month}-${day}`;
            newMeals[dateStr] ??= { brunch: false, dinner: false };
            mealTypes.forEach((t) => (newMeals[dateStr][t] = false));
          }

          return { meals: newMeals };
        });
      },

      setMealStatus: (date, mealType, status) => {
        const dateKey = date.slice(0, 10);
        set((state) => ({
          meals: {
            ...state.meals,
            [dateKey]: {
              brunch: state.meals[dateKey]?.brunch || false,
              dinner: state.meals[dateKey]?.dinner || false,
              [mealType]: status,
            },
          },
        }));
      },
    }),
    {
      name: "meal-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
