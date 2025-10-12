// app/(manager)/(tabs)/store-out.tsx

import { createStoreOut } from "@/lib/actions/store.actions";
import { useAuthStore } from "@/stores/auth-store";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { LogOut, Save } from "lucide-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

function StoreOut() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  const handleSave = async () => {
    Keyboard.dismiss();

    if (!description.trim()) {
      Alert.alert("Error", "Please enter a description");
      return;
    }
    if (!user) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    setLoading(true);
    try {
      const result = await createStoreOut({
        description: description.trim(),
      });

      if (result.success) {
        setDescription("");
        Alert.alert("Success", "Store-out entry saved successfully!");
      } else {
        Alert.alert("Error", result.error || "Failed to save store-out entry");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save store-out entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white-100"
      keyboardShouldPersistTaps="handled"
    >
      <LinearGradient colors={["#1E3A8A", "#3B82F6"]} className="px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 pt-12 sm:pt-14 md:pt-15">
        <View className="flex-row justify-between items-start mb-3 sm:mb-4">
          <View className="flex-1">
            <Text className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Store-out</Text>
            <Text className="text-sm sm:text-base md:text-lg text-white/80 mt-0.5 sm:mt-1">
              Record items taken from store
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-white/20 rounded-full p-2.5 sm:p-3 md:p-3.5"
          >
            <LogOut size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View className="px-3 py-3 sm:px-4 sm:py-4 md:px-5 md:py-5 bg-white-100">
        <View className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-lg">
          {/* Description */}
          <Text className="text-base sm:text-lg md:text-xl font-semibold text-dark-100 mb-4 sm:mb-5">
            Entry Details
          </Text>
          <View className="mb-4 sm:mb-5">
            <Text className="text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">
              Description *
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-2.5 py-2.5 sm:px-3 sm:py-3 text-sm sm:text-base text-dark-100 h-32"
              value={description}
              onChangeText={setDescription}
              placeholder="Enter what was taken from store..."
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            className={`flex-row items-center justify-center py-3 sm:py-4 rounded-xl gap-1.5 sm:gap-2 mt-4 sm:mt-5 ${
              loading ? "opacity-60 bg-primary" : "bg-primary"
            }`}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Save size={18} color="#ffffff" />
                <Text className="text-white text-sm sm:text-base font-semibold">
                  Save Entry
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

export default StoreOut;

