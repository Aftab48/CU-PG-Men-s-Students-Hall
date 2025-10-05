// lib/actions/manager.actions.ts

import { appwriteConfig, Query, tables } from "../appwrite";

export interface ManagerProfile {
  $id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

/**
 * Login manager
 */
export async function loginManager({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  try {
    const profile = await getManagerProfile(); // only one manager exists
    if (!profile || profile.email !== email || profile.password !== password) {
      throw new Error("Invalid credentials");
    }
    return { success: true, profile };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update manager password
 */
export async function updateManagerPassword(
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    if (!newPassword?.trim()) throw new Error("New password is required");
    if (newPassword.length < 8)
      throw new Error("Password must be at least 8 characters long");

    const profile = await getManagerProfile();
    if (!profile) throw new Error("Manager profile not found");

    await tables.updateRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.managersTableId,
      rowId: profile.$id,
      data: { password: newPassword },
    });

    return { success: true, message: "Password updated successfully" };
  } catch (error: any) {
    console.error("Update manager password error:", error);
    return {
      success: false,
      error: error.message || "Failed to update password",
    };
  }
}

/**
 * Get manager profile (assumes only one manager exists)
 */
export async function getManagerProfile(): Promise<ManagerProfile | null> {
  try {
    const response = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.managersTableId,
      queries: [Query.limit(1)],
    });

    if (response.rows.length === 0) return null;
    return response.rows[0] as unknown as ManagerProfile;
  } catch (error: any) {
    console.error("Get manager profile error:", error);
    return null;
  }
}


/**
 * Convenience helper to fetch the current manager
 */
export async function getCurrentManager(): Promise<ManagerProfile | null> {
  return await getManagerProfile();
}