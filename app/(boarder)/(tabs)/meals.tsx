// app/(boarder)/(tabs)/meals.tsx

import {
  getBoarderProfile,
  getOrCreateMealRecord,
  toggleMealStatus,
  updateBoarderMealPreference,
} from "@/lib/actions";
import { useAuthStore } from "@/stores/auth-store";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Calendar, Clock, Coffee, Moon, Sun, User } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function BoarderMealTracker() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [activeTab, setActiveTab] = useState<"meals" | "preferences">("meals");
  const [loading, setLoading] = useState(false);
  const [mealRecord, setMealRecord] = useState<any>(null);
  const [boarderProfile, setBoarderProfile] = useState<any>(null);
  const [mealPreference, setMealPreference] = useState<
    "veg" | "non-veg" | "egg" | "fish"
  >("veg");

  const { user } = useAuthStore();


  useEffect(() => {
    if (user) {
      loadMealRecord();
      loadBoarderProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedDate]);

  const loadMealRecord = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const brunchRecord = await getOrCreateMealRecord(
        user.id,
        selectedDate,
        "brunch"
      );
      const dinnerRecord = await getOrCreateMealRecord(
        user.id,
        selectedDate,
        "dinner"
      );

      setMealRecord({
        brunch: brunchRecord?.status === "ON",
        dinner: dinnerRecord?.status === "ON",
      });
    } catch (error) {
      console.error("Failed to load meal record:", error);
      setMealRecord({ brunch: false, dinner: false });
    } finally {
      setLoading(false);
    }
  };

  const loadBoarderProfile = async () => {
    if (!user) return;

    try {
      const profile = await getBoarderProfile(user.id);
      setBoarderProfile(profile ?? null);
      if (profile?.mealPreference) {
        setMealPreference(profile.mealPreference);
      }
    } catch (error) {
      console.error("Failed to load boarder profile:", error);
    }
  };

  const todayMeals = {
    brunch: mealRecord?.brunch ?? false,
    dinner: mealRecord?.dinner ?? false,
  };

  const handleMealToggle = async (
    mealType: "brunch" | "dinner",
    date: string = selectedDate
  ) => {
    if (!user) return;

    setLoading(true);
    try {
      // Get the meal record for the given date
      const mealRecordForDate = await getOrCreateMealRecord(
        user.id,
        date,
        mealType
      );
      if (!mealRecordForDate) throw new Error("Failed to get meal record");

      // Determine new status
      const newStatus = mealRecordForDate.status === "ON" ? "OFF" : "ON";

      // Toggle status in backend
      const result = await toggleMealStatus(user.id, date, mealType, newStatus);

      if (result.success) {
        // Reload today’s meals only if the toggled date is today
        if (date === selectedDate) await loadMealRecord();
      } else {
        Alert.alert("Error", result.error || "Failed to update meal status");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update meal status");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMealPreference = async (
    newPreference: "veg" | "non-veg" | "egg" | "fish"
  ) => {
    if (!boarderProfile) return;

    setLoading(true);
    try {
      const result = await updateBoarderMealPreference(
        boarderProfile.$id,
        newPreference
      );

      if (result.success) {
        setMealPreference(newPreference);
        Alert.alert("Success", "Meal preference updated successfully");
      } else {
        Alert.alert(
          "Error",
          result.error || "Failed to update meal preference"
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update meal preference");
    } finally {
      setLoading(false);
    }
  };

  const mealOptions = [
    {
      id: "brunch",
      name: "Brunch",
      icon: Sun,
      time: "11:00 AM",
      active: todayMeals.brunch,
    },
    {
      id: "dinner",
      name: "Dinner",
      icon: Moon,
      time: "8:00 PM",
      active: todayMeals.dinner,
    },
  ];

  const renderMealsTab = () => (
    <>
      {/* Date Selector */}
      <View className="flex-row items-center bg-white rounded-xl p-4 mb-5 gap-3 shadow-sm">
        <Calendar size={20} color="#059669" />
        <Text className="text-base font-medium text-gray-800">
          {selectedDate}
        </Text>
      </View>

      {/* Meal Options */}
      <View className="bg-white rounded-2xl p-5 mb-5 shadow-lg">
        <Text className="text-lg font-semibold text-gray-800 mb-4">
          Today&apos;s Meals
        </Text>

        {mealRecord ? (
          mealOptions.map((meal) => {
            const IconComponent = meal.icon;
            return (
              <TouchableOpacity
                key={meal.id}
                className={`flex-row items-center justify-between py-4 px-3 rounded-xl mb-3 border-2 ${
                  meal.active
                    ? "bg-emerald-50 border-emerald-600"
                    : "border-gray-100"
                }`}
                onPress={() => handleMealToggle(meal.id as "brunch" | "dinner")}
                disabled={loading}
              >
                <View className="flex-row items-center flex-1">
                  <View
                    className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${
                      meal.active ? "bg-emerald-600" : "bg-emerald-50"
                    }`}
                  >
                    <IconComponent
                      size={24}
                      color={meal.active ? "#ffffff" : "#059669"}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-base font-medium mb-1 ${
                        meal.active ? "text-emerald-600" : "text-gray-800"
                      }`}
                    >
                      {meal.name}
                    </Text>
                    <View className="flex-row items-center gap-1">
                      <Clock size={14} color="#6b7280" />
                      <Text className="text-sm text-gray-600">{meal.time}</Text>
                    </View>
                  </View>
                </View>
                <View
                  className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                    meal.active
                      ? "bg-emerald-600 border-emerald-600"
                      : "border-gray-300"
                  }`}
                >
                  {meal.active && (
                    <Text className="text-white text-sm font-bold">✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View className="items-center py-6">
            <ActivityIndicator size="small" color="#059669" />
            <Text className="text-sm text-gray-600 mt-2">Loading meals...</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View className="bg-white rounded-2xl p-5 shadow-lg">
        <Text className="text-lg font-semibold text-gray-800 mb-4">
          Quick Actions
        </Text>

        {/* Toggle Tonight's Dinner */}
        <TouchableOpacity
          className="flex-row items-center py-4 px-4 rounded-xl bg-orange-50 mb-3 gap-3"
          onPress={() => handleMealToggle("dinner")}
          disabled={loading || !mealRecord}
        >
          <Moon size={20} color="#ea580c" />
          <Text className="text-base font-medium text-orange-600">
            {todayMeals.dinner
              ? "Skip Tonight's Dinner"
              : "Turn On Tonight's Dinner"}
          </Text>
        </TouchableOpacity>

        {/* Toggle Tomorrow's Brunch */}
        <TouchableOpacity
          className="flex-row items-center py-4 px-4 rounded-xl bg-orange-50 mb-3 gap-3"
          onPress={async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split("T")[0];

            // Fetch tomorrow’s brunch record to check its status
            const brunchRecord = await getOrCreateMealRecord(
              user!.id,
              tomorrowStr,
              "brunch"
            );
            if (!brunchRecord) return;

            const newStatus = brunchRecord.status === "ON" ? "OFF" : "ON";
            await handleMealToggle("brunch", tomorrowStr);

            // Optionally reload if you want to reflect it right away
            if (newStatus === "ON") {
              Alert.alert("Brunch turned ON for tomorrow!");
            } else {
              Alert.alert("Brunch turned OFF for tomorrow!");
            }
          }}
          disabled={loading || !mealRecord}
        >
          <Coffee size={20} color="#ea580c" />
          <Text className="text-base font-medium text-orange-600">
            {/** This label changes based on tomorrow’s brunch status dynamically after toggle */}
            Skip / Turn On Tomorrow&apos;s Brunch
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center py-4 px-4 rounded-xl bg-orange-50 gap-3"
          onPress={() => router.push("/(boarder)/skip-range")}
        >
          <Calendar size={20} color="#ea580c" />
          <Text className="text-base font-medium text-orange-600">
            Skip Date Range
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderPreferencesTab = () => (
    <View className="bg-white rounded-2xl p-5 shadow-lg">
      <Text className="text-lg font-semibold text-gray-800 mb-4">
        Meal Preference
      </Text>
      <Text className="text-sm text-gray-600 mb-6">
        Select your preferred meal type. This helps the kitchen prepare the
        right food for you.
      </Text>

      <View className="gap-3">
        {(["veg", "non-veg", "egg", "fish"] as const).map((pref) => (
          <TouchableOpacity
            key={pref}
            className={`flex-row items-center justify-between py-4 px-4 rounded-xl border-2 ${
              mealPreference === pref
                ? "bg-emerald-50 border-emerald-600"
                : "border-gray-200"
            }`}
            onPress={() => handleUpdateMealPreference(pref)}
            disabled={loading || !boarderProfile}
          >
            <View className="flex-row items-center">
              <View
                className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                  mealPreference === pref ? "bg-emerald-600" : "bg-gray-100"
                }`}
              >
                <User
                  size={20}
                  color={mealPreference === pref ? "#ffffff" : "#6b7280"}
                />
              </View>
              <Text
                className={`text-base font-medium ${
                  mealPreference === pref ? "text-emerald-600" : "text-gray-800"
                }`}
              >
                {pref.charAt(0).toUpperCase() + pref.slice(1).replace("-", " ")}
              </Text>
            </View>
            <View
              className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                mealPreference === pref
                  ? "bg-emerald-600 border-emerald-600"
                  : "border-gray-300"
              }`}
            >
              {mealPreference === pref && (
                <Text className="text-white text-xs font-bold">✓</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {boarderProfile && (
        <View className="mt-6 p-4 bg-gray-50 rounded-xl">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Current Preference
          </Text>
          <Text className="text-base text-emerald-600 font-semibold">
            {mealPreference.charAt(0).toUpperCase() +
              mealPreference.slice(1).replace("-", " ")}
          </Text>
        </View>
      )}

      {!boarderProfile && (
        <View className="items-center py-6">
          <ActivityIndicator size="small" color="#059669" />
          <Text className="text-sm text-gray-600 mt-2">Loading profile...</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <LinearGradient colors={["#059669", "#10b981"]} className="p-6 pt-15">
        <Text className="text-2xl font-bold justify-center items-center text-white">
          Welcome <Text className="text-emerald-200">{boarderProfile?.name}</Text>
        </Text>
        <Text className="text-2xl font-bold text-white">Food Dashboard</Text>
        <Text className="text-base text-slate-200 mt-1">
          Manage your meals and preferences
        </Text>

        {/* Tab Navigation */}
        <View className="flex-row mt-6 bg-white/20 rounded-xl p-1">
          <TouchableOpacity
            className={`flex-1 py-3 px-4 rounded-lg items-center ${
              activeTab === "meals" ? "bg-white" : ""
            }`}
            onPress={() => setActiveTab("meals")}
          >
            <Text
              className={`text-sm font-medium ${
                activeTab === "meals" ? "text-emerald-600" : "text-white"
              }`}
            >
              Daily Meals
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-3 px-4 rounded-lg items-center ${
              activeTab === "preferences" ? "bg-white" : ""
            }`}
            onPress={() => setActiveTab("preferences")}
          >
            <Text
              className={`text-sm font-medium ${
                activeTab === "preferences" ? "text-emerald-600" : "text-white"
              }`}
            >
              Preferences
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View className="p-4">
        {loading && (
          <View className="bg-white rounded-xl p-4 mb-4 items-center">
            <ActivityIndicator size="small" color="#059669" />
            <Text className="text-sm text-gray-600 mt-2">Updating...</Text>
          </View>
        )}

        {activeTab === "meals" && renderMealsTab()}
        {activeTab === "preferences" && renderPreferencesTab()}
      </View>
    </ScrollView>
  );
}

export default BoarderMealTracker;