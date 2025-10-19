// app/(staff)/(tabs)/meal-log.tsx

import {
  getBoardersForCurrentMealSlot,
  getCurrentMealSlot,
  markMealAsTaken,
} from "@/lib/actions";
import { account } from "@/lib/appwrite";
import { useAuthStore } from "@/stores/auth-store";
import { MealLogEntry } from "@/types";
import { router, useFocusEffect } from "expo-router";
import { Beef, CheckCircle, Clock, Egg, Fish, Leaf, LogOut } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MealLogScreen() {
  const [boarders, setBoarders] = useState<MealLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mealSlot, setMealSlot] = useState<{ isInSlot: boolean; mealType: "brunch" | "dinner" | null }>({ isInSlot: false, mealType: null });
  const [markingId, setMarkingId] = useState<string | null>(null);

  const { user, logout } = useAuthStore();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setMealSlot(getCurrentMealSlot());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const loadBoarders = useCallback(async (forceRefresh: boolean = false) => {
    try {
      if (!forceRefresh) setLoading(true);
      
      const slot = getCurrentMealSlot();
      setMealSlot(slot);
      
      if (!slot.isInSlot || !slot.mealType) {
        setBoarders([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const date = getLocalDateString();
      const result = await getBoardersForCurrentMealSlot(date, slot.mealType, forceRefresh);
      
      if (result.success) {
        setBoarders(result.boarders || []);
      } else {
        Alert.alert("Error", (result as any).error || "Failed to load boarders");
      }
    } catch (error) {
      console.error("Failed to load boarders:", error);
      Alert.alert("Error", "Failed to load boarders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBoarders();
    }, [loadBoarders])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadBoarders(true);
  };

  const handleMarkServed = async (boarder: MealLogEntry) => {
    if (!user || !mealSlot.mealType) return;

    Alert.alert(
      "Mark as Served",
      `Mark ${boarder.boarderName} as served?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setMarkingId(boarder.mealRecordId);
            try {
              const date = getLocalDateString();
              const result = await markMealAsTaken(
                boarder.boarderId,
                date,
                mealSlot.mealType!,
                user.id
              );
              
              if (result.success) {
                // Update local state
                setBoarders(prev =>
                  prev.map(b =>
                    b.mealRecordId === boarder.mealRecordId
                      ? { ...b, isServed: true, servedByStaffId: user.id }
                      : b
                  )
                );
              } else {
                Alert.alert("Error", result.error || "Failed to mark as served");
              }
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to mark as served");
            } finally {
              setMarkingId(null);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await account.deleteSession({ sessionId: "current" });
              logout();
              router.replace("/");
            } catch (error) {
              console.error("Logout error:", error);
              logout();
              router.replace("/");
            }
          },
        },
      ]
    );
  };

  const getMealPreferenceIcon = (preference: string) => {
    switch (preference) {
      case "veg":
        return <Leaf size={18} color="#10b981" />;
      case "non-veg":
        return <Beef size={18} color="#ef4444" />;
      case "egg":
        return <Egg size={18} color="#f59e0b" />;
      case "fish":
        return <Fish size={18} color="#3b82f6" />;
      default:
        return null;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderBoarderCard = ({ item }: { item: MealLogEntry }) => {
    const isMarking = markingId === item.mealRecordId;
    const isServed = item.isServed;

    return (
      <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-200">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              {getMealPreferenceIcon(item.mealPreference)}
              <Text className="text-lg font-semibold text-gray-900 ml-2">
                {item.boarderName}
              </Text>
            </View>
            {item.roomNumber && (
              <Text className="text-sm text-gray-600">Room: {item.roomNumber}</Text>
            )}
            <Text className="text-xs text-gray-500 mt-1 capitalize">
              {item.mealPreference}
            </Text>
          </View>

          <View className="ml-3">
            {isServed ? (
              <View className="bg-green-100 rounded-full p-3">
                <CheckCircle size={28} color="#10b981" />
              </View>
            ) : (
              <TouchableOpacity
                className={`bg-purple-600 rounded-full p-3 ${
                  isMarking ? "opacity-60" : ""
                }`}
                onPress={() => handleMarkServed(item)}
                disabled={isMarking}
              >
                {isMarking ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <CheckCircle size={28} color="#ffffff" />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {isServed && (
          <View className="mt-2 pt-2 border-t border-gray-200">
            <Text className="text-xs text-green-600 font-medium">✓ Served</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text className="text-gray-600 mt-4">Loading meal log...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      <View className="bg-purple-600 px-6 py-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-2xl font-bold text-white">Meal Log</Text>
          <TouchableOpacity onPress={handleLogout}>
            <LogOut size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <Text className="text-white/90 text-sm">{formatDate(currentTime)}</Text>
        <View className="flex-row items-center mt-2">
          <Clock size={16} color="#ffffff" />
          <Text className="text-white/90 text-sm ml-2">{formatTime(currentTime)}</Text>
        </View>
      </View>

      {!mealSlot.isInSlot ? (
        <View className="flex-1 items-center justify-center px-6">
          <Clock size={64} color="#9ca3af" />
          <Text className="text-xl font-semibold text-gray-900 mt-4 text-center">
            Outside Meal Time
          </Text>
          <Text className="text-gray-600 text-center mt-2">
            Meal slots are available during:
          </Text>
          <View className="mt-4 bg-white rounded-lg p-4 w-full max-w-sm">
            <Text className="text-sm font-medium text-gray-700">🥐 Brunch: 10:00 AM - 2:10 PM</Text>
            <Text className="text-sm font-medium text-gray-700 mt-2">🍽️ Dinner: 8:00 PM - 10:10 PM</Text>
          </View>
        </View>
      ) : boarders.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <CheckCircle size={64} color="#10b981" />
          <Text className="text-xl font-semibold text-gray-900 mt-4">
            No Meals to Serve
          </Text>
          <Text className="text-gray-600 text-center mt-2">
            No boarders have their {mealSlot.mealType} turned ON for today.
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          <View className="bg-white px-6 py-3 border-b border-gray-200">
            <Text className="text-sm font-medium text-gray-700">
              Current Slot: <Text className="text-purple-600 capitalize">{mealSlot.mealType}</Text>
            </Text>
            <Text className="text-xs text-gray-500 mt-1">
              {boarders.filter(b => !b.isServed).length} pending • {boarders.filter(b => b.isServed).length} served
            </Text>
          </View>

          <FlatList
            data={boarders}
            renderItem={renderBoarderCard}
            keyExtractor={(item) => item.mealRecordId}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#7c3aed"]}
              />
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}

