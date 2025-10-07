// app/(boarder)/(tabs)/balance.tsx

import { countCurrentMonthMealsForBoarder, getBoarderProfile, persistMealsCountIfSupported } from "@/lib/actions";
import { useAuthStore } from "@/stores/auth-store";
import { LinearGradient } from "expo-linear-gradient";
import {
  Calendar,
  TrendingUp,
  Wallet
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";

// Reusable Row Component
export const Row = ({
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

function BalanceScreen() {
  const { user } = useAuthStore();
  const [boarderProfile, setBoarderProfile] = useState<any>(null);
  const [monthlyMealsCount, setMonthlyMealsCount] = useState<number>(0);

  useEffect(() => {
      if (user) {
        loadBoarderProfile();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const loadBoarderProfile = async () => {
        if (!user) return;
    
        try {
          const profile = await getBoarderProfile(user.id);
          setBoarderProfile(profile ?? null);
          if (profile?.$id) {
            const mealsCountRes = await countCurrentMonthMealsForBoarder(profile.userId || user.id);
            if (mealsCountRes.success) {
              setMonthlyMealsCount(mealsCountRes.count);
              // best-effort persist to profile if supported
              await persistMealsCountIfSupported(profile.$id, mealsCountRes.count);
            } else {
              setMonthlyMealsCount(0);
            }
          }
        } catch (error) {
          console.error("Failed to load boarder profile:", error);
        }
      };
    

  const balanceData = useMemo(() => {
    if (!boarderProfile) return {
      advancePayment: 0,
      totalMealsConsumed: 0,
    };

    const advancePayment = boarderProfile.advance || 0;
    const totalMealsConsumed = monthlyMealsCount || 0;

    return {
      advancePayment,
      totalMealsConsumed,
    };
  }, [boarderProfile, monthlyMealsCount]);

  if (!boarderProfile) {
    return (
      <ScrollView className="flex-1 bg-slate-50">
        <LinearGradient colors={["#059669", "#10b981"]} className="p-6 pt-15">
          <Text className="text-2xl font-bold text-white">
            Loading balance...
          </Text>
        </LinearGradient>
      </ScrollView>
    );
  }


  return (
    <ScrollView className="flex-1 bg-slate-50">
      <LinearGradient colors={["#059669", "#10b981"]} className="p-6 pt-15">
        <Text className="text-2xl font-bold justify-center items-center text-white">
          Welcome <Text className="text-emerald-200">{boarderProfile?.name}</Text>
        </Text>
        <Text className="text-2xl font-bold text-white">Monthly Overview</Text>
        <Text className="text-base text-slate-200 mt-1">
          View your advance payment and meals consumed
        </Text>
      </LinearGradient>

      <View className="p-4">
        {/* Advance Payment Card */}
        <View className="bg-white rounded-3xl p-6 mb-5 items-center shadow-xl">
          <View className="items-center mb-3">
            <Wallet size={32} color="#059669" />
            <Text className="text-base text-gray-600 mt-2">
              Monthly Advance Payment
            </Text>
          </View>
          <Text className="text-4xl font-bold mb-3 text-emerald-600">
            ₹{balanceData.advancePayment.toLocaleString()}
          </Text>
          <View className="flex-row items-center gap-2">
            <TrendingUp size={20} color="#059669" />
            <Text className="text-sm font-medium text-emerald-600">
              Paid in advance
            </Text>
          </View>
        </View>

        {/* Summary Cards */}
        <View className="flex-row gap-3 mb-5">
          <SummaryCard
            icon={Calendar}
            label="Meals Consumed"
            value={balanceData.totalMealsConsumed}
            color="#ea580c"
          />
        </View>

        {/* Status Message */}
        <View className="rounded-xl p-4 bg-emerald-50 border border-emerald-200">
          <Text className="text-sm text-center leading-5 text-emerald-600">
            This month you have consumed {balanceData.totalMealsConsumed} meals with an advance payment of ₹{balanceData.advancePayment.toLocaleString()}.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

export default BalanceScreen;