// app/(manager)/(tabs)/_layout.tsx

import { Tabs, router } from "expo-router";
import { BarChart3, Calculator, FileText, LogOut } from "lucide-react-native";
import React from "react";
import { TouchableOpacity } from "react-native";

import { useAuthStore } from "@/stores/auth-store";

export default function ManagerTabLayout() {
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1e40af",
        tabBarInactiveTintColor: "#6b7280",
        headerTintColor: "#ffffff",
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 16 }}>
            <LogOut size={24} color="#ffffff" />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="meals"
        options={{
          title: "Meal Count",
          tabBarIcon: ({ color }) => <BarChart3 color={color} size={24} />,
          headerStyle: { backgroundColor: "#7c3aed" }, // purple for meals
        }}
      />
      <Tabs.Screen
        name="expense"
        options={{
          title: "Daily Expense",
          tabBarIcon: ({ color }) => <Calculator color={color} size={24} />,
          headerStyle: { backgroundColor: "#1e40af" }, // blue for expense
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          title: "Monthly Summary",
          tabBarIcon: ({ color }) => <FileText color={color} size={24} />,
          headerStyle: { backgroundColor: "#059669" }, // green for summary
        }}
      />
    </Tabs>
  );
}
