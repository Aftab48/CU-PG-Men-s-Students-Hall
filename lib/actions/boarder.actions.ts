// lib/actions/boarder.actions.ts

import {
  account,
  appwriteConfig,
  avatars,
  ID,
  Query,
  tables,
} from "../appwrite";

export interface BoarderSignupData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  roomNum?: string;
  advance?: number;
}

export interface BoarderSignupStep2Data {
  phoneNum: string;
  roomNum: string;
  mealPreference: "veg" | "non-veg" | "egg" | "fish";
  advance: number;
  current: number;
}

export interface BoarderProfile {
  $id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  roomNumber?: string;
  advancePayment: number;
  currentBalance: number;
  joinedAt: string;
  isActive: boolean;
  mealPreference: "veg" | "non-veg" | "egg" | "fish";
  avatarUrl: URL;
}

/**
 * Sign up a new boarder - Step 1: Create auth account
 */
export async function signUpBoarderStep1(userData: BoarderSignupData) {
  try {
    const authUser = await account.create({
      userId: ID.unique(),
      email : userData.email,
      password : userData.password,
      name : userData.name
    });

    return {
      success: true,
      user: authUser,
    };
  } catch (error: any) {
    console.error("Boarder signup step 1 error:", error);
    return {
      success: false,
      error: error.message || "Failed to create boarder account",
    };
  }
}

/**
 * Sign up a new boarder - Step 2: Create profile with additional details
 */
export async function signUpBoarderStep2(
  userId: string,
  name: string,
  email: string,
  profileData: BoarderSignupStep2Data
) {
  try {
    const avatarUrl = avatars.getInitialsURL(name);

    console.log(avatarUrl);
    

    const boarderProfile = await tables.createRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.boardersTableId,
      rowId: ID.unique(),
      data: {
        userId,
        name,
        email,
        phone: profileData.phoneNum,
        roomNum: profileData.roomNum,
        advance: profileData.advance,
        current: profileData.current,
        isActive: true,
        mealPreference: profileData.mealPreference,
        avatar: avatarUrl,
      },
    });
    console.log(boarderProfile);
    
    return {
      success: true,
      profile: boarderProfile,
    };
  } catch (error: any) {
    console.error("Boarder signup step 2 error:", error);
    return {
      success: false,
      error: error.message || "Failed to create boarder profile",
    };
  }
}

/**
 * Get boarder profile by user ID
 */
export async function getBoarderProfile(
  userId: string
): Promise<BoarderProfile | null> {
  try {
    const response = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.boardersTableId,
      queries: [Query.equal("userId", userId)],
    });

    if (response.rows.length === 0) {
      return null;
    }

    return response.rows[0] as unknown as BoarderProfile;
  } catch (error: any) {
    console.error("Get boarder profile error:", error);
    return null;
  }
}

/**
 * Update boarder profile
 */
export async function updateBoarderProfile(
  profileId: string,
  updates: Partial<Omit<BoarderProfile, "$id" | "userId" | "joinedAt">>
) {
  try {
    if (!profileId?.trim()) {
      throw new Error("Profile ID is required");
    }
    if (!updates || Object.keys(updates).length === 0) {
      throw new Error("Updates are required");
    }

    const updatedProfile = await tables.updateRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.boardersTableId,
      rowId: profileId,
      data: updates,
    });

    return {
      success: true,
      profile: updatedProfile,
    };
  } catch (error: any) {
    console.error("Update boarder profile error:", error);
    return {
      success: false,
      error: error.message || "Failed to update profile",
    };
  }
}

/**
 * Update boarder meal preference
 */
export async function updateBoarderMealPreference(
  profileId: string,
  mealPreference: "veg" | "non-veg" | "egg" | "fish"
) {
  try {
    const updatedProfile = await tables.updateRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.boardersTableId,
      rowId: profileId,
      data: { mealPreference },
    });

    return {
      success: true,
      profile: updatedProfile,
    };
  } catch (error: any) {
    console.error("Update meal preference error:", error);
    return {
      success: false,
      error: error.message || "Failed to update meal preference",
    };
  }
}

/**
 * Update boarder balance
 */
export async function updateBoarderBalance(
  profileId: string,
  amount: number,
  options: { mode: "set" | "increment" } = { mode: "set" }
) {
  try {
    // fetch current row if increment mode
    let newBalance = amount;
    if (options.mode === "increment") {
      const current = await tables.getRow({
        databaseId: appwriteConfig.databaseId,
        tableId: appwriteConfig.boardersTableId,
        rowId: profileId,
      });
      newBalance = (current.currentBalance ?? 0) + amount;
    }

    const updatedProfile = await tables.updateRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.boardersTableId,
      rowId: profileId,
      data: { currentBalance: newBalance },
    });

    return { success: true, profile: updatedProfile };
  } catch (error: any) {
    console.error("Update boarder balance error:", error);
    return {
      success: false,
      error: error.message || "Failed to update balance",
    };
  }
}

/**
 * Get all active boarders (for manager view)
 */
export async function getAllActiveBoarders(): Promise<BoarderProfile[]> {
  try {
    const response = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.boardersTableId,
      queries: [Query.equal("isActive", true), Query.orderDesc("joinedAt")],
    });

    return response.rows as unknown as BoarderProfile[];
  } catch (error: any) {
    console.error("Get all boarders error:", error);
    return [];
  }
}
