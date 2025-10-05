// app/(manager)/(tabs)/summary.tsx

import { useExpenseStore } from "@/stores/expense-store";
import { LinearGradient } from "expo-linear-gradient";
import {
  Calendar,
  Download,
  Eye,
  FileText,
  Receipt,
} from "lucide-react-native";
import React, { useMemo } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MonthlySummaryScreen() {
  const expenses = useExpenseStore((state) => state.expenses);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= thirtyDaysAgo && expenseDate <= now;
    });

    const totalExpenses = recentExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const totalFunding = 50000; // This would come from settings
    const remainingBalance = totalFunding - totalExpenses;

    return {
      expenses: recentExpenses,
      totalExpenses,
      totalFunding,
      remainingBalance,
    };
  }, [expenses]);

  const handleExportCSV = () => {
    Alert.alert(
      "Export CSV",
      "CSV export functionality would be implemented here"
    );
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
              ₹{monthlyData.totalFunding.toLocaleString()}
            </Text>
          </View>
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-sm text-gray-600 mb-1">Total Expenses</Text>
            <Text className="text-2xl font-bold text-red-600">
              ₹{monthlyData.totalExpenses.toLocaleString()}
            </Text>
          </View>
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-sm text-gray-600 mb-1">
              Remaining Balance
            </Text>
            <Text
              className={`text-2xl font-bold ${
                monthlyData.remainingBalance >= 0
                  ? "text-emerald-600"
                  : "text-red-600"
              }`}
            >
              ₹{monthlyData.remainingBalance.toLocaleString()}
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
          {monthlyData.expenses.length === 0 ? (
            <View className="items-center py-10">
              <FileText size={48} color="#9ca3af" />
              <Text className="text-base text-gray-600 mt-3">
                No expenses recorded yet
              </Text>
            </View>
          ) : (
            monthlyData.expenses.map((expense) => (
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
