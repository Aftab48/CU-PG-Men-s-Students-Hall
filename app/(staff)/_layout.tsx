// app/(staff)/_layout.tsx

import { Stack } from "expo-router";
import React from "react";

export default function StaffLayout() {
  return (
    <Stack screenOptions={{ headerShown: false}}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}