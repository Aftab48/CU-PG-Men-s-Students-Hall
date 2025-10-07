// lib/actions/auth.actions.ts

import { account } from "../appwrite";
import { getBoarderProfile, getBoarderProfileByEmail } from "./boarder.actions";
//import { getStaffProfile } from "./staff.actions";

export interface AuthUser {
  $id: string;
  email: string;
  name: string;
  role: "boarder" | "staff";
  profile: any;
}

export interface RoleData {
  role: AuthUser["role"];
  profile: AuthUser["profile"];
}

/**
 * Determine user role + profile in parallel
 */
export async function resolveUserRole(userId: string): Promise<RoleData | null> {
  // Run all profile fetches concurrently
  const [ boarderProfile] = await Promise.all([
    getBoarderProfile(userId),
    //getStaffProfile(userId),
  ]);

  if (boarderProfile) return { role: "boarder", profile: boarderProfile };
  //if (staffProfile) return { role: "staff", profile: staffProfile };

  return null; // No profile found
}

/**
 * Universal login function that determines user role and returns appropriate data
 */
export async function universalLogin(email: string, password: string) {
  try {
    if (!email?.trim() || !password?.trim()) {
      throw new Error("Email and password are required");
    }

    // Check if a session already exists and delete it
    try {
      const existingSession = await account.getSession({
        sessionId: "current",
      });
      if (existingSession) {
        await account.deleteSession({ sessionId: "current" });
      }
    } catch (err) {
      console.log(err);
      
    }

    const session = await account.createEmailPasswordSession({
      email,
      password,
    });
    const user = await account.get();

    const roleData = await resolveUserRole(user.$id);
    if (!roleData) {
      await account.deleteSession({ sessionId: "current" });
      throw new Error("User profile not found");
    }

    return {
      success: true,
      user: {
        $id: user.$id,
        email: user.email,
        name: user.name,
        ...roleData, // includes { role, profile }
      },
      session,
    };
  } catch (error: any) {
    console.error("Universal login error:", error);
    return {
      success: false,
      error: error.message || "Invalid email or password",
    };
  }
}

/**
 * Check if user is currently authenticated and return user data
 */
export async function checkAuthStatus() {
  try {
    const user = await account.get();
    const roleData = await resolveUserRole(user.$id);

    if (!roleData) {
      return {
        success: false,
        isAuthenticated: false,
        error: "User profile not found",
      };
    }

    return {
      success: true,
      isAuthenticated: true,
      user: {
        $id: user.$id,
        email: user.email,
        name: user.name,
        ...roleData,
      },
    };
  } catch (error : any) {
    console.error(error);
    return {
      success: false,
      isAuthenticated: false,
      error: "Not authenticated",
    };
  }
}

/**
 * Logout current user
 */
export async function logoutUser() {
  try {
    await account.deleteSession({ sessionId: "current" });
    return {
      success: true,
      message: "Logged out successfully",
    };
  } catch (error: any) {
    console.error("Logout error:", error);
    return {
      success: false,
      error: error.message || "Failed to logout",
    };
  }
}

/**
 * Update the current user's password using Appwrite Auth
 */
export async function updateCurrentUserPassword(
  currentPassword: string,
  newPassword: string
) {
  try {
    if (!currentPassword?.trim() || !newPassword?.trim()) {
      throw new Error("Please provide both current and new passwords");
    }
    if (newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters long");
    }

    await account.updatePassword({
      password: newPassword,
      oldPassword: currentPassword,
    });

    return { success: true, message: "Password updated successfully" };
  } catch (error: any) {
    console.error("Update password error:", error);
    return {
      success: false,
      error:
        error?.message ||
        "Failed to update password. Please verify your current password.",
    };
  }
}

/**
 * Email-first flow: verify boarder by email to greet, then update with current password
 * This does NOT store email-password; it only uses email to fetch profile for greeting.
 */
export async function updatePasswordWithEmailFlow(
  email: string,
  currentPassword: string,
  newPassword: string
) {
  try {
    if (!email?.trim()) throw new Error("Email is required");
    const profile = await getBoarderProfileByEmail(email.trim());
    if (!profile) throw new Error("No boarder found with that email");

    // perform the password update using current session or provided current password
    const result = await updateCurrentUserPassword(currentPassword, newPassword);
    if (!result.success) return result;

    return { success: true, name: profile.name, message: result.message };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update password" };
  }
}