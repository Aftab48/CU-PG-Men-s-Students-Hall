// app/index.tsx

import { useAuthStore } from "@/stores/auth-store";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Building2,
  Calculator,
  ChefHat,
  UserCheck,
  Users,
} from "lucide-react-native";
import React, { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LandingScreen() {
  const { isAuthenticated, user } = useAuthStore();

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "manager") {
        router.replace("/(manager)/(tabs)/expense");
      } else if (user.role === "boarder") {
        router.replace("/(boarder)/(tabs)/meals");
      } else if (user.role === "staff") {
        router.replace("/(staff)/(tabs)/meal-log");
      }
    }
  }, [isAuthenticated, user]);

  return (
    <SafeAreaView
      className="flex-1 bg-transparent"
      edges={["bottom", "left", "right"]}
    >
      <LinearGradient colors={["#1E3A8A", "#3B82F6"]} className="flex-1">
        <View className="flex-1 p-6 justify-between">
          {/* Header */}
          <View className="items-center mt-16">
            <Building2 size={60} color="#FFFFFF" />
            <Text className="text-3xl font-bold text-white mt-4">CUPGMSH</Text>
          </View>

          {/* Login Options */}
          <View className="gap-5">
            {/* Manager */}
            <TouchableOpacity
              className="rounded-2xl overflow-hidden shadow-lg"
              onPress={() => router.push("/auth/manager")}
            >
              <LinearGradient
                colors={["#F9FAFB", "#FFFFFF"]}
                className="p-6 items-center"
              >
                <Calculator size={40} color="#1E3A8A" />
                <Text className="text-xl font-bold text-dark-100 mt-3">
                  Manager Login
                </Text>
                <Text className="text-sm text-gray-100 text-center mt-2 leading-5">
                  Track expenses, manage finances, and generate reports
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Boarder */}
            <TouchableOpacity
              className="rounded-2xl overflow-hidden shadow-lg"
              onPress={() => router.push("/auth/boarder")}
            >
              <LinearGradient
                colors={["#F9FAFB", "#FFFFFF"]}
                className="p-6 items-center"
              >
                <ChefHat size={40} color="#3B82F6" />
                <Text className="text-xl font-bold text-dark-100 mt-3">
                  Boarder Login
                </Text>
                <Text className="text-sm text-gray-100 text-center mt-2 leading-5">
                  Track your meals and monitor your balance
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Staff */}
            <TouchableOpacity
              className="rounded-2xl overflow-hidden shadow-lg"
              onPress={() => router.push("/auth/staff")}
            >
              <LinearGradient
                colors={["#F9FAFB", "#FFFFFF"]}
                className="p-6 items-center"
              >
                <UserCheck size={40} color="#7c3aed" />
                <Text className="text-xl font-bold text-dark-100 mt-3">
                  Staff Login
                </Text>
                <Text className="text-sm text-gray-100 text-center mt-2 leading-5">
                  Manage meal distribution and track boarder meals
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Features Footer */}
          <View className="flex-row flex-wrap justify-around mb-10">
            <View className="items-center gap-2 w-24">
              <Users size={20} color="#FFFFFF" />
              <Text className="text-xs text-white/80 text-center">
                Multi-user support
              </Text>
            </View>
            <View className="items-center gap-2 w-24">
              <Calculator size={20} color="#FFFFFF" />
              <Text className="text-xs text-white/80 text-center">
                Expense tracking
              </Text>
            </View>
            <View className="items-center gap-2 w-24">
              <ChefHat size={20} color="#FFFFFF" />
              <Text className="text-xs text-white/80 text-center">
                Meal management
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
