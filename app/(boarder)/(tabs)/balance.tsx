// app/(boarder)/(tabs)/balance.tsx

import { useMealStore } from "@/stores/meal-store";
import { LinearGradient } from "expo-linear-gradient";
import {
  Calendar,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react-native";
import React, { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";

// Reusable Row Component
const Row = ({
  label,
  value,
  isNegative = false,
}: {
  label: string;
  value: string | number;
  isNegative?: boolean;
}) => (
  <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
    <Text className="text-sm text-gray-600">{label}</Text>
    <Text
      className={`text-sm font-medium ${isNegative ? "text-red-600" : "text-gray-800"}`}
    >
      {value}
    </Text>
  </View>
);

// Reusable Summary Card
const SummaryCard = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
}) => (
  <View className="flex-1 bg-white rounded-xl p-4 items-center shadow-sm">
    <Icon size={24} color={color} />
    <Text className="text-xs text-gray-600 text-center mt-2 mb-1">{label}</Text>
    <Text className="text-lg font-bold text-gray-800">{value}</Text>
  </View>
);

export default function BalanceScreen() {
  const { meals } = useMealStore();

  const balanceData = useMemo(() => {
    const advancePayment = 15000; // fallback value
    const mealRate = 150; // fallback per meal

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalMealsConsumed = 0;

    if (meals && Object.keys(meals).length > 0) {
      Object.entries(meals).forEach(([date, dayMeals]: any) => {
        const mealDate = new Date(date);
        if (mealDate >= startOfMonth && mealDate <= now) {
          if (dayMeals.brunch) totalMealsConsumed++;
          if (dayMeals.dinner) totalMealsConsumed++;
        }
      });
    }

    const totalMealCost = totalMealsConsumed * mealRate;
    const remainingBalance = advancePayment - totalMealCost;
    const isOwed = remainingBalance < 0;

    return {
      advancePayment,
      totalMealsConsumed,
      totalMealCost,
      remainingBalance: Math.abs(remainingBalance),
      isOwed,
      mealRate,
    };
  }, [meals]);

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <LinearGradient colors={["#059669", "#10b981"]} className="p-6 pt-15">
        <Text className="text-2xl font-bold text-white">Balance Tracker</Text>
        <Text className="text-base text-slate-200 mt-1">
          Monitor your monthly balance
        </Text>
      </LinearGradient>

      <View className="p-4">
        {/* Main Balance Card */}
        <View className="bg-white rounded-3xl p-6 mb-5 items-center shadow-xl">
          <View className="items-center mb-3">
            <Wallet
              size={32}
              color={balanceData.isOwed ? "#dc2626" : "#059669"}
            />
            <Text className="text-base text-gray-600 mt-2">
              {balanceData.isOwed ? "Amount Owed" : "Remaining Balance"}
            </Text>
          </View>
          <Text
            className={`text-4xl font-bold mb-3 ${balanceData.isOwed ? "text-red-600" : "text-emerald-600"}`}
          >
            ₹{balanceData.remainingBalance.toLocaleString()}
          </Text>
          <View className="flex-row items-center gap-2">
            {balanceData.isOwed ? (
              <TrendingDown size={20} color="#dc2626" />
            ) : (
              <TrendingUp size={20} color="#059669" />
            )}
            <Text
              className={`text-sm font-medium ${balanceData.isOwed ? "text-red-600" : "text-emerald-600"}`}
            >
              {balanceData.isOwed ? "You owe money" : "Money remaining"}
            </Text>
          </View>
        </View>

        {/* Summary Cards */}
        <View className="flex-row gap-3 mb-5">
          <SummaryCard
            icon={DollarSign}
            label="Advance Payment"
            value={`₹${balanceData.advancePayment.toLocaleString()}`}
            color="#1e40af"
          />
          <SummaryCard
            icon={Calendar}
            label="Meals Consumed"
            value={balanceData.totalMealsConsumed}
            color="#ea580c"
          />
        </View>

        {/* Breakdown Section */}
        <View className="bg-white rounded-2xl p-5 mb-5 shadow-lg">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Monthly Breakdown
          </Text>

          <Row
            label="Starting Balance"
            value={`₹${balanceData.advancePayment.toLocaleString()}`}
          />
          <Row
            label="Meal Rate (per meal)"
            value={`₹${balanceData.mealRate}`}
          />
          <Row
            label="Total Meals"
            value={`${balanceData.totalMealsConsumed} meals`}
          />
          <Row
            label="Total Meal Cost"
            value={`-₹${balanceData.totalMealCost.toLocaleString()}`}
            isNegative
          />

          <View className="flex-row justify-between items-center pt-4 mt-2 border-t-2 border-gray-200">
            <Text className="text-base font-semibold text-gray-800">
              {balanceData.isOwed ? "Amount Owed" : "Remaining Balance"}
            </Text>
            <Text
              className={`text-lg font-bold ${balanceData.isOwed ? "text-red-600" : "text-emerald-600"}`}
            >
              {balanceData.isOwed ? "-" : ""}₹
              {balanceData.remainingBalance.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Status Message */}
        <View
          className={`rounded-xl p-4 ${balanceData.isOwed ? "bg-red-50 border border-red-200" : "bg-emerald-50 border border-emerald-200"}`}
        >
          <Text
            className={`text-sm text-center leading-5 ${balanceData.isOwed ? "text-red-600" : "text-emerald-600"}`}
          >
            {balanceData.isOwed
              ? `You need to pay ₹${balanceData.remainingBalance.toLocaleString()} at the end of the month.`
              : `You have ₹${balanceData.remainingBalance.toLocaleString()} remaining for this month.`}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
