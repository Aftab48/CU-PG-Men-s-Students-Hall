// app/(boarder)/_layout.tsx

import { Stack } from "expo-router";
import React from "react";

export default function BoarderLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="skip-range" options={{ headerShown: true, title: "Skip Date Range", headerTitle: "", headerStyle: { backgroundColor: "#1E3A8A" }, headerTintColor: "#ffffff" }} />
    </Stack>
  );
}
