// app/_layout.tsx

import { useAuthStore } from "@/stores/auth-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "./global.css";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  // No permissions needed at startup
  // Note: Image picking uses Android Photo Picker (Android 13+) which doesn't require permissions
  // Media library permissions are requested on-demand when saving files
  useEffect(() => {
    setPermissionsGranted(true);
  }, []);

  // Wait for Zustand persist to hydrate
  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    // Check if already hydrated
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return unsubscribe;
  }, []);

  // Hide splash screen once hydrated and permissions are handled
  useEffect(() => {
    if (isHydrated && permissionsGranted) {
      SplashScreen.hideAsync();
    }
  }, [isHydrated, permissionsGranted]);

  // Don't render navigation until hydrated and permissions are handled
  if (!isHydrated || !permissionsGranted) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="#1E3A8A" />
      <Stack 
        screenOptions={{ 
          headerBackTitle: "Back",
          headerShown: false,
          contentStyle: { backgroundColor: '#F9FAFB' }
        }}
      >
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
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView className="flex-1 bg-white-100">
        <RootLayoutNav />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
