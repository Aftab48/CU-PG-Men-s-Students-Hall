// app/(boarder)/(tabs)/balance.tsx

import { countCurrentMonthMealsForBoarder, getBoarderProfile, persistMealsCountIfSupported } from "@/lib/actions";
import { useAuthStore } from "@/stores/auth-store";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
    Calendar,
    LogOut,
    RefreshCcw,
    TrendingUp,
    Wallet
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

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
  <View className="flex-row justify-between items-center py-2.5 sm:py-3 md:py-4 border-b border-gray-100">
    <Text className="text-xs sm:text-sm md:text-base text-gray-100">{label}</Text>
    <Text
      className={`text-xs sm:text-sm md:text-base font-medium ${isNegative ? "text-red-600" : "text-dark-100"}`}
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
  <View className="flex-1 bg-white rounded-xl p-3 sm:p-4 md:p-5 items-center shadow-sm">
    <Icon size={24} color={color} />
    <Text className="text-xs sm:text-sm text-gray-100 text-center mt-1.5 sm:mt-2 mb-0.5 sm:mb-1">{label}</Text>
    <Text className="text-base sm:text-lg md:text-xl font-bold text-dark-100">{value}</Text>
  </View>
);

function BalanceScreen() {
  const { user, logout } = useAuthStore();
  const [boarderProfile, setBoarderProfile] = useState<any>(null);
  const [monthlyMealsCount, setMonthlyMealsCount] = useState<number>(0);

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  const handleRefresh = () => {
    loadBoarderProfile(true); // Force refresh on button click
  };

  useEffect(() => {
      if (user) {
        loadBoarderProfile(false); // Use cache on initial load
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const loadBoarderProfile = async (forceRefresh: boolean = false) => {
        if (!user) return;
    
        try {
          const profile = await getBoarderProfile(user.id, forceRefresh);
          setBoarderProfile(profile ?? null);
          if (profile?.$id) {
            const mealsCountRes = await countCurrentMonthMealsForBoarder(profile.userId || user.id, forceRefresh);
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
      <ScrollView className="flex-1 bg-white-100">
        <LinearGradient colors={["#1E3A8A", "#3B82F6"]} className="px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 pt-12 sm:pt-14 md:pt-15">
          <Text className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
            Loading balance...
          </Text>
        </LinearGradient>
      </ScrollView>
    );
  }


  return (
    <ScrollView className="flex-1 bg-white-100">
      <LinearGradient colors={["#1E3A8A", "#3B82F6"]} className="px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 pt-12 sm:pt-14 md:pt-15">
        <View className="flex-row justify-between items-start mb-3 sm:mb-4">
          <View className="flex-1">
            <Text className="text-xl sm:text-2xl md:text-3xl font-bold justify-center items-center text-white">
              Welcome <Text className="text-blue-200">{boarderProfile?.name}</Text>
            </Text>
            <Text className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Monthly Overview</Text>
            <Text className="text-sm sm:text-base md:text-lg text-white/80 mt-0.5 sm:mt-1">
              View your advance payment and meals consumed
            </Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleRefresh}
              className="bg-white/20 rounded-full p-2.5 sm:p-3 md:p-3.5"
            >
              <RefreshCcw size={20} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              className="bg-white/20 rounded-full p-2.5 sm:p-3 md:p-3.5"
            >
              <LogOut size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <View className="px-3 py-3 sm:px-4 sm:py-4 md:px-5 md:py-5">
        {/* Advance Payment Card */}
        <View className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 items-center shadow-xl">
          <View className="items-center mb-2 sm:mb-3">
            <Wallet size={28} color="#3B82F6" />
            <Text className="text-sm sm:text-base md:text-lg text-gray-100 mt-1.5 sm:mt-2">
              Monthly Advance Payment
            </Text>
          </View>
          <Text className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3 text-primary">
            ₹{balanceData.advancePayment.toLocaleString()}
          </Text>
          <View className="flex-row items-center gap-1.5 sm:gap-2">
            <TrendingUp size={18} color="#3B82F6" />
            <Text className="text-xs sm:text-sm md:text-base font-medium text-primary">
              Paid in advance
            </Text>
          </View>
        </View>

        {/* Summary Cards */}
        <View className="flex-row gap-2.5 sm:gap-3 md:gap-4 mb-4 sm:mb-5">
          <SummaryCard
            icon={Calendar}
            label="Meals Consumed"
            value={balanceData.totalMealsConsumed}
            color="#3B82F6"
          />
        </View>

        {/* Status Message */}
        <View className="rounded-xl p-3 sm:p-4 md:p-5 bg-blue-50 border border-blue-200">
          <Text className="text-xs sm:text-sm md:text-base text-center leading-4 sm:leading-5 md:leading-6 text-primary">
            This month you have consumed {balanceData.totalMealsConsumed} meals with an advance payment of ₹{balanceData.advancePayment.toLocaleString()}.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

export default BalanceScreen;