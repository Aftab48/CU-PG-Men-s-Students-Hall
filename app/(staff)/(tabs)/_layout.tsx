// app/(staff)/(tabs)/_layout.tsx

import { Tabs } from "expo-router";
import { ClipboardCheck } from "lucide-react-native";
import React from "react";
import { Platform } from "react-native";

export default function StaffTabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#7c3aed",
        tabBarInactiveTintColor: "#6b7280",
        headerTintColor: "#ffffff",
        headerStatusBarHeight: 0,
        tabBarStyle: {
          height: 60,
          paddingBottom: Platform.OS === "ios" ? 5 : 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="meal-log"
        options={{
          title: "Meal Log",
          headerTitle: "",
          tabBarIcon: ({ color }) => <ClipboardCheck color={color} size={24} />,
          headerStyle: { backgroundColor: "#7c3aed" },
          headerStatusBarHeight: 0,
        }}
      />
    </Tabs>
  );
}