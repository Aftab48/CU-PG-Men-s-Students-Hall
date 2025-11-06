// app/(boarder)/guest-meals.tsx

import { GUEST_MEAL_COST_CHICKEN, GUEST_MEAL_COST_NORMAL } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  const end = new Date(year, month + 1, 0);
  end.setHours(23, 59, 59, 999);
  return end;
}

function clampDate(value: Date, min: Date, max: Date): Date {
  if (value < min) return new Date(min);
  if (value > max) return new Date(max);
  return value;
}

function formatLocalYMD(d: Date) {
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLocalDMY(d: Date) {
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${day}-${month}-${year}`;
}

export default function GuestMealsScreen() {
  const minDate = useMemo(() => getTomorrow(), []);
  const maxDate = useMemo(() => getEndOfMonth(new Date()), []);

  const [submitting, setSubmitting] = useState(false);
  const [startDate, setStartDate] = useState<Date>(minDate);
  const [endDate, setEndDate] = useState<Date>(minDate);
  const { user } = useAuthStore();

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [brunchGuestsPerDay, setBrunchGuestsPerDay] = useState<string>("0");
  const [dinnerGuestsPerDay, setDinnerGuestsPerDay] = useState<string>("0");
  const [pricingType, setPricingType] = useState<"Chicken" | "Normal">("Chicken");

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

  const numDaysInclusive = useMemo(() => {
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const diffMs = end.getTime() - start.getTime();
    return Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;
  }, [startDate, endDate]);

  const totalGuestMeals = useMemo(() => {
    const brunch = parseInt(brunchGuestsPerDay || "0", 10) || 0;
    const dinner = parseInt(dinnerGuestsPerDay || "0", 10) || 0;
    return (brunch + dinner) * Math.max(0, numDaysInclusive);
  }, [brunchGuestsPerDay, dinnerGuestsPerDay, numDaysInclusive]);

  const unitCost = pricingType === "Chicken" ? GUEST_MEAL_COST_CHICKEN : GUEST_MEAL_COST_NORMAL;
  const estimatedTotal = totalGuestMeals * unitCost;

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
    const brunch = parseInt(brunchGuestsPerDay || "0", 10) || 0;
    const dinner = parseInt(dinnerGuestsPerDay || "0", 10) || 0;
    if (brunch <= 0 && dinner <= 0) {
      Alert.alert("No guests", "Enter at least one guest for brunch or dinner.");
      return;
    }

    try {
      setSubmitting(true);
      const from = formatLocalYMD(startDate);
      const to = formatLocalYMD(endDate);

      // TODO: integrate with backend action to persist guest meal logs per day and meal type
      // Example shape (not implemented):
      // await logGuestMealsForRange(user.id, from, to, { brunchPerDay: brunch, dinnerPerDay: dinner, pricingType });

      Alert.alert(
        "Guest meals",
        `Logged ${totalGuestMeals} guest meals (Rs. ${unitCost} each) from ${formatLocalDMY(startDate)} to ${formatLocalDMY(endDate)}.\n\nEstimated total: Rs. ${estimatedTotal}`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 bg-white-100">
        <View className="bg-navy p-6 pt-15">
          <Text className="text-2xl font-bold text-white">Guest Meals</Text>
          <Text className="text-base text-blue-200 mt-1">
            Select a date range and guests per day to log guest meals.
          </Text>
        </View>

      <View className="p-4">
        {submitting && (
          <View className="bg-white rounded-xl p-4 mb-4 items-center">
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text className="text-sm text-gray-100 mt-2">Saving...</Text>
          </View>
        )}

        <View className="bg-white rounded-2xl p-5 shadow-lg mb-4">
          <Text className="text-lg font-semibold text-dark-100 mb-2">Start date</Text>
          <Text className="text-sm text-gray-100 mb-4">
            Must be on or after {formatLocalDMY(minDate)}
          </Text>
          <TouchableOpacity
            className={`py-3 px-4 rounded-xl border-2 border-gray-200 ${
              submitting ? "opacity-50" : ""
            }`}
            onPress={() => !submitting && setShowStartPicker(true)}
            disabled={submitting}
          >
            <Text className="text-base text-dark-100">{formatLocalDMY(startDate)}</Text>
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
          <Text className="text-lg font-semibold text-dark-100 mb-2">End date</Text>
          <Text className="text-sm text-gray-100 mb-4">
            Must be on or before {formatLocalDMY(maxDate)}
          </Text>
          <TouchableOpacity
            className={`py-3 px-4 rounded-xl border-2 border-gray-200 ${
              submitting ? "opacity-50" : ""
            }`}
            onPress={() => !submitting && setShowEndPicker(true)}
            disabled={submitting}
          >
            <Text className="text-base text-dark-100">{formatLocalDMY(endDate)}</Text>
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

        <View className="bg-white rounded-2xl p-5 shadow-lg mb-4">
          <Text className="text-lg font-semibold text-dark-100 mb-2">Guests per day</Text>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-sm text-gray-100 mb-1">Brunch</Text>
              <TextInput
                className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base"
                inputMode="numeric"
                keyboardType="number-pad"
                placeholder="0"
                value={brunchGuestsPerDay}
                onChangeText={(t) => setBrunchGuestsPerDay(t.replace(/[^0-9]/g, ""))}
                editable={!submitting}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-gray-100 mb-1">Dinner</Text>
              <TextInput
                className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base"
                inputMode="numeric"
                keyboardType="number-pad"
                placeholder="0"
                value={dinnerGuestsPerDay}
                onChangeText={(t) => setDinnerGuestsPerDay(t.replace(/[^0-9]/g, ""))}
                editable={!submitting}
              />
            </View>
          </View>
        </View>

        <View className="bg-white rounded-2xl p-5 shadow-lg mb-4">
          <Text className="text-lg font-semibold text-dark-100 mb-3">Pricing type</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className={`flex-1 py-3 px-4 rounded-xl border-2 ${
                pricingType === "Chicken" ? "border-primary bg-primary/10" : "border-gray-200"
              }`}
              onPress={() => setPricingType("Chicken")}
              disabled={submitting}
            >
              <Text className="text-base text-dark-100">Chicken (Rs. {GUEST_MEAL_COST_CHICKEN})</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 px-4 rounded-xl border-2 ${
                pricingType === "Normal" ? "border-primary bg-primary/10" : "border-gray-200"
              }`}
              onPress={() => setPricingType("Normal")}
              disabled={submitting}
            >
              <Text className="text-base text-dark-100">Normal (Rs. {GUEST_MEAL_COST_NORMAL})</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="bg-white rounded-2xl p-5 shadow-lg mb-4">
          <Text className="text-base text-gray-100">Days</Text>
          <Text className="text-xl font-semibold text-dark-100">{numDaysInclusive}</Text>
          <View className="h-2" />
          <Text className="text-base text-gray-100">Total guest meals</Text>
          <Text className="text-xl font-semibold text-dark-100">{totalGuestMeals}</Text>
          <View className="h-2" />
          <Text className="text-base text-gray-100">Estimated total</Text>
          <Text className="text-xl font-semibold text-dark-100">Rs. {estimatedTotal}</Text>
        </View>

        <TouchableOpacity
          className="py-4 px-4 rounded-xl bg-primary items-center"
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
          <Text className="text-dark-100 text-base font-medium">Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>

      {/* Blur overlay */}
      <View style={styles.blurOverlay} />

      {/* Coming Soon Banner */}
      <View style={styles.comingSoonBanner}>
        <Text style={styles.comingSoonText}>Coming Soon</Text>
        <Text style={styles.comingSoonSubtext}>This feature is under development</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  blurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    zIndex: 1,
  },
  comingSoonBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1E3A8A",
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  comingSoonText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  comingSoonSubtext: {
    fontSize: 16,
    color: "#93C5FD",
    textAlign: "center",
    marginTop: 8,
  },
});


