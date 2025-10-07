// app/(manager)/(tabs)/expenses.tsx

import { createExpense } from "@/lib/actions";
import { useAuthStore } from "@/stores/auth-store";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar, Camera, Save } from "lucide-react-native";
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
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
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

  const { user } = useAuthStore();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
        Alert.alert("Success", "Expense entry saved successfully!");
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
    setDate(new Date(currentDate).toISOString().split("T")[0]);
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
      className="flex-1 bg-slate-50"
      keyboardShouldPersistTaps="handled"
    >
      <LinearGradient colors={["#1e40af", "#3b82f6"]} className="p-6 pt-15">
        <Text className="text-2xl font-bold text-white">Daily Expense</Text>
        <Text className="text-base text-slate-200 mt-1">
          Log your daily expenses
        </Text>
      </LinearGradient>

      <View className="p-4 bg-slate-50">
        <View className="bg-white rounded-2xl p-5 shadow-lg">
          {/* Date */}
          <Text className="text-lg font-semibold text-gray-800 mb-5">
            Entry Details
          </Text>
          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">Date</Text>
            <TouchableOpacity
              className="flex-row items-center border border-gray-300 rounded-lg px-3 py-3"
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Calendar size={20} color="#6b7280" />
              <Text className="ml-2 text-base text-gray-800">{date}</Text>
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
          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">Category</Text>
            <View className="border border-gray-300 rounded-lg overflow-hidden">
              <Picker
                selectedValue={category}
                onValueChange={(itemValue) => setCategory(itemValue)}
              >
                {expenseCategories.map((cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Amount */}
          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Amount Spent *
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-3 text-base text-gray-800"
              value={amount}
              onChangeText={setAmount}
              placeholder="Enter amount"
              keyboardType="numeric"
            />
          </View>

          {/* Description */}
          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Description *
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-3 text-base text-gray-800 h-20"
              value={description}
              onChangeText={setDescription}
              placeholder="Enter description"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Receipt */}
          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Receipt/Bill
            </Text>
            <TouchableOpacity
              className="flex-row items-center justify-center py-4 px-5 border-2 border-dashed border-blue-700 rounded-lg gap-2"
              onPress={pickImage}
            >
              <Camera size={24} color="#1e40af" />
              <Text className="text-base text-blue-700 font-medium">
                {receipt ? "Change Image" : "Upload Receipt"}
              </Text>
            </TouchableOpacity>
            {receipt && (
              <Image
                source={{ uri: receipt }}
                className="w-full h-52 rounded-lg mt-3"
                resizeMode="contain"
              />
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            className={`flex-row items-center justify-center py-4 rounded-xl gap-2 mt-5 ${
              loading ? "bg-emerald-400" : "bg-emerald-600"
            }`}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Save size={20} color="#ffffff" />
                <Text className="text-white text-base font-semibold">
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