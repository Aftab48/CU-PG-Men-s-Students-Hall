// app/auth/boarder.tsx

import {
  signUpBoarderStep1,
  signUpBoarderStep2,
  universalLogin,
} from "@/lib/actions";
import { useAuthStore } from "@/stores/auth-store";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ChefHat,
  Eye,
  EyeOff,
  Home,
  IndianRupee,
  Lock,
  Mail,
  Phone,
  User
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

export default function BoarderLoginScreen() {
  const [isSignup, setIsSignup] = useState(false);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Step 2 fields
  const [phoneNum, setPhoneNum] = useState("");
  const [roomNum, setRoomNum] = useState("");
  const [mealPreference, setMealPreference] = useState<
    "veg" | "non-veg" | "egg" | "fish"
  >("veg");
  const [advance, setAdvance] = useState("");
  const [current, setCurrent] = useState("0");

  const [tempUserData, setTempUserData] = useState<any>(null);

  const { login } = useAuthStore();

  // ------------------------- Handlers -------------------------
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const result = await universalLogin(email.trim(), password);
      if (result.success && result.user) {
        if (result.user.role !== "boarder") {
          Alert.alert(
            "Error",
            "This account is not authorized for boarder access"
          );
          return;
        }
        login({
          id: result.user.$id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        });
        router.replace("/(boarder)/(tabs)/meals");
      } else {
        Alert.alert("Login Failed", result.error || "Invalid credentials");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupStep1 = async () => {
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
      const result = await signUpBoarderStep1({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      if (result.success && result.user) {
        setTempUserData(result.user);
        setStep(2);
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

  const handleSignupStep2 = async () => {
    if (!phoneNum.trim() || !roomNum.trim() || !advance.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const advanceAmount = parseFloat(advance);
    const currentAmount = parseFloat(current);

    if (isNaN(advanceAmount) || advanceAmount < 0) {
      Alert.alert("Error", "Please enter a valid advance amount");
      return;
    }
    if (isNaN(currentAmount) || currentAmount < 0) {
      Alert.alert("Error", "Please enter a valid current balance");
      return;
    }

    setLoading(true);
    try {
      const result = await signUpBoarderStep2(
        tempUserData.$id,
        tempUserData.name,
        tempUserData.email,
        {
          phoneNum: phoneNum.trim(),
          roomNum: roomNum.trim(),
          mealPreference,
          advance: advanceAmount,
          current: currentAmount,
        }
      );
      if (result.success) {
        Alert.alert("Success", "Account created successfully! Please login.", [
          {
            text: "OK",
            onPress: () => {
              setIsSignup(false);
              setStep(1);
              setEmail(tempUserData.email);
              setPassword("");
              setName("");
              setPhoneNum("");
              setRoomNum("");
              setAdvance("");
              setCurrent("0");
              setTempUserData(null);
            },
          },
        ]);
      } else {
        Alert.alert(
          "Signup Failed",
          result.error || "Failed to complete signup"
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
    <SafeAreaView className="flex-1">
      <LinearGradient colors={["#059669", "#10b981"]} className="flex-1">
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
              <TouchableOpacity className="mt-5" onPress={() => router.back()}>
                <Text className="text-white text-base">← Back</Text>
              </TouchableOpacity>

              <View className="items-center mt-10 mb-10">
                <ChefHat size={50} color="#ffffff" />
                <Text className="text-3xl font-bold text-white mt-4">
                  {isSignup
                    ? step === 1
                      ? "Create Account"
                      : "Complete Profile"
                    : "Boarder Login"}
                </Text>
                <Text className="text-base text-slate-200 text-center mt-2">
                  {isSignup
                    ? step === 1
                      ? "Join our boarding house"
                      : "Tell us about yourself"
                    : "Access your meal dashboard"}
                </Text>
              </View>

              <View className="gap-4">
                {/* ------------------- Login Form ------------------- */}
                {!isSignup && (
                  <>
                    <View className="flex-row items-center bg-white rounded-xl px-4 py-1 mb-4">
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

                    <View className="flex-row items-center bg-white rounded-xl px-4 py-1 mb-6">
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

                    <TouchableOpacity
                      className={`bg-orange-600 rounded-xl py-4 items-center ${
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

                    <TouchableOpacity
                      className="mt-4 py-3 items-center"
                      onPress={() => setIsSignup(true)}
                    >
                      <Text className="text-white text-base">
                        Don&apos;t have an account? Sign Up
                      </Text>
                    </TouchableOpacity>

                    {/* Change Password button */}
                      <TouchableOpacity
                        className="bg-gray-200 rounded-xl py-4 items-center mt-3"
                        onPress={() => router.replace("/auth/updateBoarder")}
                        >
                          <Text className="text-gray-800 text-base font-semibold">
                            Change Password
                          </Text>
                      </TouchableOpacity>
                  </>
                )}

                {/* ------------------- Signup Step 1 ------------------- */}
                {isSignup && step === 1 && (
                  <>
                    <View className="flex-row items-center bg-white rounded-xl px-4 py-1 mb-4">
                      <User size={20} color="#6b7280" className="mr-3" />
                      <TextInput
                        className="flex-1 text-base text-gray-800 py-4"
                        placeholder="Full Name"
                        placeholderTextColor="#9ca3af"
                        value={name}
                        onChangeText={setName}
                      />
                    </View>

                    <View className="flex-row items-center bg-white rounded-xl px-4 py-1 mb-4">
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

                    <View className="flex-row items-center bg-white rounded-xl px-4 py-1 mb-6">
                      <Lock size={20} color="#6b7280" className="mr-3" />
                      <TextInput
                        className="flex-1 text-base text-gray-800 py-4"
                        placeholder="Password (min 8 characters)"
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

                    <TouchableOpacity
                      className={`bg-orange-600 rounded-xl py-4 items-center ${
                        loading ? "opacity-60" : ""
                      }`}
                      onPress={handleSignupStep1}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text className="text-white text-base font-semibold">
                          Continue
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="mt-4 py-3 items-center"
                      onPress={() => setIsSignup(false)}
                    >
                      <Text className="text-white text-base">
                        Already have an account? Sign In
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* ------------------- Signup Step 2 ------------------- */}
                {isSignup && step === 2 && (
                  <>
                    <View className="flex-row items-center bg-white rounded-xl px-4 py-1 mb-4">
                      <Phone size={20} color="#6b7280" className="mr-3" />
                      <TextInput
                        className="flex-1 text-base text-gray-800 py-4"
                        placeholder="Phone Number"
                        placeholderTextColor="#9ca3af"
                        value={phoneNum}
                        onChangeText={setPhoneNum}
                        keyboardType="phone-pad"
                      />
                    </View>

                    <View className="flex-row items-center bg-white rounded-xl px-4 py-1 mb-4">
                      <Home size={20} color="#6b7280" className="mr-3" />
                      <TextInput
                        className="flex-1 text-base text-gray-800 py-4"
                        placeholder="Room Number"
                        placeholderTextColor="#9ca3af"
                        value={roomNum}
                        onChangeText={setRoomNum}
                      />
                    </View>

                    <View className="bg-white rounded-xl px-4 py-4 mb-4">
                      <Text className="text-sm font-medium text-gray-700 mb-3">
                        Meal Preference
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        {(["veg", "non-veg", "egg", "fish"] as const).map(
                          (pref) => (
                            <TouchableOpacity
                              key={pref}
                              className={`px-4 py-2 rounded-lg border ${
                                mealPreference === pref
                                  ? "bg-emerald-600 border-emerald-600"
                                  : "border-gray-300"
                              }`}
                              onPress={() => setMealPreference(pref)}
                            >
                              <Text
                                className={`text-sm font-medium ${
                                  mealPreference === pref
                                    ? "text-white"
                                    : "text-gray-600"
                                }`}
                              >
                                {pref.charAt(0).toUpperCase() + pref.slice(1)}
                              </Text>
                            </TouchableOpacity>
                          )
                        )}
                      </View>
                    </View>

                    <View className="flex-row items-center bg-white rounded-xl px-4 py-1 mb-4">
                      <IndianRupee size={20} color="#6b7280" className="mr-3" />
                      <TextInput
                        className="flex-1 text-base text-gray-800 py-4"
                        placeholder="Advance Payment"
                        placeholderTextColor="#9ca3af"
                        value={advance}
                        onChangeText={setAdvance}
                        keyboardType="numeric"
                      />
                    </View>

                    <View className="flex-row items-center bg-white rounded-xl px-4 py-1 mb-6">
                      <IndianRupee size={20} color="#6b7280" className="mr-3" />
                      <TextInput
                        className="flex-1 text-base text-gray-800 py-4"
                        placeholder="Current Balance (default: 0)"
                        placeholderTextColor="#9ca3af"
                        value={current}
                        onChangeText={setCurrent}
                        keyboardType="numeric"
                      />
                    </View>

                    <TouchableOpacity
                      className={`bg-orange-600 rounded-xl py-4 items-center ${
                        loading ? "opacity-60" : ""
                      }`}
                      onPress={handleSignupStep2}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text className="text-white text-base font-semibold">
                          Complete Signup
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="mt-4 py-3 items-center"
                      onPress={() => setStep(1)}
                    >
                      <Text className="text-white text-base">← Back</Text>
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
