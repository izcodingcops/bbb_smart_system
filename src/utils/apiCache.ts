import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from './logger';

const CACHE_PREFIX = 'api_cache_v1:';

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (error) {
    logger.warn('ApiCache', `Failed to read cache for ${key}`, error);
    return null;
  }
}

export async function setCached<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
  } catch (error) {
    logger.warn('ApiCache', `Failed to write cache for ${key}`, error);
  }
}

export async function clearCached(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_PREFIX + key);
  } catch (error) {
    logger.warn('ApiCache', `Failed to clear cache for ${key}`, error);
  }
}

/**
 * Runs `fetcher`, caching a successful result under `key`. If `fetcher`
 * rejects (e.g. offline), falls back to the last cached value for `key`
 * when one exists, otherwise rethrows the original error.
 */
export async function cacheFirstOnFailure<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  try {
    const result = await fetcher();
    await setCached(key, result);
    return result;
  } catch (error) {
    const cached = await getCached<T>(key);
    if (cached !== null) {
      logger.info('ApiCache', `Serving cached response for ${key}`);
      return cached;
    }
    throw error;
  }
}
