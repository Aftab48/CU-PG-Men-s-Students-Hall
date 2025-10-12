// lib/actions/boarder.actions.ts

import { File } from "expo-file-system";
import { account, appwriteConfig, avatars, ID, Query, storage, tables } from "../appwrite";
import { seedMealsForBoarder } from "../seedMeals";
import { setMealStatusForDateRange } from "./meal.actions";

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
  advance: number;
  current: number;
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
    
    // Seed meals for this new boarder through end of month (by userId)
    try {
      await seedMealsForBoarder(userId);
    } catch (seedErr) {
      console.error("Seed meals for new boarder failed:", seedErr);
    }
    
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
 * Get boarder profile by email
 */
export async function getBoarderProfileByEmail(
  email: string
): Promise<BoarderProfile | null> {
  try {
    const response = await tables.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.boardersTableId,
      queries: [Query.equal("email", email)],
    });

    if (response.rows.length === 0) {
      return null;
    }
    return response.rows[0] as unknown as BoarderProfile;
  } catch (error: any) {
    console.error("Get boarder profile by email error:", error);
    return null;
  }
}

/**
 * Update boarder profile
 */
export async function updateBoarderProfile(
  profileId: string,
  updates: Partial<Omit<BoarderProfile, "$id" | "userId">>
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
 * Optionally persist mealsCount on a boarder profile (if column exists).
 */
export async function persistMealsCountIfSupported(
  profileId: string,
  mealsCount: number
) {
  try {
    const updated = await tables.updateRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.boardersTableId,
      rowId: profileId,
      data: { mealsCount },
    });
    return { success: true, profile: updated };
  } catch (error: any) {
    // Silently ignore if the column doesn't exist or update fails
    return { success: false, error: error.message };
  }
}

/**
 * Update a boarder’s balance.
 */
export async function updateBoarderBalance(
  profileId: string,
  amount: number,
  options: { mode: "set" | "increment" } = { mode: "set" }
) {
  try {
    let newBalance = amount;

    // fetch current row if increment mode
    if (options.mode === "increment") {
      const current = await tables.getRow({
        databaseId: appwriteConfig.databaseId,
        tableId: appwriteConfig.boardersTableId,
        rowId: profileId,
      });

      // note: row data is in current.rows[0] if using Tables API v1.4+
      const currentBalance = current?.current ?? 0;
      newBalance = currentBalance + amount;
    }

    const updatedProfile = await tables.updateRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.boardersTableId,
      rowId: profileId,
      data: { current: newBalance }
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
      queries: [Query.equal("isActive", true), Query.orderDesc("$updatedAt")],
    });

    return response.rows as unknown as BoarderProfile[];
  } catch (error: any) {
    console.error("Get all boarders error:", error);
    return [];
  }
}


/**
 * Convenience wrapper to skip meals for a boarder within a date range.
 */
export async function skipMealsForDateRange(
  boarderId: string,
  startDate: string,
  endDate: string,
  options: { brunch?: boolean; dinner?: boolean }
) {
  return setMealStatusForDateRange(boarderId, startDate, endDate, {
    brunch: options.brunch !== false,
    dinner: options.dinner !== false,
    status: "OFF",
  });
}

/**
 * Deduct a fixed charge per meal from boarder's balance
 */
// export async function deductMealCharge(profileId: string, chargePerMeal = 50) {
//   try {
//     // Get current balance
//     const row = await tables.getRow({
//       databaseId: appwriteConfig.databaseId,
//       tableId: appwriteConfig.boardersTableId,
//       rowId: profileId,
//     });

//     const currentBalance = row?.current ?? 0;
//     const newBalance = currentBalance - chargePerMeal;

//     // Update the table
//      const updatedProfile = await tables.updateRow({
//        databaseId: appwriteConfig.databaseId,
//        tableId: appwriteConfig.boardersTableId,
//        rowId: profileId,
//        data: { currentBalance: newBalance },
//      });


//     return {
//       success: true,
//       newBalance,
//       profile: updatedProfile,
//     };
//   } catch (error: any) {
//     console.error("Deduct meal charge error:", error);
//     return {
//       success: false,
//       error: error.message || "Failed to deduct meal charge",
//     };
//   }
// }

/**
 * Upload payment screenshot to Appwrite Storage
 */
async function uploadPaymentScreenshot(localUri: string): Promise<string | null> {
  try {
    // Extract file name from URI
    const fileName = localUri.split("/").pop() || `payment_${Date.now()}.jpg`;
    
    // Get file info using the new File API
    const fileHandle = new File(localUri);
    if (!fileHandle.exists) {
      throw new Error("File does not exist");
    }

    const fileInfo = await fileHandle.info();

    // Determine file type based on extension
    const fileExtension = fileName.split(".").pop()?.toLowerCase() || "jpg";
    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };
    const mimeType = mimeTypes[fileExtension] || "image/jpeg";
    
    // Create file object for upload
    const file = {
      name: fileName,
      type: mimeType,
      size: fileInfo.size || 0,
      uri: localUri,
    };

    // Upload to Appwrite Storage
    const uploadedFile = await storage.createFile({
      bucketId: appwriteConfig.bucketId,
      fileId: ID.unique(),
      file
    });

    // Construct the file view URL manually
    const fileUrl = `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucketId}/files/${uploadedFile.$id}/view?project=${appwriteConfig.projectId}`;
    
    return fileUrl;
  } catch (error: any) {
    console.error("Upload payment screenshot error:", error);
    throw new Error(error.message || "Failed to upload payment screenshot");
  }
}

/**
 * Submit payment: upload screenshot, update boarder's advance, log as funding
 */
export async function submitPayment(
  userId: string,
  profileId: string,
  amount: number,
  screenshotUri: string
) {
  try {
    // Upload payment screenshot
    const paymentUrl = await uploadPaymentScreenshot(screenshotUri);
    if (!paymentUrl) {
      throw new Error("Failed to upload payment screenshot");
    }

    // Create payment record in PAYMENTS table
    await tables.createRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.paymentsTableId,
      rowId: ID.unique(),
      data: {
        amount,
        boarderId: profileId,
        paymentURL: paymentUrl,
      },
    });

    // Update boarder's advance balance
    const currentProfile = await tables.getRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.boardersTableId,
      rowId: profileId,
    });

    const currentAdvance = currentProfile?.advance ?? 0;
    const newAdvance = currentAdvance + amount;

    await tables.updateRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.boardersTableId,
      rowId: profileId,
      data: { advance: newAdvance },
    });

    return {
      success: true,
      newAdvance,
      paymentUrl,
    };
  } catch (error: any) {
    console.error("Submit payment error:", error);
    return {
      success: false,
      error: error.message || "Failed to submit payment",
    };
  }
}