// lib/actions/auth.actions.ts

import { account } from "../appwrite";
import { getBoarderProfile } from "./boarder.actions";
import { getStaffProfile } from "./staff.actions";

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
  const [ boarderProfile, staffProfile] = await Promise.all([
    getBoarderProfile(userId),
    getStaffProfile(userId),
  ]);

  if (boarderProfile) return { role: "boarder", profile: boarderProfile };
  if (staffProfile) return { role: "staff", profile: staffProfile };

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

    const session = await account.createEmailPasswordSession({email, password});
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
