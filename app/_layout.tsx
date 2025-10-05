// app/_layout.tsx

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "./global.css";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth/manager" options={{ headerShown: false }} />
      <Stack.Screen name="auth/boarder" options={{ headerShown: false }} />
      <Stack.Screen name="auth/staff" options={{ headerShown: false }} />
      <Stack.Screen name="auth/updateManager" options={{ headerShown: false }} />
      <Stack.Screen name="auth/updateBoarder" options={{ headerShown: false }} />
      <Stack.Screen name="(manager)" options={{ headerShown: false }} />
      <Stack.Screen name="(boarder)" options={{ headerShown: false }} />
      {/* <Stack.Screen name="modal" options={{ presentation: "modal" }} /> */}
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView className="flex-1">
        <RootLayoutNav />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
