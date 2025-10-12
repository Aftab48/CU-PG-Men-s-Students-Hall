//lib/appwrite

import Constants from "expo-constants";
import { Account, Avatars, Client, Databases, ID, Query, Storage, TablesDB } from "react-native-appwrite";

interface AppwriteEnv {
  EXPO_PUBLIC_APPWRITE_ENDPOINT: string;
  EXPO_PUBLIC_APPWRITE_PROJECT_ID: string;
  EXPO_PUBLIC_APPWRITE_DATABASE_ID: string;
  EXPO_PUBLIC_APPWRITE_BOARDERS_TABLE_ID: string;
  EXPO_PUBLIC_APPWRITE_MANAGERS_TABLE_ID: string;
  EXPO_PUBLIC_APPWRITE_EXPENSES_TABLE_ID: string;
  EXPO_PUBLIC_APPWRITE_MEALS_TABLE_ID: string;
  EXPO_PUBLIC_APPWRITE_STAFF_TABLE_ID: string;
  EXPO_PUBLIC_APPWRITE_PAYMENTS_TABLE_ID: string;
  EXPO_PUBLIC_APPWRITE_BUCKET_ID: string;
}


const {
  EXPO_PUBLIC_APPWRITE_ENDPOINT,
  EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  EXPO_PUBLIC_APPWRITE_BOARDERS_TABLE_ID,
  EXPO_PUBLIC_APPWRITE_MANAGERS_TABLE_ID,
  EXPO_PUBLIC_APPWRITE_EXPENSES_TABLE_ID,
  EXPO_PUBLIC_APPWRITE_MEALS_TABLE_ID,
  EXPO_PUBLIC_APPWRITE_STAFF_TABLE_ID,
  EXPO_PUBLIC_APPWRITE_PAYMENTS_TABLE_ID,
  EXPO_PUBLIC_APPWRITE_BUCKET_ID,
} = (Constants.expoConfig?.extra || {}) as AppwriteEnv;

if (!EXPO_PUBLIC_APPWRITE_ENDPOINT || !EXPO_PUBLIC_APPWRITE_PROJECT_ID) {
  throw new Error(
    "Appwrite environment variables are missing! Check app.config.js and .env"
  );
}

export const appwriteConfig = {
  endpoint: EXPO_PUBLIC_APPWRITE_ENDPOINT,
  projectId: EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  platform: "com.aftab.cupg",
  databaseId: EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  boardersTableId: EXPO_PUBLIC_APPWRITE_BOARDERS_TABLE_ID,
  managersTableId: EXPO_PUBLIC_APPWRITE_MANAGERS_TABLE_ID,
  expensesTableId: EXPO_PUBLIC_APPWRITE_EXPENSES_TABLE_ID,
  mealsTableId: EXPO_PUBLIC_APPWRITE_MEALS_TABLE_ID,
  staffTableId: EXPO_PUBLIC_APPWRITE_STAFF_TABLE_ID,
  paymentsTableId: EXPO_PUBLIC_APPWRITE_PAYMENTS_TABLE_ID,
  bucketId: EXPO_PUBLIC_APPWRITE_BUCKET_ID,
};

export const client = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)
  .setPlatform(appwriteConfig.platform);

export const account = new Account(client);
export const databases = new Databases(client);
export const avatars = new Avatars(client);
export const tables = new TablesDB(client);
export const storage = new Storage(client);

export { ID, Query };

