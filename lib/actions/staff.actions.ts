import {
  account,
  appwriteConfig,
  avatars,
  ID,
  Query,
  tables,
} from "../appwrite";
import { getLocalTimestamp } from "../utils";

export interface StaffProfile {
  $id: string;
  userId: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  avatarUrl: string;
}

export interface StaffSignupData {
  name: string;
  email: string;
  password: string;
}

/**
 * Create a new staff account (auth + profile)
 */
export async function createStaffAccount(staffData: StaffSignupData) {
  try {
    // Create Auth account
    const authUser = await account.create(
      ID.unique(),
      staffData.email,
      staffData.password,
      staffData.name
    );

    // Generate avatar URL
    const avatarUrl = avatars.getInitialsURL(staffData.name);

    // Create staff profile (table row)
    const staffProfile = await tables.createRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.staffTableId,
      rowId: ID.unique(),
      data: {
        userId: authUser.$id,
        name: staffData.name,
        email: staffData.email,
        isActive: true,
        createdAt: getLocalTimestamp(), // Use local timestamp
        avatarUrl,
      },
      permissions: ["role:all"], // optional, adjust if needed
    });

    return {
      success: true,
      user: authUser,
      profile: staffProfile,
    };
  } catch (error: any) {
    console.error("Create staff account error:", error);
    return {
      success: false,
      error: error.message || "Failed to create staff account",
    };
  }
}

/**
 * Get staff profile by user ID
 */
export async function getStaffProfile(
  userId: string
): Promise<StaffProfile | null> {
  try {
    if (!userId?.trim()) return null;

    const response = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.staffTableId,
      queries: [Query.equal("userId", userId), Query.equal("isActive", true)],
    });

    if (response.rows.length === 0) return null;
    return response.rows[0] as unknown as StaffProfile;
  } catch (error: any) {
    console.error("Get staff profile error:", error);
    return null;
  }
}

/**
 * Get all active staff members
 */
export async function getAllActiveStaff(): Promise<StaffProfile[]> {
  try {
    const response = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.staffTableId,
      queries: [Query.equal("isActive", true), Query.orderDesc("createdAt")],
    });

    return response.rows as unknown as StaffProfile[];
  } catch (error: any) {
    console.error("Get all staff error:", error);
    return [];
  }
}

/**
 * Update staff profile
 */
export async function updateStaffProfile(
  profileId: string,
  updates: Partial<Omit<StaffProfile, "$id" | "userId" | "createdAt">>
) {
  try {
    if (!profileId?.trim()) throw new Error("Profile ID is required");
    if (!updates || Object.keys(updates).length === 0) {
      throw new Error("Updates are required");
    }

    const updatedProfile = await tables.updateRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.staffTableId,
      rowId: profileId,
      data: {
        ...updates,
        // optionally enforce updatedAt if you add it to schema
      },
    });

    return {
      success: true,
      profile: updatedProfile,
    };
  } catch (error: any) {
    console.error("Update staff profile error:", error);
    return {
      success: false,
      error: error.message || "Failed to update staff profile",
    };
  }
}
