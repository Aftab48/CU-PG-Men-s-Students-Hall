// app/auth/manager.tsx

import { loginManager } from "@/lib/actions/manager.actions";
import { useAuthStore } from "@/stores/auth-store";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Calculator, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function ManagerLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const result = await loginManager({ email, password });

      if (result.success && result.profile) {
        // Save manager in state
        login({
          id: result.profile.$id,
          email: result.profile.email,
          role: "manager",
          name: result.profile.name,
        });

        router.replace("/(manager)/(tabs)/expense");
      } else {
        Alert.alert("Login Failed", result.error || "Invalid credentials");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout(); // Clear state
    setEmail("");
    setPassword("");
    router.replace("/");
  };

  return (
    <SafeAreaView className="flex-1">
      <LinearGradient colors={["#1e40af", "#3b82f6"]} className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1 p-6">
              <TouchableOpacity className="mt-5" onPress={handleLogout}>
                <Text className="text-white text-base">← Back</Text>
              </TouchableOpacity>

              <View className="items-center mt-10 mb-10">
                <Calculator size={50} color="#ffffff" />
                <Text className="text-3xl font-bold text-white mt-4">
                  Manager Login
                </Text>
                <Text className="text-base text-slate-200 text-center mt-2">
                  Access your management dashboard
                </Text>
              </View>

              <View className="gap-5">
                {/* Email input */}
                <View className="flex-row items-center bg-white rounded-xl px-4 py-1">
                  <Mail size={20} color="#6b7280" className="mr-3" />
                  <TextInput
                    className="flex-1 text-base text-gray-800 py-4"
                    placeholder="Email address"
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Password input */}
                <View className="flex-row items-center bg-white rounded-xl px-4 py-1">
                  <Lock size={20} color="#6b7280" className="mr-3" />
                  <TextInput
                    className="flex-1 text-base text-gray-800 py-4"
                    placeholder="Password"
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    className="p-1"
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#6b7280" />
                    ) : (
                      <Eye size={20} color="#6b7280" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Login button */}
                <TouchableOpacity
                  className={`bg-orange-600 rounded-xl py-4 items-center mt-5 ${
                    loading ? "opacity-60" : ""
                  }`}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text className="text-white text-base font-semibold">
                      Sign In
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Change Password button */}
                <TouchableOpacity
                  className="bg-gray-200 rounded-xl py-4 items-center mt-3"
                  onPress={() => router.replace("/auth/updateManager")}
                >
                  <Text className="text-gray-800 text-base font-semibold">
                    Change Password
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

export default ManagerLoginScreen;