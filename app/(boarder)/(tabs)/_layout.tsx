// app/(boarder)/(tabs)/_layout.tsx

import { Tabs } from "expo-router";
import { ChefHat, CreditCard, Wallet } from "lucide-react-native";
import React from "react";

export default function BoarderTabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#6B7280",
        headerStyle: {
          backgroundColor: "#1E3A8A",
        },
        headerTintColor: "#ffffff",
        headerStatusBarHeight: 0,
      }}
    >
      <Tabs.Screen
        name="meals"
        options={{
          title: "Meals",
          headerTitle: "",
          tabBarIcon: ({ color }) => <ChefHat color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: "Payments",
          headerTitle: "",
          tabBarIcon: ({ color }) => <CreditCard color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="balance"
        options={{
          title: "Balance",
          headerTitle: "",
          tabBarIcon: ({ color }) => <Wallet color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
