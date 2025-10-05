export interface BoarderSignupData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  roomNumber?: string;
  advancePayment?: number;
}

export interface BoarderProfile {
  $id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  roomNumber?: string;
  advancePayment: number;
  currentBalance: number;
  joinedAt: string;
  isActive: boolean;
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
  id: string;
  date: string;
  category: "groceries" | "other";
  amount: number;
  description: string;
  receipt?: string;
  createdAt: string;
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