// app/(manager)/_layout.tsx

import { Stack } from "expo-router";
import React from "react";

export default function ManagerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
