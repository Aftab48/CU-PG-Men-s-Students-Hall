// app/auth/staff.tsx

import {
    createStaffAccount,
    universalLogin,
} from "@/lib/actions";
import { cacheManager } from "@/lib/cache";
import { useAuthStore } from "@/stores/auth-store";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
    Eye,
    EyeOff,
    Lock,
    Mail,
    RefreshCw,
    User,
    UserCheck,
} from "lucide-react-native";
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

function StaffLoginScreen() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { login } = useAuthStore();

  // ------------------------- Handlers -------------------------
  const handleRefreshCache = async () => {
    setRefreshing(true);
    try {
      await cacheManager.clearAll();
      Alert.alert("Success", "Cache cleared! Please try logging in again.");
    } catch (error: any) {
      console.error("Clear cache error:", error);
      Alert.alert("Error", "Failed to clear cache");
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const result = await universalLogin(email.trim(), password);
      if (result.success && result.user) {
        if (result.user.role !== "staff") {
          Alert.alert(
            "Error",
            "This account is not authorized for staff access"
          );
          return;
        }
        login({
          id: result.user.$id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        });
        router.replace("/(staff)/(tabs)/meal-log");
      } else {
        Alert.alert("Login Failed", result.error || "Invalid credentials");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    try {
      const result = await createStaffAccount({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      if (result.success) {
        Alert.alert(
          "Success",
          "Account created successfully! Your account is pending manager approval. Please login after approval.",
          [
            {
              text: "OK",
              onPress: () => {
                setIsSignup(false);
                setEmail(email.trim());
                setPassword("");
                setName("");
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Signup Failed",
          result.error || "Failed to create account"
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------- JSX -------------------------
  return (
    <SafeAreaView className="flex-1 bg-transparent" edges={['bottom', 'left', 'right']}>
      <LinearGradient colors={["#7c3aed", "#a78bfa"]} className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1 p-6">
              <View className="flex-row justify-between items-center mt-5">
                <TouchableOpacity onPress={() => router.back()} disabled={loading}>
                  <Text className="text-white text-base">← Back</Text>
                </TouchableOpacity>
                
                {!isSignup && (
                  <TouchableOpacity 
                    onPress={handleRefreshCache} 
                    disabled={loading || refreshing}
                    className="flex-row items-center"
                  >
                    <RefreshCw size={16} color="#ffffff" />
                    <Text className="text-white text-sm ml-1">
                      {refreshing ? "Refreshing..." : "Refresh"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View className="items-center mt-10 mb-10">
                <UserCheck size={50} color="#ffffff" />
                <Text className="text-3xl font-bold text-white mt-4">
                  {isSignup ? "Create Staff Account" : "Staff Login"}
                </Text>
                <Text className="text-base text-white/80 text-center mt-2">
                  {isSignup
                    ? "Join our team"
                    : "Manage meal distribution"}
                </Text>
              </View>

              <View className="gap-4">
                {/* ------------------- Login Form ------------------- */}
                {!isSignup && (
                  <>
                    <View className="flex-row items-center bg-white rounded-xl px-4 py-1 mb-4">
                      <Mail size={20} color="#6b7280" className="mr-3" />
                      <TextInput
                        className="flex-1 text-base text-dark-100 py-4"
                        placeholder="Email address"
                        placeholderTextColor="#9ca3af"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!loading}
                      />
                    </View>

                    <View className="flex-row items-center bg-white rounded-xl px-4 py-1 mb-6">
                      <Lock size={20} color="#6b7280" className="mr-3" />
                      <TextInput
                        className="flex-1 text-base text-dark-100 py-4"
                        placeholder="Password"
                        placeholderTextColor="#9ca3af"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        editable={!loading}
                      />
                      <TouchableOpacity
                        className="p-1"
                        onPress={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff size={20} color="#6b7280" />
                        ) : (
                          <Eye size={20} color="#6b7280" />
                        )}
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      className={`bg-white rounded-xl py-4 items-center ${
                        loading ? "opacity-60" : ""
                      }`}
                      onPress={handleLogin}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#7c3aed" />
                      ) : (
                        <Text className="text-purple-600 text-base font-semibold">
                          Sign In
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="mt-4 py-3 items-center"
                      onPress={() => setIsSignup(true)}
                      disabled={loading}
                    >
                      <Text className="text-white text-base">
                        Don&apos;t have an account? Sign Up
                      </Text>
                    </TouchableOpacity>

                    {/* Change Password button */}
                    <TouchableOpacity
                      className="bg-white/20 rounded-xl py-4 items-center mt-3"
                      onPress={() => router.replace("/auth/updateStaff")}
                      disabled={loading}
                    >
                      <Text className="text-white text-base font-semibold">
                        Forgot Password?
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* ------------------- Signup Form ------------------- */}
                {isSignup && (
                  <>
                    <View className="flex-row items-center bg-white rounded-xl px-4 py-1 mb-4">
                      <User size={20} color="#6b7280" className="mr-3" />
                      <TextInput
                        className="flex-1 text-base text-dark-100 py-4"
                        placeholder="Full Name"
                        placeholderTextColor="#9ca3af"
                        value={name}
                        onChangeText={setName}
                        editable={!loading}
                      />
                    </View>

                    <View className="flex-row items-center bg-white rounded-xl px-4 py-1 mb-4">
                      <Mail size={20} color="#6b7280" className="mr-3" />
                      <TextInput
                        className="flex-1 text-base text-dark-100 py-4"
                        placeholder="Email address"
                        placeholderTextColor="#9ca3af"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!loading}
                      />
                    </View>

                    <View className="flex-row items-center bg-white rounded-xl px-4 py-1 mb-6">
                      <Lock size={20} color="#6b7280" className="mr-3" />
                      <TextInput
                        className="flex-1 text-base text-dark-100 py-4"
                        placeholder="Password (min 8 characters)"
                        placeholderTextColor="#9ca3af"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        editable={!loading}
                      />
                      <TouchableOpacity
                        className="p-1"
                        onPress={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff size={20} color="#6b7280" />
                        ) : (
                          <Eye size={20} color="#6b7280" />
                        )}
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      className={`bg-white rounded-xl py-4 items-center ${
                        loading ? "opacity-60" : ""
                      }`}
                      onPress={handleSignup}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#7c3aed" />
                      ) : (
                        <Text className="text-purple-600 text-base font-semibold">
                          Create Account
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="mt-4 py-3 items-center"
                      onPress={() => setIsSignup(false)}
                      disabled={loading}
                    >
                      <Text className="text-white text-base">
                        Already have an account? Sign In
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

export default StaffLoginScreen;
