import { updatePasswordWithEmailFlow } from "@/lib/actions/auth.actions";
import { getBoarderProfileByEmail } from "@/lib/actions/boarder.actions";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Eye, EyeOff, Lock } from "lucide-react-native";
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

function UpdateBoarderPassword() {
  const [email, setEmail] = useState("");
  const [greetName, setGreetName] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVerifyEmail = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }
    setLoading(true);
    try {
      const profile = await getBoarderProfileByEmail(email.trim());
      if (!profile) {
        throw new Error("No boarder found with that email");
      }
      setGreetName(profile.name);
      setEmailVerified(true);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to find account");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email first");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Error", "New password must be at least 8 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New password and confirm password do not match");
      return;
    }

    setLoading(true);
    try {
      const result = await updatePasswordWithEmailFlow(email.trim(), currentPassword, newPassword);
      if (result.success) {
        Alert.alert(
          "Success",
          "Password changed! Please login again.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/auth/boarder"),
            },
          ],
          { cancelable: false }
        );
      } else {
        throw new Error((result as any).error || "Failed to update password");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordInput = (
    value: string,
    onChange: (t: string) => void,
    placeholder: string,
    visible: boolean,
    setVisible: (v: boolean) => void
  ) => (
    <View className="relative">
      <View className="flex-row items-center bg-white/90 rounded-xl px-4 py-3">
        <Lock size={18} color="#111827" />
        <TextInput
          className="flex-1 ml-3 text-base text-gray-800"
          placeholder={placeholder}
          secureTextEntry={!visible}
          value={value}
          onChangeText={onChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={() => setVisible(!visible)}>
          {visible ? <EyeOff size={18} color="#111827" /> : <Eye size={18} color="#111827" />}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-transparent" edges={['bottom', 'left', 'right']}>
      <LinearGradient colors={["#0f172a", "#1e293b"]} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1 p-6">
              <TouchableOpacity className="mt-5" onPress={() => router.back()}>
                <Text className="text-white text-base">← Back</Text>
              </TouchableOpacity>

              <View className="items-center mt-10 mb-10">
                <Text className="text-3xl font-bold text-white mt-4">Change Password</Text>
                <Text className="text-base text-slate-200 text-center mt-2">Update your account password</Text>
                {greetName ? (
                  <Text className="text-lg text-slate-100 mt-3">Hey {greetName} 👋</Text>
                ) : null}
              </View>

              <View className="gap-5">
                {/* Email first */}
                <View className="relative">
                  <View className="flex-row items-center bg-white/90 rounded-xl px-4 py-3">
                    <TextInput
                      className="flex-1 text-base text-gray-800"
                      placeholder="Email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                </View>

                {!emailVerified ? (
                  <TouchableOpacity
                    className={`bg-orange-600 rounded-xl py-4 items-center ${
                      loading ? "opacity-60" : ""
                    }`}
                    onPress={handleVerifyEmail}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text className="text-white text-base font-semibold">Continue</Text>
                    )}
                  </TouchableOpacity>
                ) : null}

                {emailVerified ? (
                  <>
                    {renderPasswordInput(
                      currentPassword,
                      setCurrentPassword,
                      "Current password",
                      showCurrent,
                      setShowCurrent
                    )}
                    {renderPasswordInput(
                      newPassword,
                      setNewPassword,
                      "New password",
                      showNew,
                      setShowNew
                    )}
                    {renderPasswordInput(
                      confirmPassword,
                      setConfirmPassword,
                      "Confirm new password",
                      showNew,
                      setShowNew
                    )}

                    <TouchableOpacity
                      className={`bg-orange-600 rounded-xl py-4 items-center mt-3 ${
                        loading ? "opacity-60" : ""
                      }`}
                      onPress={handleChangePassword}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text className="text-white text-base font-semibold">Update Password</Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : null}

                <TouchableOpacity
                  className={`bg-orange-600 rounded-xl py-4 items-center mt-3 ${
                    loading ? "opacity-60" : ""
                  }`}
                  onPress={handleChangePassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text className="text-white text-base font-semibold">
                      Update Password
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

export default UpdateBoarderPassword;