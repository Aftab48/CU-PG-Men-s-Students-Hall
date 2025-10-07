import {
  getManagerProfile,
  updateManagerPassword,
} from "@/lib/actions/manager.actions";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Eye, EyeOff, Lock } from "lucide-react-native";
import { useState } from "react";
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

function UpdateManagerPassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please fill in all fields");
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
      const profile = await getManagerProfile();
      if (!profile) throw new Error("Manager profile not found");
      if (oldPassword !== profile.password)
        throw new Error("Old password is incorrect");

      const result = await updateManagerPassword(newPassword);
      if (result.success) {
        Alert.alert(
          "Success",
          "Password changed! Please login.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/auth/manager"),
            },
          ],
          { cancelable: false }
        );
      } else {
        throw new Error(result.error || "Failed to update password");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordInput = (
    value: string,
    setValue: (text: string) => void,
    placeholder: string,
    show: boolean,
    setShow: (val: boolean) => void
  ) => (
    <View className="flex-row items-center bg-white rounded-xl px-4 py-1">
      <Lock size={20} color="#6b7280" className="mr-3" />
      <TextInput
        className="flex-1 text-base text-gray-800 py-4"
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={setValue}
        secureTextEntry={!show}
      />
      <TouchableOpacity className="p-1" onPress={() => setShow(!show)}>
        {show ? (
          <EyeOff size={20} color="#6b7280" />
        ) : (
          <Eye size={20} color="#6b7280" />
        )}
      </TouchableOpacity>
    </View>
  );

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
              <TouchableOpacity
                className="mt-5"
                onPress={() => router.replace("/auth/manager")}
              >
                <Text className="text-white text-base">← Back</Text>
              </TouchableOpacity>

              <View className="items-center mt-10 mb-10">
                <Lock size={50} color="#ffffff" />
                <Text className="text-3xl font-bold text-white mt-4">
                  Change Password
                </Text>
                <Text className="text-base text-slate-200 text-center mt-2">
                  Update your manager password
                </Text>
              </View>

              <View className="gap-5">
                {renderPasswordInput(
                  oldPassword,
                  setOldPassword,
                  "Old Password",
                  showOld,
                  setShowOld
                )}
                {renderPasswordInput(
                  newPassword,
                  setNewPassword,
                  "New Password",
                  showNew,
                  setShowNew
                )}
                {renderPasswordInput(
                  confirmPassword,
                  setConfirmPassword,
                  "Confirm New Password",
                  showConfirm,
                  setShowConfirm
                )}

                {/* Update Button */}
                <TouchableOpacity
                  className={`bg-orange-600 rounded-xl py-4 items-center mt-5 ${
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

export default UpdateManagerPassword;