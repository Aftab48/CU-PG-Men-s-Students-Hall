// app/(manager)/(tabs)/expenses.tsx

import { createExpense } from "@/lib/actions";
import { formatDateForDisplay } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Calendar, Camera, LogOut, RefreshCcw, Save } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

function ExpenseLogging() {
  // Use local date instead of UTC
  const getLocalDateString = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };
  
  const [date, setDate] = useState(getLocalDateString());
  const [dateObj, setDateObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState<
    | "fish"
    | "chicken"
    | "paneer"
    | "veg"
    | "gas"
    | "grocery"
    | "eggs"
    | "rice/potato"
    | "misc"
    | "grand"
    | "prev"
    | "staff"
  >("grocery");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [receipt, setReceipt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  const handleRefresh = () => {
    // Clear form for new entry
    setAmount("");
    setDescription("");
    setReceipt(null);
    setCategory("grocery");
    const now = new Date();
    setDateObj(now);
    setDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setReceipt(result.assets[0].uri);
  };

  const handleSave = async () => {
    Keyboard.dismiss();

    if (!amount.trim() || !description.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    if (!user) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    setLoading(true);
    try {
      const result = await createExpense({
        date,
        category,
        amount: parseFloat(amount.trim()),
        description: description.trim(),
        receipt: receipt || undefined,
      });

      if (result.success) {
        setAmount("");
        setDescription("");
        setReceipt(null);
        const successMessage = receipt 
          ? "Expense entry and receipt saved successfully!" 
          : "Expense entry saved successfully!";
        Alert.alert("Success", successMessage);
      } else {
        Alert.alert("Error", result.error || "Failed to save expense");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save expense");
    } finally {
      setLoading(false);
    }
  };

  const onChangeDate = (_event: any, selectedDate?: Date) => {
    const currentDate = selectedDate ?? dateObj;
    if (Platform.OS !== "ios") setShowDatePicker(false);
    setDateObj(currentDate);
    // Use local date instead of UTC
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    setDate(`${year}-${month}-${day}`);
  };

  const expenseCategories: (| "fish"
    | "chicken"
    | "paneer"
    | "veg"
    | "gas"
    | "grocery"
    | "eggs"
    | "rice/potato"
    | "misc"
    | "grand"
    | "prev"
    | "staff")[] = [
    "fish",
    "chicken",
    "paneer",
    "veg",
    "gas",
    "grocery",
    "eggs",
    "rice/potato",
    "misc",
    "grand",
    "prev",
    "staff",
  ];

  return (
    <ScrollView
      className="flex-1 bg-white-100"
      keyboardShouldPersistTaps="handled"
    >
      <LinearGradient
        colors={["#1E3A8A", "#3B82F6"]}
        className="px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 pt-12 sm:pt-14 md:pt-15"
      >
        <View className="flex-row justify-between items-start mb-3 sm:mb-4">
          <View className="flex-1">
            <Text className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
              Daily Expense
            </Text>
            <Text className="text-sm sm:text-base md:text-lg text-white/80 mt-0.5 sm:mt-1">
              Log your daily expenses
            </Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleRefresh}
              className="bg-white/20 rounded-full p-2.5 sm:p-3 md:p-3.5"
            >
              <RefreshCcw size={20} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              className="bg-white/20 rounded-full p-2.5 sm:p-3 md:p-3.5"
            >
              <LogOut size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <View className="px-3 py-3 sm:px-4 sm:py-4 md:px-5 md:py-5 bg-white-100">
        <View className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-lg">
          {/* Date */}
          <Text className="text-base sm:text-lg md:text-xl font-semibold text-dark-100 mb-4 sm:mb-5">
            Entry Details
          </Text>
          <View className="mb-4 sm:mb-5">
            <Text className="text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">
              Date
            </Text>
            <TouchableOpacity
              className="flex-row items-center border border-gray-300 rounded-lg px-2.5 py-2.5 sm:px-3 sm:py-3"
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Calendar size={18} color="#6b7280" />
              <Text className="ml-2 text-sm sm:text-base text-dark-100">
                {formatDateForDisplay(date)}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dateObj}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "calendar"}
                onChange={onChangeDate}
              />
            )}
          </View>

          {/* Category */}
          <View className="mb-4 sm:mb-5">
            <Text className="text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">
              Category
            </Text>

            <View className="border border-gray-300 rounded-lg overflow-hidden">
              <Picker
                selectedValue={category}
                onValueChange={(itemValue) => setCategory(itemValue)}
                style={{ height: 50 }}
                itemStyle={{ height: 50 }}
              >
                {expenseCategories.map((cat) => (
                  <Picker.Item
                    key={cat}
                    label={cat.charAt(0).toUpperCase() + cat.slice(1)}
                    value={cat}
                  />
                ))}
              </Picker>
            </View>
            <View className="border border-gray-300 rounded-lg px-3 py-2 mb-2">
              <Text className="text-sm sm:text-base text-gray-500">
                Selected:
              </Text>
              <Text className="text-base sm:text-lg font-bold text-dark-100 capitalize">
                {category}
              </Text>
            </View>
          </View>

          {/* Amount */}
          <View className="mb-4 sm:mb-5">
            <Text className="text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">
              Amount Spent *
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-2.5 py-2.5 sm:px-3 sm:py-3 text-sm sm:text-base text-dark-100"
              value={amount}
              onChangeText={setAmount}
              placeholder="Enter amount"
              keyboardType="numeric"
            />
          </View>

          {/* Description */}
          <View className="mb-4 sm:mb-5">
            <Text className="text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">
              Description *
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-2.5 py-2.5 sm:px-3 sm:py-3 text-sm sm:text-base text-dark-100 h-20"
              value={description}
              onChangeText={setDescription}
              placeholder="Enter description"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Receipt */}
          <View className="mb-4 sm:mb-5">
            <Text className="text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-1.5 sm:mb-2">
              Receipt/Bill
            </Text>
            <TouchableOpacity
              className="flex-row items-center justify-center py-3 px-4 sm:py-4 sm:px-5 border-2 border-dashed border-primary rounded-lg gap-1.5 sm:gap-2"
              onPress={pickImage}
            >
              <Camera size={20} color="#3B82F6" />
              <Text className="text-sm sm:text-base text-primary font-medium">
                {receipt ? "Change Image" : "Upload Receipt"}
              </Text>
            </TouchableOpacity>
            {receipt && (
              <Image
                source={{ uri: receipt }}
                className="w-full h-44 sm:h-52 rounded-lg mt-2.5 sm:mt-3"
                resizeMode="contain"
              />
            )}
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

export default ExpenseLogging;