// app/(boarder)/(tabs)/_layout.tsx

import { Tabs, router } from "expo-router";
import { ChefHat, LogOut, Wallet } from "lucide-react-native";
import React from "react";
import { TouchableOpacity } from "react-native";

import { useAuthStore } from "@/stores/auth-store";

export default function BoarderTabLayout() {
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#059669",
        tabBarInactiveTintColor: "#6b7280",
        headerStyle: {
          backgroundColor: "#059669",
        },
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
          title: "Meals",
          tabBarIcon: ({ color }) => <ChefHat color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="balance"
        options={{
          title: "Balance",
          tabBarIcon: ({ color }) => <Wallet color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
