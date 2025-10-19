// app/(manager)/(tabs)/approve.tsx

import { approveBoarder, approveStaff, getPendingBoarders, getPendingStaff } from "@/lib/actions";
import { BoarderProfile, StaffProfile } from "@/types";
import { useFocusEffect } from "expo-router";
import { CheckCircle, Mail, Phone, User, UserCheck, XCircle } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TabType = "boarders" | "staff";

export default function ApproveBoardersScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("boarders");
  const [pendingBoarders, setPendingBoarders] = useState<BoarderProfile[]>([]);
  const [pendingStaff, setPendingStaff] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const loadPendingBoarders = async (forceRefresh: boolean = false) => {
    try {
      if (!forceRefresh) setLoading(true);
      const boarders = await getPendingBoarders(forceRefresh);
      setPendingBoarders(boarders);
    } catch (error) {
      console.error("Failed to load pending boarders:", error);
      Alert.alert("Error", "Failed to load pending boarders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadPendingStaff = async (forceRefresh: boolean = false) => {
    try {
      if (!forceRefresh) setLoading(true);
      const staff = await getPendingStaff(forceRefresh);
      setPendingStaff(staff);
    } catch (error) {
      console.error("Failed to load pending staff:", error);
      Alert.alert("Error", "Failed to load pending staff");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadData = async (forceRefresh: boolean = false) => {
    if (activeTab === "boarders") {
      await loadPendingBoarders(forceRefresh);
    } else {
      await loadPendingStaff(forceRefresh);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [activeTab])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const handleApproveBoarder = async (profileId: string, name: string) => {
    Alert.alert(
      "Approve Boarder",
      `Are you sure you want to approve ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            setApprovingId(profileId);
            try {
              const result = await approveBoarder(profileId);
              if (result.success) {
                Alert.alert("Success", `${name} has been approved!`);
                await loadPendingBoarders(true);
              } else {
                Alert.alert("Error", result.error || "Failed to approve boarder");
              }
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to approve boarder");
            } finally {
              setApprovingId(null);
            }
          },
        },
      ]
    );
  };

  const handleApproveStaff = async (profileId: string, name: string) => {
    Alert.alert(
      "Approve Staff",
      `Are you sure you want to approve ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            setApprovingId(profileId);
            try {
              const result = await approveStaff(profileId);
              if (result.success) {
                Alert.alert("Success", `${name} has been approved!`);
                await loadPendingStaff(true);
              } else {
                Alert.alert("Error", result.error || "Failed to approve staff");
              }
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to approve staff");
            } finally {
              setApprovingId(null);
            }
          },
        },
      ]
    );
  };

  const renderBoarderCard = ({ item }: { item: BoarderProfile }) => {
    const isApproving = approvingId === item.$id;

    return (
      <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-200">
        <View className="flex-row items-center mb-3">
          <View className="bg-blue-100 p-2 rounded-full mr-3">
            <User size={24} color="#3B82F6" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              {item.name}
            </Text>
            <Text className="text-sm text-gray-500 mt-0.5">
              Pending Approval
            </Text>
          </View>
        </View>

        <View className="space-y-2 mb-4">
          <View className="flex-row items-center">
            <Mail size={16} color="#6B7280" />
            <Text className="text-sm text-gray-700 ml-2">{item.email}</Text>
          </View>
          
          {item.phone && (
            <View className="flex-row items-center mt-2">
              <Phone size={16} color="#6B7280" />
              <Text className="text-sm text-gray-700 ml-2">{item.phone}</Text>
            </View>
          )}

          {item.roomNumber && (
            <View className="flex-row items-center mt-2">
              <Text className="text-sm text-gray-700">
                <Text className="font-semibold">Room:</Text> {item.roomNumber}
              </Text>
            </View>
          )}

          <View className="flex-row items-center mt-2">
            <Text className="text-sm text-gray-700">
              <Text className="font-semibold">Meal Preference:</Text>{" "}
              {item.mealPreference.charAt(0).toUpperCase() +
                item.mealPreference.slice(1)}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          <TouchableOpacity
            className={`flex-1 bg-green-500 rounded-lg py-3 flex-row items-center justify-center ${
              isApproving ? "opacity-60" : ""
            }`}
            onPress={() => handleApproveBoarder(item.$id, item.name)}
            disabled={isApproving}
          >
            {isApproving ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <CheckCircle size={18} color="#ffffff" />
                <Text className="text-white font-semibold ml-2">Approve</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-gray-200 rounded-lg py-3 flex-row items-center justify-center"
            disabled={isApproving}
          >
            <XCircle size={18} color="#6B7280" />
            <Text className="text-gray-700 font-semibold ml-2">Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStaffCard = ({ item }: { item: StaffProfile }) => {
    const isApproving = approvingId === item.$id;

    return (
      <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-200">
        <View className="flex-row items-center mb-3">
          <View className="bg-purple-100 p-2 rounded-full mr-3">
            <UserCheck size={24} color="#7c3aed" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              {item.name}
            </Text>
            <Text className="text-sm text-gray-500 mt-0.5">
              Pending Approval
            </Text>
          </View>
        </View>

        <View className="space-y-2 mb-4">
          <View className="flex-row items-center">
            <Mail size={16} color="#6B7280" />
            <Text className="text-sm text-gray-700 ml-2">{item.email}</Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          <TouchableOpacity
            className={`flex-1 bg-green-500 rounded-lg py-3 flex-row items-center justify-center ${
              isApproving ? "opacity-60" : ""
            }`}
            onPress={() => handleApproveStaff(item.$id, item.name)}
            disabled={isApproving}
          >
            {isApproving ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <CheckCircle size={18} color="#ffffff" />
                <Text className="text-white font-semibold ml-2">Approve</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-gray-200 rounded-lg py-3 flex-row items-center justify-center"
            disabled={isApproving}
          >
            <XCircle size={18} color="#6B7280" />
            <Text className="text-gray-700 font-semibold ml-2">Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-600 mt-4">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      <View className="bg-primary px-6 py-4">
        <Text className="text-2xl font-bold text-white">Approve Users</Text>
        <Text className="text-white/80 text-sm mt-1">
          Review and approve new registrations
        </Text>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-gray-200">
        <TouchableOpacity
          className={`flex-1 py-4 items-center ${
            activeTab === "boarders" ? "border-b-2 border-blue-600" : ""
          }`}
          onPress={() => setActiveTab("boarders")}
        >
          <Text
            className={`font-semibold ${
              activeTab === "boarders" ? "text-blue-600" : "text-gray-600"
            }`}
          >
            Boarders ({pendingBoarders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-4 items-center ${
            activeTab === "staff" ? "border-b-2 border-purple-600" : ""
          }`}
          onPress={() => setActiveTab("staff")}
        >
          <Text
            className={`font-semibold ${
              activeTab === "staff" ? "text-purple-600" : "text-gray-600"
            }`}
          >
            Staff ({pendingStaff.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "boarders" ? (
        pendingBoarders.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <CheckCircle size={64} color="#10B981" />
            <Text className="text-xl font-semibold text-gray-900 mt-4">
              All Caught Up!
            </Text>
            <Text className="text-gray-600 text-center mt-2">
              There are no pending boarder approvals at the moment.
            </Text>
          </View>
        ) : (
          <FlatList
            data={pendingBoarders}
            renderItem={renderBoarderCard}
            keyExtractor={(item) => item.$id}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#3B82F6"]}
              />
            }
            ListHeaderComponent={
              <View className="mb-3">
                <Text className="text-sm text-gray-600">
                  {pendingBoarders.length} boarder{pendingBoarders.length !== 1 ? "s" : ""} waiting for approval
                </Text>
              </View>
            }
          />
        )
      ) : (
        pendingStaff.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <CheckCircle size={64} color="#10B981" />
            <Text className="text-xl font-semibold text-gray-900 mt-4">
              All Caught Up!
            </Text>
            <Text className="text-gray-600 text-center mt-2">
              There are no pending staff approvals at the moment.
            </Text>
          </View>
        ) : (
          <FlatList
            data={pendingStaff}
            renderItem={renderStaffCard}
            keyExtractor={(item) => item.$id}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#3B82F6"]}
              />
            }
            ListHeaderComponent={
              <View className="mb-3">
                <Text className="text-sm text-gray-600">
                  {pendingStaff.length} staff member{pendingStaff.length !== 1 ? "s" : ""} waiting for approval
                </Text>
              </View>
            }
          />
        )
      )}
    </SafeAreaView>
  );
}
