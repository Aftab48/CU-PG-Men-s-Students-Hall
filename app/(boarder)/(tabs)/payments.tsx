// app/(boarder)/(tabs)/payments.tsx

import { getBoarderProfile, getPaymentsByBoarder, submitPayment } from "@/lib/actions";
import { formatDateForDisplay } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { Asset } from "expo-asset";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import {
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  Download,
  Image as ImageIcon,
  IndianRupee,
  LogOut,
  QrCode,
  Receipt,
  RefreshCcw,
  Share2,
  Upload,
  XCircle,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const UPI_ID = "mdalam4884-1@okaxis"; // Actual UPI ID
const QR_CODE_IMAGE = require("@/assets/images/qr.jpg"); // Local QR code image

function PaymentsScreen() {
  const { user, logout } = useAuthStore();
  const [boarderProfile, setBoarderProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadBoarderProfile(false); // Use cache on initial load
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadBoarderProfile = async (forceRefresh: boolean = false) => {
    if (!user) return;

    try {
      const profile = await getBoarderProfile(user.id, forceRefresh);
      setBoarderProfile(profile ?? null);
      
      // Load payment history
      if (profile?.$id) {
        const payments = await getPaymentsByBoarder(profile.$id, forceRefresh, "all");
        setPaymentHistory(payments);
      }
    } catch (error) {
      console.error("Failed to load boarder profile:", error);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  const handleRefresh = () => {
    loadBoarderProfile(true); // Force refresh on button click
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(UPI_ID);
    Alert.alert("Copied!", "UPI ID copied to clipboard");
  };

  const downloadQRCode = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please allow access to save QR code");
        return;
      }

      setLoading(true);
      
      // Load the asset and get its local URI
      const asset = Asset.fromModule(require("@/assets/images/qr.jpg"));
      await asset.downloadAsync();
      
      if (asset.localUri) {
        const savedAsset = await MediaLibrary.createAssetAsync(asset.localUri);
        await MediaLibrary.createAlbumAsync("Downloads", savedAsset, false);
        Alert.alert("Success", "QR code saved to gallery");
      } else {
        throw new Error("Could not load QR code asset");
      }
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Error", "Failed to download QR code");
    } finally {
      setLoading(false);
    }
  };

  const shareQRCode = async () => {
    try {
      setLoading(true);
      
      if (await Sharing.isAvailableAsync()) {
        // Load the asset and get its local URI
        const asset = Asset.fromModule(require("@/assets/images/qr.jpg"));
        await asset.downloadAsync();
        
        if (asset.localUri) {
          await Sharing.shareAsync(asset.localUri);
        } else {
          throw new Error("Could not load QR code asset");
        }
      } else {
        Alert.alert("Sharing not available", "Sharing is not available on this device");
      }
    } catch (error) {
      console.error("Share error:", error);
      Alert.alert("Error", "Failed to share QR code");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setScreenshot(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleSubmitPayment = async () => {
    if (!amount.trim()) {
      Alert.alert("Error", "Please enter payment amount");
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (!screenshot) {
      Alert.alert("Error", "Please upload payment screenshot");
      return;
    }

    if (!user || !boarderProfile) {
      Alert.alert("Error", "Profile not loaded");
      return;
    }

    setUploadLoading(true);
    try {
      const result = await submitPayment(
        user.id,
        boarderProfile.$id,
        paymentAmount,
        screenshot
      );

      if (result.success) {
        Alert.alert(
          "Success",
          `Payment of ₹${paymentAmount} submitted successfully! Your payment is pending manager approval. Once approved, your advance balance will be updated.`,
          [
            {
              text: "OK",
              onPress: () => {
                setAmount("");
                setScreenshot(null);
                loadBoarderProfile(true); // Force refresh after payment
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", result.error || "Failed to submit payment");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to submit payment");
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView className="flex-1 bg-white-100">
        <LinearGradient
          colors={["#1E3A8A", "#3B82F6"]}
          className="px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 pt-12 sm:pt-14 md:pt-15"
        >
          <View className="flex-row justify-between items-start mb-3 sm:mb-4">
            <View className="flex-1">
              <Text className="text-xl sm:text-2xl md:text-3xl font-bold justify-center items-center text-white">
                Welcome <Text className="text-blue-200">{boarderProfile?.name}</Text>
              </Text>
              <Text className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                Make Payment
              </Text>
              <Text className="text-sm sm:text-base md:text-lg text-white/80 mt-0.5 sm:mt-1">
                Add advance payment to your account
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

        <View className="px-3 py-3 sm:px-4 sm:py-4 md:px-5 md:py-5">
          {/* QR Code Card */}
          <View className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 items-center shadow-xl">
            <View className="items-center mb-3 sm:mb-4">
              <QrCode size={28} color="#3B82F6" />
              <Text className="text-base sm:text-lg md:text-xl font-semibold text-dark-100 mt-2">
                Scan QR Code to Pay
              </Text>
            </View>

            {/* QR Code Image */}
            <View className="bg-white p-4 rounded-xl border-2 border-blue-100 mb-4">
              <Image
                source={QR_CODE_IMAGE}
                style={{ width: 250, height: 250 }}
                resizeMode="contain"
              />
            </View>

            {/* Subtext */}
            <Text className="text-xs sm:text-sm text-gray-100 mb-4 text-center italic">
              Send ₹10 to check if this is really working
            </Text>

            {/* Action Buttons */}
            <View className="flex-row gap-2 sm:gap-3 mb-4 w-full">
              <TouchableOpacity
                className="flex-1 bg-primary rounded-xl py-3 sm:py-3.5 flex-row items-center justify-center gap-2"
                onPress={downloadQRCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Download size={18} color="#ffffff" />
                    <Text className="text-white text-sm sm:text-base font-medium">
                      Download
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-navy rounded-xl py-3 sm:py-3.5 flex-row items-center justify-center gap-2"
                onPress={shareQRCode}
                disabled={loading}
              >
                <Share2 size={18} color="#ffffff" />
                <Text className="text-white text-sm sm:text-base font-medium">
                  Share
                </Text>
              </TouchableOpacity>
            </View>

            {/* UPI ID Section */}
            <View className="w-full bg-blue-50 rounded-xl p-4 mb-2">
              <Text className="text-xs sm:text-sm text-gray-100 mb-2 text-center">
                Or pay using UPI ID
              </Text>
              <View className="flex-row items-center justify-between bg-white rounded-lg p-3 border border-blue-200">
                <Text className="text-sm sm:text-base font-medium text-dark-100 flex-1">
                  {UPI_ID}
                </Text>
                <TouchableOpacity
                  onPress={copyToClipboard}
                  className="ml-2 bg-blue-100 rounded-lg p-2"
                >
                  <Copy size={18} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Payment Submission Form */}
          <View className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 shadow-xl">
            <Text className="text-base sm:text-lg md:text-xl font-semibold text-dark-100 mb-4">
              Submit Payment Details
            </Text>

            {/* Amount Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Payment Amount
              </Text>
              <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-1 border border-gray-200">
                <IndianRupee size={20} color="#6b7280" />
                <TextInput
                  className="flex-1 text-base text-dark-100 py-3 ml-2"
                  placeholder="Enter amount"
                  placeholderTextColor="#9ca3af"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Screenshot Upload */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Payment Screenshot
              </Text>
              {screenshot ? (
                <View className="relative">
                  <Image
                    source={{ uri: screenshot }}
                    style={{ width: "100%", height: 200 }}
                    className="rounded-xl"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    className="absolute top-2 right-2 bg-red-600 rounded-full p-2"
                    onPress={() => setScreenshot(null)}
                  >
                    <Text className="text-white text-xs font-bold">✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl py-8 items-center"
                  onPress={pickImage}
                >
                  <ImageIcon size={40} color="#9ca3af" />
                  <Text className="text-sm text-gray-100 mt-2">
                    Tap to upload screenshot
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              className={`bg-primary rounded-xl py-4 items-center ${
                uploadLoading || !amount || !screenshot ? "opacity-60" : ""
              }`}
              onPress={handleSubmitPayment}
              disabled={uploadLoading || !amount || !screenshot}
            >
              {uploadLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View className="flex-row items-center gap-2">
                  <Upload size={20} color="#ffffff" />
                  <Text className="text-white text-base font-semibold">
                    Submit Payment
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Info Message */}
            <View className="bg-blue-50 rounded-xl p-3 sm:p-4 mt-4">
              <Text className="text-xs sm:text-sm text-blue-800 font-medium mb-1">
                ℹ️ Payment Instructions
              </Text>
              <Text className="text-xs sm:text-sm text-blue-700">
                1. Scan QR code or use UPI ID to make payment{"\n"}
                2. Take a screenshot of successful payment{"\n"}
                3. Upload screenshot and submit{"\n"}
                4. Your advance balance will be updated after manager approval
              </Text>
            </View>
          </View>

          {/* Payment History */}
          {paymentHistory.length > 0 && (
            <View className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 mt-4 shadow-xl">
              <Text className="text-base sm:text-lg md:text-xl font-semibold text-dark-100 mb-4">
                Payment History
              </Text>
              {paymentHistory.map((payment: any) => {
                const statusConfig = {
                  pending: {
                    icon: Clock,
                    color: "#F59E0B",
                    bgColor: "#FEF3C7",
                    label: "Pending",
                  },
                  approved: {
                    icon: CheckCircle,
                    color: "#10B981",
                    bgColor: "#D1FAE5",
                    label: "Approved",
                  },
                  rejected: {
                    icon: XCircle,
                    color: "#EF4444",
                    bgColor: "#FEE2E2",
                    label: "Rejected",
                  },
                };

                const status = statusConfig[payment.status as keyof typeof statusConfig] || statusConfig.pending;
                const StatusIcon = status.icon;

                return (
                  <View
                    key={payment.$id}
                    className="border-b border-gray-100 py-3 sm:py-4 last:border-b-0"
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1">
                        <Text className="text-base sm:text-lg font-bold text-dark-100">
                          ₹{payment.amount.toLocaleString()}
                        </Text>
                        <View className="flex-row items-center gap-1 mt-1">
                          <Calendar size={12} color="#6b7280" />
                          <Text className="text-xs sm:text-sm text-gray-100">
                            {formatDateForDisplay(payment.$createdAt)}
                          </Text>
                        </View>
                      </View>
                      <View
                        className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
                        style={{ backgroundColor: status.bgColor }}
                      >
                        <StatusIcon size={14} color={status.color} />
                        <Text
                          className="text-xs sm:text-sm font-medium"
                          style={{ color: status.color }}
                        >
                          {status.label}
                        </Text>
                      </View>
                    </View>
                    {payment.paymentURL && (
                      <View className="flex-row items-center mt-2 gap-2">
                        <Receipt size={14} color="#6b7280" />
                        <Text className="text-xs sm:text-sm text-gray-100 flex-1">
                          Payment proof attached
                        </Text>
                        <TouchableOpacity
                          onPress={() => setSelectedImage(payment.paymentURL)}
                        >
                          <Image
                            source={{ uri: payment.paymentURL }}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded"
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

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
    </KeyboardAvoidingView>
  );
}

export default PaymentsScreen;

