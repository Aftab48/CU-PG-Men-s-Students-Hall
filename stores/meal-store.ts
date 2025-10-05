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
        set((state) => ({
          meals: {
            ...state.meals,
            [date]: {
              ...state.meals[date],
              brunch: state.meals[date]?.brunch || false,
              dinner: state.meals[date]?.dinner || false,
              [mealType]: !state.meals[date]?.[mealType],
            },
          },
        }));
      },
      skipMeals: (
        startDate: string,
        endDate: string,
        mealTypes: (keyof DayMeals)[]
      ) => {
        set((state) => {
          const newMeals = { ...state.meals };
          const start = new Date(startDate);
          const end = new Date(endDate);

          for (
            let date = new Date(start);
            date <= end;
            date.setDate(date.getDate() + 1)
          ) {
            const dateStr = date.toISOString().split("T")[0];
            if (!newMeals[dateStr]) {
              newMeals[dateStr] = {
                brunch: false,
                dinner: false,
              };
            }

            mealTypes.forEach((mealType) => {
              newMeals[dateStr][mealType] = false;
            });
          }

          return { meals: newMeals };
        });
      },
      setMealStatus: (
        date: string,
        mealType: keyof DayMeals,
        status: boolean
      ) => {
        set((state) => ({
          meals: {
            ...state.meals,
            [date]: {
              ...state.meals[date],
              brunch: state.meals[date]?.brunch || false,
              dinner: state.meals[date]?.dinner || false,
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
