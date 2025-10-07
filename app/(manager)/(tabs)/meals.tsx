// app/(manager)/(tabs)/meals.tsx

import { getMealCountStats } from "@/lib/actions";
import { LinearGradient } from "expo-linear-gradient";
import { BarChart3, Clock } from "lucide-react-native";
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

  useEffect(() => {
    loadMealStats();
  }, []);

  const loadMealStats = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
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
    const colorMap = { brunch: "#ea580c", dinner: "#7c3aed" };
    const bgMap = { brunch: "bg-orange-50", dinner: "bg-purple-50" };
    const data = mealStats[mealType] || {};

    return (
      <View key={mealType} className="bg-white rounded-2xl p-5 mb-5 shadow-lg">
        <View className="flex-row items-center mb-4">
          <View
            className={`w-10 h-10 ${
              mealType === "brunch" ? "bg-orange-100" : "bg-purple-100"
            } rounded-full items-center justify-center mr-3`}
          >
            <Clock size={20} color={colorMap[mealType]} />
          </View>
          <Text className="text-lg font-semibold text-gray-800">
            {mealType.charAt(0).toUpperCase() + mealType.slice(1)} Count
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-3 mb-4">
          {Object.entries(data).map(([pref, stats]: [string, any]) => (
            <View
              key={pref}
              className={`${bgMap[mealType]} rounded-lg p-3 flex-1 min-w-20`}
            >
              <Text
                className={`text-xs font-medium ${
                  mealType === "brunch" ? "text-orange-600" : "text-purple-600"
                } uppercase mb-1`}
              >
                {pref.replace("-", " ")}
              </Text>
              <Text
                className={`text-xl font-bold ${
                  mealType === "brunch" ? "text-orange-700" : "text-purple-700"
                }`}
              >
                {stats.count || 0}
              </Text>
            </View>
          ))}
        </View>

        <View className="border-t border-gray-200 pt-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Boarders taking {mealType}:
          </Text>
          {Object.entries(data).map(([pref, stats]: [string, any]) =>
            stats.count > 0 ? (
              <View key={pref} className="mb-2">
                <Text className="text-xs font-medium text-gray-600 uppercase mb-1">
                  {pref.replace("-", " ")} ({stats.count})
                </Text>
                <Text className="text-sm text-gray-800">
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
      className="flex-1 bg-slate-50"
      keyboardShouldPersistTaps="handled"
    >
      <LinearGradient colors={["#7c3aed", "#c084fc"]} className="p-6 pt-15">
        <Text className="text-2xl font-bold text-white">Live Meal Count</Text>
        <Text className="text-base text-slate-200 mt-1">
          Track today&apos;s meals
        </Text>
      </LinearGradient>

      <View className="p-4">
        {loading ? (
          <View className="bg-white rounded-2xl p-8 shadow-lg items-center">
            <ActivityIndicator size="large" color="#1e40af" />
            <Text className="text-gray-600 mt-4">
              Loading meal statistics...
            </Text>
          </View>
        ) : mealStats ? (
          <>
            {renderMealType("brunch")}
            {renderMealType("dinner")}
          </>
        ) : (
          <View className="bg-white rounded-2xl p-8 shadow-lg items-center">
            <BarChart3 size={48} color="#6b7280" />
            <Text className="text-gray-600 mt-4 text-center">
              No meal data available for today
            </Text>
            <TouchableOpacity
              className="mt-4 bg-blue-600 px-6 py-3 rounded-lg"
              onPress={loadMealStats}
            >
              <Text className="text-white font-medium">Refresh</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

export default MealCount;