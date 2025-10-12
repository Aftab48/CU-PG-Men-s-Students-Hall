export interface BoarderSignupData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  roomNum?: string;
  advance?: number;
}

export interface BoarderProfile {
  $id: string;
  userId: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  roomNumber?: string;
  advance: number;
  current: number;
  isActive: boolean;
  mealPreference: "veg" | "non-veg" | "egg" | "fish";
  avatarUrl: URL;
}

export interface ManagerProfile {
  $id: string;
  userId: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export interface ManagerLoginData {
  email: string;
  password: string;
}

export interface AuthUser {
  $id: string;
  email: string;
  name: string;
  role: "manager" | "boarder";
  profile: any;
}

export interface User {
  id: string;
  email: string;
  role: "manager" | "boarder";
  name: string;
}

export interface Expense {
  id: string; // maps to $id
  date: string; // ISO string (e.g., 2025-10-07T00:00:00.000+00:00)
  category:
    | "fish"
    | "chicken"
    | "paneer"
    | "veg"
    | "gas"
    | "grocery"
    | "eggs"
    | "rice/potato"
    | "misc"
    | "grand"
    | "prev"
    | "staff";
  amount: number;
  description: string;
  receipt?: string;
  createdAt: string; // maps to $createdAt
}

export interface DayMeals {
  brunch: boolean;
  dinner: boolean;
}

type MealPreference = "veg" | "non-veg" | "egg" | "fish";

type MealStats = {
  [key in MealPreference]: {
    count: number;
    boarders: string[];
  };
};

type Stats = {
  brunch: MealStats;
  dinner: MealStats;
};