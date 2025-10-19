import {
  account,
  appwriteConfig,
  avatars,
  ID,
  Query,
  tables,
} from "../appwrite";
import { CacheKeys, cacheManager } from "../cache";

export interface StaffProfile {
  $id: string;
  userId: string;
  name: string;
  email: string;
  isActive: boolean;
  $createdAt: string;
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
        isActive: false,
        avatarUrl,
      },
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
 * @param forceRefresh - If true, bypasses cache and fetches fresh data
 */
export async function getStaffProfile(
  userId: string,
  forceRefresh: boolean = false
): Promise<StaffProfile | null> {
  try {
    if (!userId?.trim()) return null;

    const cacheKey = CacheKeys.staffProfile(userId);
    
    return await cacheManager.cacheOrFetch(
      cacheKey,
      async () => {
        const response = await tables.listRows({
          databaseId: appwriteConfig.databaseId,
          tableId: appwriteConfig.staffTableId,
          queries: [Query.equal("userId", userId)],
        });

        if (response.rows.length === 0) return null;
        return response.rows[0] as unknown as StaffProfile;
      },
      forceRefresh
    );
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
      queries: [Query.equal("isActive", true), Query.orderDesc("$createdAt")],
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

/**
 * Get all pending staff members (isActive = false)
 * @param forceRefresh - If true, bypasses cache and fetches fresh data
 */
export async function getPendingStaff(forceRefresh: boolean = false): Promise<StaffProfile[]> {
  try {
    const cacheKey = CacheKeys.pendingStaff();
    
    return await cacheManager.cacheOrFetch(
      cacheKey,
      async () => {
        const response = await tables.listRows({
          databaseId: appwriteConfig.databaseId,
          tableId: appwriteConfig.staffTableId,
          queries: [Query.equal("isActive", false), Query.orderDesc("$createdAt")],
        });

        return response.rows as unknown as StaffProfile[];
      },
      forceRefresh
    );
  } catch (error: any) {
    console.error("Get pending staff error:", error);
    return [];
  }
}

/**
 * Approve a staff member (set isActive to true)
 */
export async function approveStaff(profileId: string) {
  try {
    if (!profileId?.trim()) {
      throw new Error("Profile ID is required");
    }

    // Get the staff profile first to get userId
    const profile = await tables.getRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.staffTableId,
      rowId: profileId,
    });

    const userId = profile?.userId;

    const updatedProfile = await tables.updateRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.staffTableId,
      rowId: profileId,
      data: { isActive: true },
    });

    // Invalidate caches
    await cacheManager.invalidate(CacheKeys.pendingStaff());
    if (userId) {
      await cacheManager.invalidate(CacheKeys.staffProfile(userId));
    }

    return {
      success: true,
      profile: updatedProfile,
    };
  } catch (error: any) {
    console.error("Approve staff error:", error);
    return {
      success: false,
      error: error.message || "Failed to approve staff",
    };
  }
}

/**
 * Get staff profile by email
 */
export async function getStaffProfileByEmail(
  email: string
): Promise<StaffProfile | null> {
  try {
    if (!email?.trim()) return null;

    const response = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.staffTableId,
      queries: [Query.equal("email", email.trim())],
    });

    if (response.rows.length === 0) return null;
    return response.rows[0] as unknown as StaffProfile;
  } catch (error: any) {
    console.error("Get staff profile by email error:", error);
    return null;
  }
}

/**
 * Update staff password using email flow
 */
export async function updateStaffPassword(
  email: string,
  currentPassword: string,
  newPassword: string
) {
  try {
    if (!email?.trim() || !currentPassword?.trim() || !newPassword?.trim()) {
      throw new Error("Email, current password, and new password are required");
    }

    // Verify staff profile exists
    const staffProfile = await getStaffProfileByEmail(email);
    if (!staffProfile) {
      throw new Error("No staff account found with that email");
    }

    // First, login with current credentials to verify
    const session = await account.createEmailPasswordSession({
      email,
      password: currentPassword,
    });

    if (!session) {
      throw new Error("Invalid current password");
    }

    // Update password
    await account.updatePassword({
      password: newPassword,
      oldPassword: currentPassword,
    });

    // Delete the session
    await account.deleteSession({ sessionId: "current" });

    return {
      success: true,
      message: "Password updated successfully",
    };
  } catch (error: any) {
    console.error("Update staff password error:", error);
    return {
      success: false,
      error: error.message || "Failed to update password",
    };
  }
}
