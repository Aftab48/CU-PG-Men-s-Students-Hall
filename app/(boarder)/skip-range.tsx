// app/(boarder)/skip-range.tsx

import { setMealStatusForDateRange } from "@/lib/actions";
import { useAuthStore } from "@/stores/auth-store";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function getTomorrow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfMonth(from: Date): Date {
  const year = from.getFullYear();
  const month = from.getMonth();
  const end = new Date(year, month + 1, 0); // last day of month
  end.setHours(23, 59, 59, 999);
  return end;
}

function clampDate(value: Date, min: Date, max: Date): Date {
  if (value < min) return new Date(min);
  if (value > max) return new Date(max);
  return value;
}

export default function SkipDateRangeScreen() {
  const minDate = useMemo(() => getTomorrow(), []);
  const maxDate = useMemo(() => getEndOfMonth(new Date()), []);

  const [submitting, setSubmitting] = useState(false);
  const [startDate, setStartDate] = useState<Date>(minDate);
  const [endDate, setEndDate] = useState<Date>(maxDate);
  const { user } = useAuthStore();

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const onChangeStart = (_: any, selected?: Date) => {
    if (submitting) return;
    setShowStartPicker(Platform.OS === "ios");
    if (!selected) return;
    const clamped = clampDate(selected, minDate, maxDate);
    setStartDate(clamped);
    if (clamped > endDate) setEndDate(clampDate(clamped, minDate, maxDate));
  };

  const onChangeEnd = (_: any, selected?: Date) => {
    if (submitting) return;
    setShowEndPicker(Platform.OS === "ios");
    if (!selected) return;
    const clamped = clampDate(selected, minDate, maxDate);
    if (clamped < startDate) {
      Alert.alert("Invalid range", "End date cannot be before start date.");
      return;
    }
    setEndDate(clamped);
  };

  const formatLocalYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Not signed in", "Please sign in again.");
      return;
    }
    if (startDate < minDate) {
      Alert.alert("Invalid start", "Start date cannot be earlier than tomorrow.");
      return;
    }
    if (endDate > maxDate) {
      Alert.alert("Invalid end", "End date cannot be after end of month.");
      return;
    }
    if (endDate < startDate) {
      Alert.alert("Invalid range", "End date must be on or after start date.");
      return;
    }

    try {
      setSubmitting(true);
      const from = formatLocalYMD(startDate);
      const to = formatLocalYMD(endDate);
      // Turn OFF both brunch and dinner within range
      const result = await setMealStatusForDateRange(user.id, from, to, {
        brunch: true,
        dinner: true,
        status: "OFF",
      });
      if (!result?.success) {
        Alert.alert("Error", result?.error || "Failed to update meals");
        return;
      }
      Alert.alert("Saved", `Skipped meals from ${from} to ${to}.`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="bg-emerald-600 p-6 pt-15">
        <Text className="text-2xl font-bold text-white">Skip Date Range</Text>
        <Text className="text-base text-emerald-100 mt-1">
          Select a start and end date within this month.
        </Text>
      </View>

      <View className="p-4">
        {submitting && (
          <View className="bg-white rounded-xl p-4 mb-4 items-center">
            <ActivityIndicator size="small" color="#059669" />
            <Text className="text-sm text-gray-600 mt-2">Saving...</Text>
          </View>
        )}
        <View className="bg-white rounded-2xl p-5 shadow-lg mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-2">Start date</Text>
          <Text className="text-sm text-gray-600 mb-4">
            Must be on or after {formatLocalYMD(minDate)}
          </Text>

          <TouchableOpacity
            className={`py-3 px-4 rounded-xl border-2 border-gray-200 ${
              submitting ? "opacity-50" : ""
            }`}
            onPress={() => !submitting && setShowStartPicker(true)}
            disabled={submitting}
          >
            <Text className="text-base text-gray-800">{formatLocalYMD(startDate)}</Text>
          </TouchableOpacity>

          {showStartPicker && !submitting && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              minimumDate={minDate}
              maximumDate={maxDate}
              onChange={onChangeStart}
            />
          )}
        </View>

        <View className="bg-white rounded-2xl p-5 shadow-lg mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">End date</Text>
          <Text className="text-sm text-gray-600 mb-4">
            Must be on or before {formatLocalYMD(maxDate)}
          </Text>

          <TouchableOpacity
            className={`py-3 px-4 rounded-xl border-2 border-gray-200 ${
              submitting ? "opacity-50" : ""
            }`}
            onPress={() => !submitting && setShowEndPicker(true)}
            disabled={submitting}
          >
            <Text className="text-base text-gray-800">{formatLocalYMD(endDate)}</Text>
          </TouchableOpacity>

          {showEndPicker && !submitting && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              minimumDate={minDate}
              maximumDate={maxDate}
              onChange={onChangeEnd}
            />
          )}
        </View>

        <TouchableOpacity
          className="py-4 px-4 rounded-xl bg-emerald-600 items-center"
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white text-base font-semibold">Save</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="py-4 px-4 rounded-xl bg-gray-100 items-center mt-3"
          onPress={() => router.back()}
          disabled={submitting}
        >
          <Text className="text-gray-800 text-base font-medium">Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}


