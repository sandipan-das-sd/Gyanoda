import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";

const CACHE_SIZE_KEY = "@app_cache_size";
const LAST_CLEANUP_DATE_KEY = "@last_cache_cleanup_date";
const LAST_CLEARED_CACHE_SIZE_KEY = "@last_cleared_cache_size";
const MAX_CACHE_SIZE = 2 * 1024 * 1024; // 2 MB in bytes

export async function initializeCacheManagement() {
  await checkAndCleanCache();
}

export async function checkAndCleanCache() {
  try {
    const currentDate = new Date().toDateString();
    const lastCleanupDate = await AsyncStorage.getItem(LAST_CLEANUP_DATE_KEY);

    if (lastCleanupDate === null || lastCleanupDate !== currentDate) {
      const cacheSize = await getCacheSize();
      if (cacheSize > MAX_CACHE_SIZE) {
        const clearedSize = await clearCache();
        await AsyncStorage.setItem(
          LAST_CLEARED_CACHE_SIZE_KEY,
          clearedSize.toString()
        );
        await AsyncStorage.setItem(LAST_CLEANUP_DATE_KEY, currentDate);
        console.log(`Cache cleaned. Cleared ${formatBytes(clearedSize)}`);
      }
    }
  } catch (error) {
    console.error("Error in checkAndCleanCache:", error);
  }
}

async function getCacheSize(): Promise<number> {
  try {
    const cachedSize = await AsyncStorage.getItem(CACHE_SIZE_KEY);
    if (cachedSize !== null) {
      return parseInt(cachedSize, 10);
    }

    if (FileSystem.cacheDirectory) {
      const cacheInfo = await FileSystem.getInfoAsync(
        FileSystem.cacheDirectory
      );
      if (cacheInfo.exists && "size" in cacheInfo) {
        const size = cacheInfo.size;
        await AsyncStorage.setItem(CACHE_SIZE_KEY, size.toString());
        return size;
      }
    }

    await AsyncStorage.setItem(CACHE_SIZE_KEY, "0");
    return 0;
  } catch (error) {
    console.error("Error getting cache size:", error);
    return 0;
  }
}

async function clearCache(): Promise<number> {
  try {
    const initialSize = await getCacheSize();

    if (FileSystem.cacheDirectory) {
      await FileSystem.deleteAsync(FileSystem.cacheDirectory, {
        idempotent: true,
      });
    }
    await AsyncStorage.setItem(CACHE_SIZE_KEY, "0");

    return initialSize;
  } catch (error) {
    console.error("Error clearing cache:", error);
    return 0;
  }
}

export async function getPreviousCacheCleanupSize(): Promise<number> {
  try {
    const clearedSizeString = await AsyncStorage.getItem(
      LAST_CLEARED_CACHE_SIZE_KEY
    );
    return clearedSizeString ? parseInt(clearedSizeString, 10) : 0;
  } catch (error) {
    console.error("Error getting previous cache cleanup size:", error);
    return 0;
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
