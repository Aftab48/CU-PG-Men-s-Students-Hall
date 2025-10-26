// app/(manager)/(tabs)/approve.tsx

import { approveBoarder, approvePayment, approveStaff, getBoarderProfileById, getPendingBoarders, getPendingPayments, getPendingStaff, rejectPayment } from "@/lib/actions";
import { formatDateForDisplay } from "@/lib/utils";
import { BoarderProfile, StaffProfile } from "@/types";
import { useFocusEffect } from "expo-router";
import { CheckCircle, DollarSign, Image as ImageIcon, Mail, Phone, User, UserCheck, XCircle } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TabType = "boarders" | "staff" | "payments";

export default function ApproveBoardersScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("boarders");
  const [pendingBoarders, setPendingBoarders] = useState<BoarderProfile[]>([]);
  const [pendingStaff, setPendingStaff] = useState<StaffProfile[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  const loadPendingPayments = async (forceRefresh: boolean = false) => {
    try {
      if (!forceRefresh) setLoading(true);
      const payments = await getPendingPayments(forceRefresh);
      
      // Fetch boarder names and phone numbers for each payment
      const paymentsWithBoarderInfo = await Promise.all(
        payments.map(async (payment: any) => {
          try {
            const boarder = await getBoarderProfileById(payment.boarderId, forceRefresh);
            return {
              ...payment,
              boarderName: boarder?.name || "Unknown",
              boarderPhone: boarder?.phone || null,
            };
          } catch (err) {
            console.error("Error fetching boarder for payment:", err);
            return {
              ...payment,
              boarderName: "Unknown",
              boarderPhone: null,
            };
          }
        })
      );
      
      setPendingPayments(paymentsWithBoarderInfo);
    } catch (error) {
      console.error("Failed to load pending payments:", error);
      Alert.alert("Error", "Failed to load pending payments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCall = (phoneNumber: string | undefined, name: string) => {
    if (!phoneNumber) {
      Alert.alert("No Phone Number", `No phone number available for ${name}`);
      return;
    }

    Alert.alert(
      "Call " + name,
      `Phone: ${phoneNumber}\n\nWould you like to call this number?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call",
          onPress: () => {
            const phoneUrl = `tel:${phoneNumber}`;
            Linking.canOpenURL(phoneUrl)
              .then((supported) => {
                if (supported) {
                  Linking.openURL(phoneUrl);
                } else {
                  Alert.alert("Error", "Phone call is not supported on this device");
                }
              })
              .catch((err) => {
                console.error("Error opening phone dialer:", err);
                Alert.alert("Error", "Failed to open phone dialer");
              });
          },
        },
      ]
    );
  };

  const loadData = async (forceRefresh: boolean = false) => {
    if (activeTab === "boarders") {
      await loadPendingBoarders(forceRefresh);
    } else if (activeTab === "staff") {
      await loadPendingStaff(forceRefresh);
    } else {
      await loadPendingPayments(forceRefresh);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleApprovePayment = async (
    paymentId: string,
    boarderId: string,
    amount: number,
    boarderName: string
  ) => {
    Alert.alert(
      "Approve Payment",
      `Approve payment of ₹${amount.toLocaleString()} from ${boarderName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            setApprovingId(paymentId);
            try {
              const result = await approvePayment(paymentId, boarderId, amount);
              if (result.success) {
                Alert.alert(
                  "Success",
                  `Payment of ₹${amount.toLocaleString()} approved! Boarder's advance balance has been updated.`
                );
                await loadPendingPayments(true);
              } else {
                Alert.alert("Error", result.error || "Failed to approve payment");
              }
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to approve payment");
            } finally {
              setApprovingId(null);
            }
          },
        },
      ]
    );
  };

  const handleRejectPayment = async (
    paymentId: string,
    boarderName: string,
    amount: number
  ) => {
    Alert.alert(
      "Reject Payment",
      `Are you sure you want to reject payment of ₹${amount.toLocaleString()} from ${boarderName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            setApprovingId(paymentId);
            try {
              const result = await rejectPayment(paymentId);
              if (result.success) {
                Alert.alert("Success", "Payment has been rejected");
                await loadPendingPayments(true);
              } else {
                Alert.alert("Error", result.error || "Failed to reject payment");
              }
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to reject payment");
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
          {item.phone && (
            <TouchableOpacity
              className="bg-green-100 p-2 rounded-full"
              onPress={() => handleCall(item.phone, item.name)}
            >
              <Phone size={20} color="#10B981" />
            </TouchableOpacity>
          )}
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

  const renderPaymentCard = ({ item }: { item: any }) => {
    const isApproving = approvingId === item.$id;

    return (
      <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-200">
        <View className="flex-row items-center mb-3">
          <View className="bg-green-100 p-2 rounded-full mr-3">
            <DollarSign size={24} color="#10B981" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              {item.boarderName}
            </Text>
            <Text className="text-sm text-gray-500 mt-0.5">
              Pending Payment Approval
            </Text>
          </View>
          {item.boarderPhone && (
            <TouchableOpacity
              className="bg-green-100 p-2 rounded-full"
              onPress={() => handleCall(item.boarderPhone, item.boarderName)}
            >
              <Phone size={20} color="#10B981" />
            </TouchableOpacity>
          )}
        </View>

        <View className="space-y-2 mb-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-700">Amount:</Text>
            <Text className="text-xl font-bold text-green-600">
              ₹{item.amount.toLocaleString()}
            </Text>
          </View>
          
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-700">Submitted:</Text>
            <Text className="text-sm text-gray-900">
              {formatDateForDisplay(item.$createdAt)}
            </Text>
          </View>

          {item.paymentURL && (
            <View className="mt-2">
              <Text className="text-sm text-gray-700 mb-2">Payment Screenshot:</Text>
              <TouchableOpacity onPress={() => setSelectedImage(item.paymentURL)}>
                <Image
                  source={{ uri: item.paymentURL }}
                  className="w-full h-48 rounded-lg"
                  resizeMode="cover"
                />
                <View className="absolute inset-0 bg-black/10 rounded-lg items-center justify-center">
                  <View className="bg-white/90 rounded-full p-2">
                    <ImageIcon size={24} color="#3B82F6" />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View className="flex-row gap-3">
          <TouchableOpacity
            className={`flex-1 bg-green-500 rounded-lg py-3 flex-row items-center justify-center ${
              isApproving ? "opacity-60" : ""
            }`}
            onPress={() =>
              handleApprovePayment(
                item.$id,
                item.boarderId,
                item.amount,
                item.boarderName
              )
            }
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
            className={`flex-1 bg-red-500 rounded-lg py-3 flex-row items-center justify-center ${
              isApproving ? "opacity-60" : ""
            }`}
            onPress={() =>
              handleRejectPayment(item.$id, item.boarderName, item.amount)
            }
            disabled={isApproving}
          >
            <XCircle size={18} color="#ffffff" />
            <Text className="text-white font-semibold ml-2">Reject</Text>
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

        <TouchableOpacity
          className={`flex-1 py-4 items-center ${
            activeTab === "payments" ? "border-b-2 border-green-600" : ""
          }`}
          onPress={() => setActiveTab("payments")}
        >
          <Text
            className={`font-semibold ${
              activeTab === "payments" ? "text-green-600" : "text-gray-600"
            }`}
          >
            Payments ({pendingPayments.length})
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
      ) : activeTab === "staff" ? (
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
      ) : (
        pendingPayments.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <CheckCircle size={64} color="#10B981" />
            <Text className="text-xl font-semibold text-gray-900 mt-4">
              All Caught Up!
            </Text>
            <Text className="text-gray-600 text-center mt-2">
              There are no pending payment approvals at the moment.
            </Text>
          </View>
        ) : (
          <FlatList
            data={pendingPayments}
            renderItem={renderPaymentCard}
            keyExtractor={(item) => item.$id}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#10B981"]}
              />
            }
            ListHeaderComponent={
              <View className="mb-3">
                <Text className="text-sm text-gray-600">
                  {pendingPayments.length} payment{pendingPayments.length !== 1 ? "s" : ""} waiting for approval
                </Text>
              </View>
            }
          />
        )
      )}

      {/* Image Preview Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View className="flex-1 bg-black/90 justify-center items-center">
          <TouchableOpacity
            className="absolute top-12 right-4 bg-white/20 rounded-full p-3 z-10"
            onPress={() => setSelectedImage(null)}
          >
            <Text className="text-white text-lg font-bold">✕</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={{ width: "90%", height: "80%" }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
