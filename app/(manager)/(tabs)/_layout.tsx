// app/(manager)/(tabs)/_layout.tsx

import { Tabs } from "expo-router";
import { BarChart3, Calculator, FileText, Package, UserCheck } from "lucide-react-native";
import React from "react";
import { Dimensions, Platform } from "react-native";

export default function ManagerTabLayout() {
  const screenWidth = Dimensions.get("window").width;
  
  // Hide labels on smaller screens (phones with width < 380px)
  const showLabels = screenWidth >= 380;
  
  // Adjust icon size for smaller screens
  const iconSize = screenWidth < 360 ? 20 : 24;
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#6B7280",
        headerTintColor: "#ffffff",
        headerStatusBarHeight: 0,
        tabBarShowLabel: showLabels,
        tabBarStyle: {
          height: showLabels ? 60 : 50,
          paddingBottom: Platform.OS === "ios" ? 5 : 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: screenWidth < 380 ? 10 : 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="meals"
        options={{
          title: "Meal Count",
          headerTitle: "",
          tabBarIcon: ({ color }) => <BarChart3 color={color} size={iconSize} />,
          headerStyle: { backgroundColor: "#1E3A8A" },
          headerStatusBarHeight: 0,
        }}
      />
      <Tabs.Screen
        name="expense"
        options={{
          title: "Daily Expense",
          headerTitle: "",
          tabBarIcon: ({ color }) => <Calculator color={color} size={iconSize} />,
          headerStyle: { backgroundColor: "#1E3A8A" },
          headerStatusBarHeight: 0,
        }}
      />
      <Tabs.Screen
        name="store-out"
        options={{
          title: "Store-out",
          headerTitle: "",
          tabBarIcon: ({ color }) => <Package color={color} size={iconSize} />,
          headerStyle: { backgroundColor: "#1E3A8A" },
          headerStatusBarHeight: 0,
        }}
      />
      <Tabs.Screen
        name="approve"
        options={{
          title: "Approve",
          headerTitle: "",
          tabBarIcon: ({ color }) => <UserCheck color={color} size={iconSize} />,
          headerStyle: { backgroundColor: "#1E3A8A" },
          headerStatusBarHeight: 0,
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          title: "Monthly Summary",
          headerTitle: "",
          tabBarIcon: ({ color }) => <FileText color={color} size={iconSize} />,
          headerStyle: { backgroundColor: "#1E3A8A" },
          headerStatusBarHeight: 0,
        }}
      />
    </Tabs>
  );
}
