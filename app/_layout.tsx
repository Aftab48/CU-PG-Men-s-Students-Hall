// app/_layout.tsx

import { useAuthStore } from "@/stores/auth-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { requestRecordingPermissionsAsync } from "expo-audio";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "./global.css";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  // Request all permissions (media library, camera, and microphone)
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        // Request media library permissions
        const mediaLibraryStatus = await MediaLibrary.requestPermissionsAsync();
        
        // Request camera permissions
        const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
        
        // Request media library permissions from image picker (for photos)
        const mediaPickerStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        // Request microphone/audio recording permissions
        const audioStatus = await requestRecordingPermissionsAsync();
        
        const allGranted = 
          mediaLibraryStatus.status === "granted" &&
          cameraStatus.status === "granted" &&
          mediaPickerStatus.status === "granted" &&
          audioStatus.granted === true;
        
        if (allGranted) {
          setPermissionsGranted(true);
        } else {
          const deniedPermissions = [];
          if (mediaLibraryStatus.status !== "granted") deniedPermissions.push("Media Library");
          if (cameraStatus.status !== "granted") deniedPermissions.push("Camera");
          if (mediaPickerStatus.status !== "granted") deniedPermissions.push("Photo Library");
          if (audioStatus.granted !== true) deniedPermissions.push("Microphone");
          
          Alert.alert(
            "Permissions Required",
            `This app needs access to: ${deniedPermissions.join(", ")}. Please enable them in your device settings for full functionality.`,
            [{ text: "OK" }]
          );
          setPermissionsGranted(true); // Allow app to continue even if denied
        }
      } catch (error) {
        console.error("Error requesting permissions:", error);
        setPermissionsGranted(true); // Allow app to continue on error
      }
    };

    requestPermissions();
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
