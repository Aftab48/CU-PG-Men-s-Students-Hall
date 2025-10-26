// lib/actions/notifications.actions.ts

import { appwriteConfig, ID, Query, tables } from "../appwrite";

export interface PushToken {
  $id: string;
  userId: string;
  pushToken: string;
  deviceId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Register or update a push token for a user
 */
export async function registerPushToken(
  userId: string,
  pushToken: string,
  deviceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if token already exists for this device
    const existingTokens = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.pushTokensTableId,
      queries: [
        Query.equal("userId", userId),
        Query.equal("deviceId", deviceId),
      ],
    });

    if (existingTokens.rows.length > 0) {
      // Update existing token
      const existingToken = existingTokens.rows[0];
      await tables.updateRow({
        databaseId: appwriteConfig.databaseId,
        tableId: appwriteConfig.pushTokensTableId,
        rowId: existingToken.$id,
        data: {
          pushToken,
          isActive: true,
        },
      });
    } else {
      // Create new token
      await tables.createRow({
        databaseId: appwriteConfig.databaseId,
        tableId: appwriteConfig.pushTokensTableId,
        rowId: ID.unique(),
        data: {
          userId,
          pushToken,
          deviceId,
          isActive: true,
        },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error registering push token:", error);
    return {
      success: false,
      error: error.message || "Failed to register push token",
    };
  }
}

/**
 * Get active push tokens for a user
 */
export async function getUserPushTokens(
  userId: string
): Promise<string[]> {
  try {
    const response = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.pushTokensTableId,
      queries: [
        Query.equal("userId", userId),
        Query.equal("isActive", true),
      ],
    });

    return response.rows.map((row: any) => row.pushToken);
  } catch (error: any) {
    console.error("Error getting user push tokens:", error);
    return [];
  }
}

/**
 * Get all active push tokens for multiple users
 */
export async function getMultipleUsersPushTokens(
  userIds: string[]
): Promise<{ userId: string; pushTokens: string[] }[]> {
  try {
    const response = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.pushTokensTableId,
      queries: [
        Query.equal("isActive", true),
        Query.limit(500), // Adjust based on your needs
      ],
    });

    // Group tokens by userId
    const tokensByUser = new Map<string, string[]>();
    
    response.rows.forEach((row: any) => {
      if (userIds.includes(row.userId)) {
        if (!tokensByUser.has(row.userId)) {
          tokensByUser.set(row.userId, []);
        }
        tokensByUser.get(row.userId)!.push(row.pushToken);
      }
    });

    return Array.from(tokensByUser.entries()).map(([userId, pushTokens]) => ({
      userId,
      pushTokens,
    }));
  } catch (error: any) {
    console.error("Error getting multiple users push tokens:", error);
    return [];
  }
}

/**
 * Deactivate push token (e.g., on logout)
 */
export async function deactivatePushToken(
  userId: string,
  deviceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.pushTokensTableId,
      queries: [
        Query.equal("userId", userId),
        Query.equal("deviceId", deviceId),
      ],
    });

    if (response.rows.length > 0) {
      const token = response.rows[0];
      await tables.updateRow({
        databaseId: appwriteConfig.databaseId,
        tableId: appwriteConfig.pushTokensTableId,
        rowId: token.$id,
        data: { isActive: false },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error deactivating push token:", error);
    return {
      success: false,
      error: error.message || "Failed to deactivate push token",
    };
  }
}

/**
 * Send a push notification to a single user via Expo Push API
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const pushTokens = await getUserPushTokens(userId);

    if (pushTokens.length === 0) {
      return { success: false, error: "No push tokens found for user" };
    }

    const messages = pushTokens.map((token) => ({
      to: token,
      sound: "default",
      title,
      body,
      data: data || {},
    }));

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Expo Push API error:", result);
      return { success: false, error: "Failed to send push notification" };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error sending push notification:", error);
    return {
      success: false,
      error: error.message || "Failed to send push notification",
    };
  }
}

/**
 * Send push notifications to multiple users in bulk
 */
export async function sendBulkPushNotifications(
  notifications: Array<{
    userId: string;
    title: string;
    body: string;
    data?: any;
  }>
): Promise<{ success: boolean; sentCount: number; error?: string }> {
  try {
    const userIds = notifications.map((n) => n.userId);
    const usersTokens = await getMultipleUsersPushTokens(userIds);

    if (usersTokens.length === 0) {
      return { success: false, sentCount: 0, error: "No push tokens found" };
    }

    // Build messages array
    const messages: any[] = [];
    
    notifications.forEach((notification) => {
      const userTokenData = usersTokens.find((ut) => ut.userId === notification.userId);
      if (userTokenData && userTokenData.pushTokens.length > 0) {
        userTokenData.pushTokens.forEach((token) => {
          messages.push({
            to: token,
            sound: "default",
            title: notification.title,
            body: notification.body,
            data: notification.data || {},
          });
        });
      }
    });

    if (messages.length === 0) {
      return { success: false, sentCount: 0, error: "No valid tokens to send to" };
    }

    // Send in batches of 100 (Expo's limit)
    const batchSize = 100;
    let sentCount = 0;

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
      });

      if (response.ok) {
        sentCount += batch.length;
      } else {
        console.error("Failed to send batch:", await response.text());
      }
    }

    return { success: true, sentCount };
  } catch (error: any) {
    console.error("Error sending bulk push notifications:", error);
    return {
      success: false,
      sentCount: 0,
      error: error.message || "Failed to send bulk notifications",
    };
  }
}

