import { appwriteConfig, ID, tables } from "../appwrite";

export interface StoreRecord {
  $id: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreCreateData {
  description: string;
}

/**
 * Create a new store-out record
 */
export async function createStoreOut(storeData: StoreCreateData) {
  try {
    const newStore = await tables.createRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.storeTableId,
      rowId: ID.unique(),
      data: {
        description: storeData.description,
      },
    });

    return {
      success: true,
      store: newStore,
    };
  } catch (error: any) {
    console.error("Create store-out error:", error);
    return {
      success: false,
      error: error.message || "Failed to create store-out entry",
    };
  }
}

