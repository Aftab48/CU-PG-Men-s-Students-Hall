// lib/appwrite.ts

import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
  TablesDB,
} from "react-native-appwrite";

export const appwriteConfig = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
  platform: "com.aftab.cupg",
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
  // Tables
  boardersTableId:
    process.env.EXPO_PUBLIC_APPWRITE_BOARDERS_TABLE_ID!,
  managersTableId:
    process.env.EXPO_PUBLIC_APPWRITE_MANAGERS_TABLE_ID!,
  expensesTableId:
    process.env.EXPO_PUBLIC_APPWRITE_EXPENSES_TABLE_ID!,
  mealsTableId: process.env.EXPO_PUBLIC_APPWRITE_MEALS_TABLE_ID!,
  staffTableId: process.env.EXPO_PUBLIC_APPWRITE_STAFF_TABLE_ID!,

  bucketId: process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID!,
};

export const client = new Client();
client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)
  .setPlatform(appwriteConfig.platform);

export const account = new Account(client);
export const databases = new Databases(client);
export const avatars = new Avatars(client);
export const tables = new TablesDB(client);


export { ID, Query };

