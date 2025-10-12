// app/(manager)/(tabs)/meals.tsx

import { getMealCountStats } from "@/lib/actions";
import { useAuthStore } from "@/stores/auth-store";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { BarChart3, Clock, LogOut } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

function MealCount() {
  const [mealStats, setMealStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  useEffect(() => {
    loadMealStats();
  }, []);

  const loadMealStats = async () => {
    setLoading(true);
    try {
      // Use local date instead of UTC
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const result = await getMealCountStats(today);

      if (result.success) {
        setMealStats({
          brunch: result.stats?.brunch || {},
          dinner: result.stats?.dinner || {},
        });
      } else {
        Alert.alert("Error", result.error || "Failed to load meal statistics");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load meal statistics");
    } finally {
      setLoading(false);
    }
  };

  const renderMealType = (mealType: "brunch" | "dinner") => {
    const colorMap = { brunch: "#3B82F6", dinner: "#1E3A8A" };
    const bgMap = { brunch: "bg-blue-50", dinner: "bg-blue-100" };
    const data = mealStats[mealType] || {};

    return (
      <View key={mealType} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-5 shadow-lg">
        <View className="flex-row items-center mb-3 sm:mb-4">
          <View
            className={`w-9 h-9 sm:w-10 sm:h-10 ${
              mealType === "brunch" ? "bg-blue-100" : "bg-blue-200"
            } rounded-full items-center justify-center mr-2.5 sm:mr-3`}
          >
            <Clock size={18} color={colorMap[mealType]} />
          </View>
          <Text className="text-base sm:text-lg md:text-xl font-semibold text-dark-100">
            {mealType.charAt(0).toUpperCase() + mealType.slice(1)} Count
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-2.5 sm:gap-3 mb-3 sm:mb-4">
          {Object.entries(data).map(([pref, stats]: [string, any]) => (
            <View
              key={pref}
              className={`${bgMap[mealType]} rounded-lg p-2.5 sm:p-3 flex-1 min-w-[75px] sm:min-w-20`}
            >
              <Text
                className={`text-[10px] sm:text-xs font-medium ${
                  mealType === "brunch" ? "text-primary" : "text-navy"
                } uppercase mb-0.5 sm:mb-1`}
              >
                {pref.replace("-", " ")}
              </Text>
              <Text
                className={`text-lg sm:text-xl md:text-2xl font-bold ${
                  mealType === "brunch" ? "text-primary" : "text-navy"
                }`}
              >
                {stats.count || 0}
              </Text>
            </View>
          ))}
        </View>

        <View className="border-t border-gray-200 pt-3 sm:pt-4">
          <Text className="text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">
            Boarders taking {mealType}:
          </Text>
          {Object.entries(data).map(([pref, stats]: [string, any]) =>
            stats.count > 0 ? (
              <View key={pref} className="mb-1.5 sm:mb-2">
                <Text className="text-[10px] sm:text-xs font-medium text-gray-600 uppercase mb-0.5 sm:mb-1">
                  {pref.replace("-", " ")} ({stats.count})
                </Text>
                <Text className="text-xs sm:text-sm md:text-base text-gray-800">
                  {stats.boarders?.join(", ") || "None"}
                </Text>
              </View>
            ) : null
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-white-100"
      keyboardShouldPersistTaps="handled"
    >
      <LinearGradient colors={["#1E3A8A", "#3B82F6"]} className="px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 pt-12 sm:pt-14 md:pt-15">
        <View className="flex-row justify-between items-start mb-3 sm:mb-4">
          <View className="flex-1">
            <Text className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Live Meal Count</Text>
            <Text className="text-sm sm:text-base md:text-lg text-white/80 mt-0.5 sm:mt-1">
              Track today&apos;s meals
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-white/20 rounded-full p-2.5 sm:p-3 md:p-3.5"
          >
            <LogOut size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View className="px-3 py-3 sm:px-4 sm:py-4 md:px-5 md:py-5">
        {loading ? (
          <View className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-7 md:p-8 shadow-lg items-center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-sm sm:text-base text-gray-100 mt-3 sm:mt-4">
              Loading meal statistics...
            </Text>
          </View>
        ) : mealStats ? (
          <>
            {renderMealType("brunch")}
            {renderMealType("dinner")}
          </>
        ) : (
          <View className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-7 md:p-8 shadow-lg items-center">
            <BarChart3 size={40} color="#6b7280" />
            <Text className="text-sm sm:text-base text-gray-100 mt-3 sm:mt-4 text-center">
              No meal data available for today
            </Text>
            <TouchableOpacity
              className="mt-3 sm:mt-4 bg-primary px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg"
              onPress={loadMealStats}
            >
              <Text className="text-sm sm:text-base text-white font-medium">Refresh</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

export default MealCount;