// app/(staff)/(tabs)/_layout.tsx

import { Tabs } from "expo-router";
import React from "react";

export default function StaffTabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1e40af",
        tabBarInactiveTintColor: "#6b7280",
        headerStyle: {
          backgroundColor: "#1e40af",
        },
        headerTintColor: "#ffffff",
        headerStatusBarHeight: 0,
      }}
    >
      {/* Add your staff tab screens here */}
    </Tabs>
  );
}