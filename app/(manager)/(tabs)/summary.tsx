// app/(manager)/(tabs)/summary.tsx

import { getBoarderProfileById, getExpensesForDateRange, getPaymentsForDateRange, getTotalExpenses, getTotalPayments } from "@/lib/actions";
import { formatDateForDisplay } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
    Calendar,
    Download,
    Eye,
    FileText,
    LogOut,
    Receipt,
    User,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function MonthlySummaryScreen() {
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  const [FileSystem, setFileSystem] = useState<any>(null);
  const [Sharing, setSharing] = useState<any>(null);
  const [totalFunding, setTotalFunding] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"expenses" | "funding">("expenses");

  useEffect(() => {
    const loadModules = async () => {
      try {
        const fs = await import("expo-file-system/legacy");
        setFileSystem(fs);
      } catch (err) {
        console.error("Failed to load FileSystem:", err);
      }

      try {
        const sh = await import("expo-sharing");
        setSharing(sh);
      } catch (err) {
        console.error("Failed to load Sharing:", err);
      }
    };

    loadModules();
  }, []);

  useEffect(() => {
    const loadTotals = async () => {
      setLoading(true);
      try {
        // Calculate total funding from payments table
        const paymentsTotalRes = await getTotalPayments();
        setTotalFunding(paymentsTotalRes.total || 0);

        // Sum of all expenses
        const expensesTotalRes = await getTotalExpenses();
        setTotalExpenses(expensesTotalRes.total || 0);

        // Fetch recent (last 30 days) expenses from backend
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        // Use local date formatting instead of UTC
        const start = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, "0")}-${String(thirtyDaysAgo.getDate()).padStart(2, "0")}`;
        const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        
        // Fetch expenses
        const expenseRows = await getExpensesForDateRange(start, end);
        const mappedExpenses = (expenseRows || [])
          .map((r: any) => ({
            id: r.$id ?? r.id,
            date: r.date,
            category: r.category,
            amount: r.amount,
            description: r.description,
            receipt: r.receipt,
            createdAt: r.$createdAt ?? r.createdAt,
          }))
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecentExpenses(mappedExpenses);

        // Fetch payments
        const paymentRows = await getPaymentsForDateRange(start, end);
        const mappedPayments = await Promise.all(
          (paymentRows || []).map(async (p: any) => {
            // Fetch boarder name using profile ID ($id)
            let boarderName = "Unknown";
            try {
              const boarder = await getBoarderProfileById(p.boarderId);
              boarderName = boarder?.name || "Unknown";
            } catch (err) {
              console.error("Error fetching boarder:", err);
            }
            return {
              id: p.$id,
              amount: p.amount,
              boarderId: p.boarderId,
              boarderName,
              paymentURL: p.paymentURL,
              createdAt: p.$createdAt,
            };
          })
        );
        setRecentPayments(
          mappedPayments.sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      } catch (err) {
        console.error("Error loading data:", err);
        setTotalFunding(0);
        setTotalExpenses(0);
      } finally {
        setLoading(false);
      }
    };
    loadTotals();
  }, []);

  const remainingBalance = useMemo(
    () => totalFunding - totalExpenses,
    [totalFunding, totalExpenses]
  );

  // recentExpenses now comes from backend

  const handleExportCSV = async () => {
    try {
      if (!FileSystem || !Sharing) {
        Alert.alert("Export CSV", "Export modules not available in this build.");
        return;
      }

      let csv = "";
      let fileName = "";

      if (activeTab === "expenses") {
        const header = [
          "id,date,category,amount,description,receipt,createdAt",
        ];
        const rows = recentExpenses.map((e) =>
          [
            e.id,
            e.date,
            e.category,
            e.amount,
            JSON.stringify(e.description || ""),
            JSON.stringify(e.receipt || ""),
            e.createdAt || "",
          ].join(",")
        );
        csv = [...header, ...rows].join("\n");
        fileName = "expenses.csv";
      } else {
        const header = [
          "id,boarderId,boarderName,amount,paymentURL,createdAt",
        ];
        const rows = recentPayments.map((p) =>
          [
            p.id,
            p.boarderId,
            JSON.stringify(p.boarderName || ""),
            p.amount,
            JSON.stringify(p.paymentURL || ""),
            p.createdAt || "",
          ].join(",")
        );
        csv = [...header, ...rows].join("\n");
        fileName = "payments.csv";
      }

      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, csv);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, { mimeType: "text/csv" });
      } else {
        Alert.alert("Export CSV", `Saved to: ${fileUri}`);
      }
    } catch (err: any) {
      Alert.alert("Export CSV Failed", err?.message || "Unknown error");
    }
  };

  const handleMakePublic = () => {
    Alert.alert(
      "Make Public",
      "Public sharing functionality would be implemented here"
    );
  };

  return (
    <ScrollView className="flex-1 bg-white-100">
      <LinearGradient colors={["#1E3A8A", "#3B82F6"]} className="px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 pt-12 sm:pt-14 md:pt-15">
        <View className="flex-row justify-between items-start mb-3 sm:mb-4">
          <View className="flex-1">
            <Text className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Monthly Summary</Text>
            <Text className="text-sm sm:text-base md:text-lg text-white/80 mt-0.5 sm:mt-1">
              Last 30 days overview
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

      <View className="px-3 py-3 sm:px-4 sm:py-4 md:px-5 md:py-5">
        {/* Summary Cards */}
        <View className="gap-2.5 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
          <View className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
            <Text className="text-xs sm:text-sm text-gray-100 mb-0.5 sm:mb-1">Total Funding</Text>
            <Text className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
              ₹{(loading ? 0 : totalFunding).toLocaleString()}
            </Text>
          </View>
          <View className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
            <Text className="text-xs sm:text-sm text-gray-100 mb-0.5 sm:mb-1">Total Expenses</Text>
            <Text className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600">
              ₹{(loading ? 0 : totalExpenses).toLocaleString()}
            </Text>
          </View>
          <View className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
            <Text className="text-xs sm:text-sm text-gray-100 mb-0.5 sm:mb-1">
              Remaining Balance
            </Text>
            <Text
              className={`text-xl sm:text-2xl md:text-3xl font-bold ${
                remainingBalance >= 0
                  ? "text-success"
                  : "text-red-600"
              }`}
            >
              ₹{(loading ? 0 : remainingBalance).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row gap-2.5 sm:gap-3 mb-4 sm:mb-5">
          <TouchableOpacity
            className={`flex-1 py-2.5 sm:py-3 rounded-lg ${
              activeTab === "expenses"
                ? "bg-primary"
                : "bg-white"
            }`}
            onPress={() => setActiveTab("expenses")}
          >
            <Text
              className={`text-center text-sm sm:text-base font-medium ${
                activeTab === "expenses" ? "text-white" : "text-gray-700"
              }`}
            >
              Expenses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2.5 sm:py-3 rounded-lg ${
              activeTab === "funding"
                ? "bg-primary"
                : "bg-white"
            }`}
            onPress={() => setActiveTab("funding")}
          >
            <Text
              className={`text-center text-sm sm:text-base font-medium ${
                activeTab === "funding" ? "text-white" : "text-gray-700"
              }`}
            >
              Funding
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-2.5 sm:gap-3 mb-5 sm:mb-6">
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center bg-white py-2.5 sm:py-3 rounded-lg gap-1.5 sm:gap-2 shadow-sm"
            onPress={handleExportCSV}
          >
            <Download size={18} color="#3B82F6" />
            <Text className="text-xs sm:text-sm font-medium text-gray-700">
              Export CSV
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center bg-white py-2.5 sm:py-3 rounded-lg gap-1.5 sm:gap-2 shadow-sm"
            onPress={handleMakePublic}
          >
            <Eye size={18} color="#1E3A8A" />
            <Text className="text-xs sm:text-sm font-medium text-gray-700">
              Make Public
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === "expenses" ? (
          <View className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-lg">
            <Text className="text-base sm:text-lg md:text-xl font-semibold text-dark-100 mb-3 sm:mb-4">
              Recent Expenses
            </Text>
            {recentExpenses.length === 0 ? (
              <View className="items-center py-8 sm:py-10">
                <FileText size={40} color="#9ca3af" />
                <Text className="text-sm sm:text-base text-gray-100 mt-2.5 sm:mt-3">
                  No expenses recorded yet
                </Text>
              </View>
            ) : (
              recentExpenses.map((expense: any) => (
                <View key={expense.id} className="border-b border-gray-100 py-3 sm:py-4">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 mr-2.5 sm:mr-3">
                      <Text className="text-sm sm:text-base md:text-lg font-medium text-dark-100 mb-0.5 sm:mb-1">
                        {expense.description}
                      </Text>
                      <View className="flex-row items-center gap-0.5 sm:gap-1">
                        <Calendar size={12} color="#6b7280" />
                        <Text className="text-[10px] sm:text-xs text-gray-100">
                          {formatDateForDisplay(expense.date)}
                        </Text>
                        <Text className="text-[10px] sm:text-xs text-gray-100 capitalize">
                          • {expense.category}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-base sm:text-lg md:text-xl font-bold text-red-600">
                      ₹{expense.amount.toLocaleString()}
                    </Text>
                  </View>
                  {expense.receipt && (
                    <View className="flex-row items-center mt-1.5 sm:mt-2 gap-1.5 sm:gap-2">
                      <Receipt size={14} color="#6b7280" />
                      <Text className="text-[10px] sm:text-xs text-gray-100 flex-1">
                        Receipt attached
                      </Text>
                      <Image
                        source={{ uri: expense.receipt }}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded"
                      />
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        ) : (
          <View className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-lg">
            <Text className="text-base sm:text-lg md:text-xl font-semibold text-dark-100 mb-3 sm:mb-4">
              Recent Funding
            </Text>
            {recentPayments.length === 0 ? (
              <View className="items-center py-8 sm:py-10">
                <FileText size={40} color="#9ca3af" />
                <Text className="text-sm sm:text-base text-gray-100 mt-2.5 sm:mt-3">
                  No payments recorded yet
                </Text>
              </View>
            ) : (
              recentPayments.map((payment: any) => (
                <View key={payment.id} className="border-b border-gray-100 py-3 sm:py-4">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 mr-2.5 sm:mr-3">
                      <View className="flex-row items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                        <User size={14} color="#3B82F6" />
                        <Text className="text-sm sm:text-base md:text-lg font-medium text-dark-100">
                          {payment.boarderName}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-0.5 sm:gap-1">
                        <Calendar size={12} color="#6b7280" />
                        <Text className="text-[10px] sm:text-xs text-gray-100">
                          {formatDateForDisplay(payment.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-base sm:text-lg md:text-xl font-bold text-success">
                      ₹{payment.amount.toLocaleString()}
                    </Text>
                  </View>
                  {payment.paymentURL && (
                    <View className="flex-row items-center mt-1.5 sm:mt-2 gap-1.5 sm:gap-2">
                      <Receipt size={14} color="#6b7280" />
                      <Text className="text-[10px] sm:text-xs text-gray-100 flex-1">
                        Payment proof attached
                      </Text>
                      <Image
                        source={{ uri: payment.paymentURL }}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded"
                      />
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
