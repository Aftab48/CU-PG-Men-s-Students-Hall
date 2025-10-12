// app/(manager)/(tabs)/_layout.tsx

import { Tabs } from "expo-router";
import { BarChart3, Calculator, FileText } from "lucide-react-native";
import React from "react";

export default function ManagerTabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#6B7280",
        headerTintColor: "#ffffff",
        headerStatusBarHeight: 0,
      }}
    >
      <Tabs.Screen
        name="meals"
        options={{
          title: "Meal Count",
          headerTitle: "",
          tabBarIcon: ({ color }) => <BarChart3 color={color} size={24} />,
          headerStyle: { backgroundColor: "#1E3A8A" },
          headerStatusBarHeight: 0,
        }}
      />
      <Tabs.Screen
        name="expense"
        options={{
          title: "Daily Expense",
          headerTitle: "",
          tabBarIcon: ({ color }) => <Calculator color={color} size={24} />,
          headerStyle: { backgroundColor: "#1E3A8A" },
          headerStatusBarHeight: 0,
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          title: "Monthly Summary",
          headerTitle: "",
          tabBarIcon: ({ color }) => <FileText color={color} size={24} />,
          headerStyle: { backgroundColor: "#1E3A8A" },
          headerStatusBarHeight: 0,
        }}
      />
    </Tabs>
  );
}
