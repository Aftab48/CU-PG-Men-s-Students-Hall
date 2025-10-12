// app/auth/staff.tsx

import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { UserCheck } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function StaffLogin() {
  return (
    <SafeAreaView className="flex-1 bg-transparent" edges={['bottom', 'left', 'right']}>
      <LinearGradient colors={["#7c3aed", "#a78bfa"]} className="flex-1">
        <View className="flex-1 p-6">
          <TouchableOpacity className="mt-5" onPress={() => router.back()}>
            <Text className="text-white text-base">← Back</Text>
          </TouchableOpacity>

          <View className="flex-1 justify-center items-center">
            <UserCheck size={60} color="#ffffff" />
            <Text className="text-3xl font-bold text-white mt-4">Staff Login</Text>
            <Text className="text-xl text-slate-200 mt-8">Coming Soon</Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

export default StaffLogin;