// app/index.tsx

import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Building2,
  Calculator,
  ChefHat,
  UserCheck,
  Users,
} from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LandingScreen() {
  return (
    <SafeAreaView className="flex-1">
      <LinearGradient colors={["#1e40af", "#3b82f6"]} className="flex-1">
        <View className="flex-1 p-6 justify-between">
          {/* Header */}
          <View className="items-center mt-16">
            <Building2 size={60} color="#ffffff" />
            <Text className="text-3xl font-bold text-white mt-4">
              BoardingHub
            </Text>
            <Text className="text-base text-slate-200 text-center mt-2">
              Manage your boarding house with ease
            </Text>
          </View>

          {/* Login Options */}
          <View className="gap-5">
            {/* Manager */}
            <TouchableOpacity
              className="rounded-2xl overflow-hidden shadow-lg"
              onPress={() => router.push("/auth/manager")}
            >
              <LinearGradient
                colors={["#eff6ff", "#ffffff"]}
                className="p-6 items-center"
              >
                <Calculator size={40} color="#1e40af" />
                <Text className="text-xl font-bold text-gray-800 mt-3">
                  Manager Login
                </Text>
                <Text className="text-sm text-gray-600 text-center mt-2 leading-5">
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
                colors={["#ecfdf5", "#ffffff"]}
                className="p-6 items-center"
              >
                <ChefHat size={40} color="#059669" />
                <Text className="text-xl font-bold text-gray-800 mt-3">
                  Boarder Login
                </Text>
                <Text className="text-sm text-gray-600 text-center mt-2 leading-5">
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
                colors={["#f5f3ff", "#ffffff"]}
                className="p-6 items-center"
              >
                <UserCheck size={40} color="#7c3aed" />
                <Text className="text-xl font-bold text-gray-800 mt-3">
                  Staff Login
                </Text>
                <Text className="text-sm text-gray-600 text-center mt-2 leading-5">
                  Manage meal distribution and track boarder meals
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Features Footer */}
          <View className="flex-row flex-wrap justify-around mb-10">
            <View className="items-center gap-2 w-24">
              <Users size={20} color="#ffffff" />
              <Text className="text-xs text-slate-200 text-center">
                Multi-user support
              </Text>
            </View>
            <View className="items-center gap-2 w-24">
              <Calculator size={20} color="#ffffff" />
              <Text className="text-xs text-slate-200 text-center">
                Expense tracking
              </Text>
            </View>
            <View className="items-center gap-2 w-24">
              <ChefHat size={20} color="#ffffff" />
              <Text className="text-xs text-slate-200 text-center">
                Meal management
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
