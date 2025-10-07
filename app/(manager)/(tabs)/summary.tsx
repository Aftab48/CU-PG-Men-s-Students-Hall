// app/(manager)/(tabs)/summary.tsx

import { getAllActiveBoarders, getExpensesForDateRange, getTotalExpenses } from "@/lib/actions";
import { LinearGradient } from "expo-linear-gradient";
import {
  Calendar,
  Download,
  Eye,
  FileText,
  Receipt,
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

 const [FileSystem, setFileSystem] = useState<any>(null);
 const [Sharing, setSharing] = useState<any>(null);

 useEffect(() => {
   const loadModules = async () => {
     try {
       const fs = await import("expo-file-system");
       setFileSystem(fs);
     } catch {}

     try {
       const sh = await import("expo-sharing");
       setSharing(sh);
     } catch {}
   };

   loadModules();
 }, []);



  //const expenses = useExpenseStore((state) => state.expenses);
  const [totalFunding, setTotalFunding] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);

  useEffect(() => {
    const loadTotals = async () => {
      setLoading(true);
      try {
        // Sum of advance from all active boarders
        const boarders = await getAllActiveBoarders();
        const funding = (boarders || []).reduce(
          (sum: number, b: any) => sum + (b.advance || 0),
          0
        );
        setTotalFunding(funding);

        // Sum of all expenses (optionally, you could limit to last 30 days)
        const expensesTotalRes = await getTotalExpenses();
        setTotalExpenses(expensesTotalRes.total || 0);

        // Fetch recent (last 30 days) expenses from backend
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const start = thirtyDaysAgo.toISOString().split("T")[0];
        const end = now.toISOString().split("T")[0];
        const rows = await getExpensesForDateRange(start, end);
        const mapped = (rows || [])
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
        setRecentExpenses(mapped);
      } catch {
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
      const csv = [...header, ...rows].join("\n");

      if (!FileSystem || !Sharing) {
        Alert.alert("Export CSV", "Export modules not available in this build.");
        return;
      }

      const fileUri = `${FileSystem.documentDirectory}expenses.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });
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
    <ScrollView className="flex-1 bg-slate-50">
      <LinearGradient colors={["#1e40af", "#3b82f6"]} className="p-6 pt-15">
        <Text className="text-2xl font-bold text-white">Monthly Summary</Text>
        <Text className="text-base text-slate-200 mt-1">
          Last 30 days overview
        </Text>
      </LinearGradient>

      <View className="p-4">
        {/* Summary Cards */}
        <View className="gap-3 mb-5">
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-sm text-gray-600 mb-1">Total Funding</Text>
            <Text className="text-2xl font-bold text-blue-700">
              ₹{(loading ? 0 : totalFunding).toLocaleString()}
            </Text>
          </View>
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-sm text-gray-600 mb-1">Total Expenses</Text>
            <Text className="text-2xl font-bold text-red-600">
              ₹{(loading ? 0 : totalExpenses).toLocaleString()}
            </Text>
          </View>
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-sm text-gray-600 mb-1">
              Remaining Balance
            </Text>
            <Text
              className={`text-2xl font-bold ${
                remainingBalance >= 0
                  ? "text-emerald-600"
                  : "text-red-600"
              }`}
            >
              ₹{(loading ? 0 : remainingBalance).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center bg-white py-3 rounded-lg gap-2 shadow-sm"
            onPress={handleExportCSV}
          >
            <Download size={20} color="#1e40af" />
            <Text className="text-sm font-medium text-gray-700">
              Export CSV
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center bg-white py-3 rounded-lg gap-2 shadow-sm"
            onPress={handleMakePublic}
          >
            <Eye size={20} color="#059669" />
            <Text className="text-sm font-medium text-gray-700">
              Make Public
            </Text>
          </TouchableOpacity>
        </View>

        {/* Expenses List */}
        <View className="bg-white rounded-2xl p-5 shadow-lg">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Recent Expenses
          </Text>
          {recentExpenses.length === 0 ? (
            <View className="items-center py-10">
              <FileText size={48} color="#9ca3af" />
              <Text className="text-base text-gray-600 mt-3">
                No expenses recorded yet
              </Text>
            </View>
          ) : (
            recentExpenses.map((expense: any) => (
              <View key={expense.id} className="border-b border-gray-100 py-4">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 mr-3">
                    <Text className="text-base font-medium text-gray-800 mb-1">
                      {expense.description}
                    </Text>
                    <View className="flex-row items-center gap-1">
                      <Calendar size={14} color="#6b7280" />
                      <Text className="text-xs text-gray-600">
                        {expense.date}
                      </Text>
                      <Text className="text-xs text-gray-600 capitalize">
                        • {expense.category}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-lg font-bold text-red-600">
                    ₹{expense.amount.toLocaleString()}
                  </Text>
                </View>
                {expense.receipt && (
                  <View className="flex-row items-center mt-2 gap-2">
                    <Receipt size={16} color="#6b7280" />
                    <Text className="text-xs text-gray-600 flex-1">
                      Receipt attached
                    </Text>
                    <Image
                      source={{ uri: expense.receipt }}
                      className="w-10 h-10 rounded"
                    />
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}
