// app/(boarder)/(tabs)/meals.tsx

import {
    getBoarderProfile,
    getOrCreateMealRecord,
    toggleMealStatus,
    updateBoarderMealPreference,
} from "@/lib/actions";
import { canTurnOffMeal, formatDateForDisplay } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Beef, Calendar, Clock, Coffee, Egg, Fish, Leaf, Lock, LogOut, Moon, RefreshCcw, Sun, User } from "lucide-react-native";
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
  // Use local date instead of UTC
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [activeTab, setActiveTab] = useState<"meals" | "preferences">("meals");
  const [loading, setLoading] = useState(false);
  const [mealRecord, setMealRecord] = useState<any>(null);
  const [boarderProfile, setBoarderProfile] = useState<any>(null);
  const [mealPreference, setMealPreference] = useState<
    "veg" | "non-veg" | "egg" | "fish"
  >("veg");
  const [currentTime, setCurrentTime] = useState(new Date());

  const { user } = useAuthStore();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);


  useEffect(() => {
    if (user) {
      loadMealRecord(false); // Use cache on initial load
      loadBoarderProfile(false); // Use cache on initial load
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedDate]);

  const loadMealRecord = async (forceRefresh: boolean = false) => {
    if (!user) return;

    setLoading(true);
    try {
      // Note: getOrCreateMealRecord doesn't have cache since it creates records
      // But we can invalidate cache after toggles
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

  const loadBoarderProfile = async (forceRefresh: boolean = false) => {
    if (!user) return;

    try {
      const profile = await getBoarderProfile(user.id, forceRefresh);
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

      // Time-confined logic: Check if trying to turn OFF a meal past the deadline
      if (newStatus === "OFF") {
        const timeCheck = canTurnOffMeal(mealType, date);
        if (!timeCheck.allowed) {
          Alert.alert("Deadline Passed", timeCheck.message || "Cannot modify this meal.");
          setLoading(false);
          return;
        }
      }

      // Toggle status in backend
      const result = await toggleMealStatus(user.id, date, mealType, newStatus);

      if (result.success) {
        // Reload today's meals only if the toggled date is today
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

  const renderMealsTab = () => {
    // Format local time
    const formatTime = (date: Date) => {
      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes}:${seconds} ${ampm}`;
    };

    return (
    <>
      {/* Date and Time Display */}
      <View className="bg-white rounded-xl p-3 sm:p-4 mb-4 sm:mb-5 shadow-sm">
        <View className="flex-row items-center gap-2 sm:gap-3 mb-2">
          <Calendar size={18} color="#3B82F6" />
          <Text className="text-sm sm:text-base md:text-lg font-medium text-dark-100">
            {formatDateForDisplay(selectedDate)}
          </Text>
        </View>
        <View className="flex-row items-center gap-2 sm:gap-3">
          <Clock size={18} color="#3B82F6" />
          <Text className="text-sm sm:text-base md:text-lg font-semibold text-primary">
            {formatTime(currentTime)}
          </Text>
        </View>
      </View>

      {/* Meal Options */}
      <View className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-5 shadow-lg">
        <Text className="text-base sm:text-lg md:text-xl font-semibold text-dark-100 mb-3 sm:mb-4">
          Today&apos;s Meals
        </Text>

        {mealRecord ? (
          mealOptions.map((meal) => {
            const IconComponent = meal.icon;
            const isLocked = meal.active && !canTurnOffMeal(meal.id as "brunch" | "dinner", selectedDate).allowed;
            return (
                <TouchableOpacity
                key={meal.id}
                className={`flex-row items-center justify-between py-3 px-2.5 sm:py-4 sm:px-3 rounded-xl mb-2.5 sm:mb-3 border-2 ${
                  meal.active
                    ? isLocked
                      ? "bg-gray-50 border-gray-300"
                      : "bg-blue-50 border-primary"
                    : "border-gray-100"
                }`}
                onPress={() => handleMealToggle(meal.id as "brunch" | "dinner")}
                disabled={loading || isLocked}
              >
                <View className="flex-row items-center flex-1">
                  <View
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full items-center justify-center mr-2.5 sm:mr-3 ${
                      meal.active 
                        ? isLocked 
                          ? "bg-gray-400" 
                          : "bg-primary" 
                        : "bg-blue-50"
                    }`}
                  >
                    <IconComponent
                      size={20}
                      color={meal.active ? "#ffffff" : "#3B82F6"}
                    />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5">
                      <Text
                        className={`text-sm sm:text-base md:text-lg font-medium ${
                          meal.active 
                            ? isLocked 
                              ? "text-gray-500" 
                              : "text-primary" 
                            : "text-dark-100"
                        }`}
                      >
                        {meal.name}
                      </Text>
                      {isLocked && (
                        <Lock size={14} color="#dc2626" />
                      )}
                    </View>
                    <View className="flex-row items-center gap-0.5 sm:gap-1">
                      <Clock size={12} color="#6b7280" />
                      <Text className="text-xs sm:text-sm text-gray-600">
                        {meal.time}
                        {isLocked && (
                          <Text className="text-red-600"> • Locked</Text>
                        )}
                      </Text>
                    </View>
                  </View>
                </View>
                <View
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg ${
                    meal.active
                      ? isLocked
                        ? "bg-gray-400"
                        : "bg-primary"
                      : "bg-gray-300"
                  }`}
                >
                  <Text className="text-white text-xs sm:text-sm font-bold">
                    {meal.active ? "ON" : "OFF"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View className="items-center py-5 sm:py-6">
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text className="text-xs sm:text-sm text-gray-100 mt-2">Loading meals...</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-lg">
        <Text className="text-base sm:text-lg md:text-xl font-semibold text-dark-100 mb-3 sm:mb-4">
          Quick Actions
        </Text>

        {/* Toggle Tonight's Dinner */}
        <TouchableOpacity
          className={`flex-row items-center py-3 px-3 sm:py-4 sm:px-4 rounded-xl mb-2.5 sm:mb-3 gap-2 sm:gap-3 ${
            todayMeals.dinner && !canTurnOffMeal("dinner", selectedDate).allowed
              ? "bg-gray-100"
              : "bg-blue-50"
          }`}
          onPress={() => handleMealToggle("dinner")}
          disabled={loading || !mealRecord || (todayMeals.dinner && !canTurnOffMeal("dinner", selectedDate).allowed)}
        >
          {todayMeals.dinner && !canTurnOffMeal("dinner", selectedDate).allowed ? (
            <Lock size={18} color="#6b7280" />
          ) : (
            <Moon size={18} color="#3B82F6" />
          )}
          <Text className={`text-sm sm:text-base md:text-lg font-medium ${
            todayMeals.dinner && !canTurnOffMeal("dinner", selectedDate).allowed
              ? "text-gray-500"
              : "text-primary"
          }`}>
            {todayMeals.dinner && !canTurnOffMeal("dinner", selectedDate).allowed
              ? "Dinner Locked (After 5:00 PM)"
              : todayMeals.dinner
              ? "Skip Tonight's Dinner"
              : "Turn On Tonight's Dinner"}
          </Text>
        </TouchableOpacity>

        {/* Toggle Tomorrow's Brunch */}
        <TouchableOpacity
          className="flex-row items-center py-3 px-3 sm:py-4 sm:px-4 rounded-xl bg-blue-50 mb-2.5 sm:mb-3 gap-2 sm:gap-3"
          onPress={async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            // Use local date instead of UTC
            const year = tomorrow.getFullYear();
            const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
            const day = String(tomorrow.getDate()).padStart(2, "0");
            const tomorrowStr = `${year}-${month}-${day}`;

            // Fetch tomorrow's brunch record to check its status
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
          <Coffee size={18} color="#3B82F6" />
          <Text className="text-sm sm:text-base md:text-lg font-medium text-primary">
            {/** This label changes based on tomorrow's brunch status dynamically after toggle */}
            Skip / Turn On Tomorrow&apos;s Brunch
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center py-3 px-3 sm:py-4 sm:px-4 rounded-xl bg-blue-50 gap-2 sm:gap-3"
          onPress={() => router.push("/(boarder)/skip-range")}
        >
          <Calendar size={18} color="#3B82F6" />
          <Text className="text-sm sm:text-base md:text-lg font-medium text-primary">
            Skip Date Range
          </Text>
        </TouchableOpacity>

        {/* Time Restrictions Info */}
        <View className="bg-blue-50 rounded-xl p-3 sm:p-4 mt-2">
          <Text className="text-xs sm:text-sm text-blue-800 font-medium mb-1">
            ⏰ Meal Toggle Deadlines
          </Text>
          <Text className="text-xs sm:text-sm text-blue-700">
            • Brunch can be turned off until 5:00 AM same day{"\n"}
            • Dinner can be turned off until 5:00 PM same day
          </Text>
        </View>
      </View>
    </>
    );
  };

  const renderPreferencesTab = () => (
    <View className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-lg">
      <Text className="text-base sm:text-lg md:text-xl font-semibold text-dark-100 mb-3 sm:mb-4">
        Meal Preference
      </Text>
      <Text className="text-xs sm:text-sm md:text-base text-gray-100 mb-4 sm:mb-5 md:mb-6">
        Select your preferred meal type. This helps the kitchen prepare the
        right food for you.
      </Text>

      <View className="gap-2.5 sm:gap-3">
        {(["veg", "non-veg", "egg", "fish"] as const).map((pref) => {
          const getIcon = () => {
            switch (pref) {
              case "veg":
                return Leaf;
              case "non-veg":
                return Beef;
              case "egg":
                return Egg;
              case "fish":
                return Fish;
              default:
                return User;
            }
          };
          
          const IconComponent = getIcon();
          
          return (
            <TouchableOpacity
              key={pref}
              className={`flex-row items-center justify-between py-3 px-3 sm:py-4 sm:px-4 rounded-xl border-2 ${
                mealPreference === pref
                  ? "bg-blue-50 border-primary"
                  : "border-gray-200"
              }`}
              onPress={() => handleUpdateMealPreference(pref)}
              disabled={loading || !boarderProfile}
            >
              <View className="flex-row items-center">
                <View
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full items-center justify-center mr-2.5 sm:mr-3 ${
                    mealPreference === pref ? "bg-primary" : "bg-gray-200"
                  }`}
                >
                  <IconComponent
                    size={18}
                    color={mealPreference === pref ? "#ffffff" : "#374151"}
                  />
                </View>
                <Text
                  className={`text-sm sm:text-base md:text-lg font-medium ${
                    mealPreference === pref ? "text-primary" : "text-dark-100"
                  }`}
                >
                  {pref.charAt(0).toUpperCase() + pref.slice(1).replace("-", " ")}
                </Text>
              </View>
              <View
                className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full border-2 items-center justify-center ${
                  mealPreference === pref
                    ? "bg-primary border-primary"
                    : "border-gray-300"
                }`}
              >
                {mealPreference === pref && (
                  <Text className="text-white text-xs font-bold">✓</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {boarderProfile && (
        <View className="mt-4 sm:mt-5 md:mt-6 p-3 sm:p-4 bg-gray-50 rounded-xl">
          <Text className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Current Preference
          </Text>
          <Text className="text-sm sm:text-base md:text-lg text-primary font-semibold">
            {mealPreference.charAt(0).toUpperCase() +
              mealPreference.slice(1).replace("-", " ")}
          </Text>
        </View>
      )}

      {!boarderProfile && (
        <View className="items-center py-5 sm:py-6">
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text className="text-xs sm:text-sm text-gray-100 mt-2">Loading profile...</Text>
        </View>
      )}
    </View>
  );

  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  const handleRefresh = () => {
    loadMealRecord(true); // Force refresh on button click
    loadBoarderProfile(true); // Force refresh on button click
  };

  return (
    <ScrollView className="flex-1 bg-white-100">
      <LinearGradient colors={["#1E3A8A", "#3B82F6"]} className="px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 pt-12 sm:pt-14 md:pt-15">
        <View className="flex-row justify-between items-start mb-3 sm:mb-4">
          <View className="flex-1">
            <Text className="text-xl sm:text-2xl md:text-3xl font-bold justify-center items-center text-white">
              Welcome <Text className="text-blue-200">{boarderProfile?.name}</Text>
            </Text>
            <Text className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Food Dashboard</Text>
            <Text className="text-sm sm:text-base md:text-lg text-white/80 mt-0.5 sm:mt-1">
              Manage your meals and preferences
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

        {/* Tab Navigation */}
        <View className="flex-row mt-4 sm:mt-5 md:mt-6 bg-white/20 rounded-xl p-0.5 sm:p-1">
          <TouchableOpacity
            className={`flex-1 py-2.5 px-3 sm:py-3 sm:px-4 rounded-lg items-center ${
              activeTab === "meals" ? "bg-white" : ""
            }`}
            onPress={() => setActiveTab("meals")}
          >
            <Text
              className={`text-xs sm:text-sm md:text-base font-medium ${
                activeTab === "meals" ? "text-primary" : "text-white"
              }`}
            >
              Daily Meals
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2.5 px-3 sm:py-3 sm:px-4 rounded-lg items-center ${
              activeTab === "preferences" ? "bg-white" : ""
            }`}
            onPress={() => setActiveTab("preferences")}
          >
            <Text
              className={`text-xs sm:text-sm md:text-base font-medium ${
                activeTab === "preferences" ? "text-primary" : "text-white"
              }`}
            >
              Preferences
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View className="px-3 py-3 sm:px-4 sm:py-4 md:px-5 md:py-5">
        {loading && (
          <View className="bg-white rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 items-center">
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text className="text-xs sm:text-sm text-gray-100 mt-2">Updating...</Text>
          </View>
        )}

        {activeTab === "meals" && renderMealsTab()}
        {activeTab === "preferences" && renderPreferencesTab()}
      </View>
    </ScrollView>
  );
}

export default BoarderMealTracker;