// Redis client and caching utilities for Fotoflo
// Provides caching layer for frequently accessed data

import { createClient } from 'redis';

// Redis client instance
let redisClient: ReturnType<typeof createClient> | null = null;

// Initialize Redis client
export async function getRedisClient() {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    redisClient.on('disconnect', () => {
      console.log('Redis Client Disconnected');
    });

    await redisClient.connect();
  }

  return redisClient;
}

// Cache configuration
export const CACHE_CONFIG = {
  // Project settings (frequently accessed)
  PROJECT_SETTINGS: { ttl: 3600, key: 'project:{id}:settings' },
  
  // Access codes (public, high traffic)
  ACCESS_CODES: { ttl: 1800, key: 'access-code:{code}' },
  
  // Sync status (real-time, short TTL)
  SYNC_STATUS: { ttl: 300, key: 'sync:{projectId}:status' },
  
  // Website mode settings (public, longer TTL)
  WEBSITE_SETTINGS: { ttl: 7200, key: 'website:{subdomain}:settings' },
  
  // Dashboard stats (expensive queries)
  DASHBOARD_STATS: { ttl: 600, key: 'dashboard:{userId}:stats' },
  
  // Image metadata (frequently accessed)
  IMAGE_METADATA: { ttl: 1800, key: 'image:{id}:metadata' },
  
  // Collection data (frequently accessed)
  COLLECTION_DATA: { ttl: 1800, key: 'collection:{id}:data' },
  
  // User session data (longer TTL)
  USER_SESSION: { ttl: 86400, key: 'user:{id}:session' },
  
  // QR code URLs (short TTL for real-time updates)
  QR_CODE_URL: { ttl: 300, key: 'qr:{projectId}:url' },
  
  // Signed URLs (short TTL for security)
  SIGNED_URLS: { ttl: 1800, key: 'signed-url:{bucket}:{path}' },
} as const;

// Cache utility class
export class CacheManager {
  private static client: ReturnType<typeof createClient> | null = null;

  // Initialize cache client
  static async init() {
    if (!this.client) {
      this.client = await getRedisClient();
    }
    return this.client;
  }

  // Get cached value
  static async get<T>(key: string): Promise<T | null> {
    try {
      await this.init();
      const value = await this.client!.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Set cached value with TTL
  static async set(key: string, value: unknown, ttl: number = 3600): Promise<boolean> {
    try {
      await this.init();
      await this.client!.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  // Delete cached value
  static async del(key: string): Promise<boolean> {
    try {
      await this.init();
      await this.client!.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  // Check if key exists
  static async exists(key: string): Promise<boolean> {
    try {
      await this.init();
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  // Get multiple keys
  static async mget(keys: string[]): Promise<(unknown | null)[]> {
    try {
      await this.init();
      const values = await this.client!.mGet(keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  // Set multiple keys
  static async mset(keyValuePairs: Array<{ key: string; value: unknown; ttl?: number }>): Promise<boolean> {
    try {
      await this.init();
      const pipeline = this.client!.multi();
      
      for (const { key, value, ttl = 3600 } of keyValuePairs) {
        pipeline.setEx(key, ttl, JSON.stringify(value));
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }

  // Increment counter
  static async incr(key: string, ttl?: number): Promise<number> {
    try {
      await this.init();
      const result = await this.client!.incr(key);
      
      if (ttl && result === 1) {
        await this.client!.expire(key, ttl);
      }
      
      return result;
    } catch (error) {
      console.error('Cache incr error:', error);
      return 0;
    }
  }

  // Get cache statistics
  static async getStats(): Promise<{
    connected: boolean;
    memory: Record<string, unknown>;
    keys: number;
  }> {
    try {
      await this.init();
      const info = await this.client!.info('memory');
      const keys = await this.client!.dbSize();
      
      return {
        connected: true,
        memory: this.parseRedisInfo(info),
        keys,
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        connected: false,
        memory: {},
        keys: 0,
      };
    }
  }

  // Parse Redis INFO output
  private static parseRedisInfo(info: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = info.split('\r\n');
    
    for (const line of lines) {
      const [key, value] = line.split(':');
      if (key && value) {
        result[key] = value;
      }
    }
    
    return result;
  }

  // Clear all cache (use with caution)
  static async flushAll(): Promise<boolean> {
    try {
      await this.init();
      await this.client!.flushAll();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  // Close Redis connection
  static async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }
}

// Cache decorator for functions
export function cached(key: string, ttl: number = 3600) {
  return function (target: Record<string, unknown>, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const cacheKey = key.replace(/\{(\w+)\}/g, (match, param) => {
        const index = parseInt(param);
        return String(args[index] || match);
      });

      // Try to get from cache
      const cached = await CacheManager.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute method and cache result
      const result = await method.apply(this, args);
      await CacheManager.set(cacheKey, result, ttl);
      return result;
    };

    return descriptor;
  };
}

// Cache key generators
export class CacheKeys {
  static projectSettings(projectId: string): string {
    return CACHE_CONFIG.PROJECT_SETTINGS.key.replace('{id}', projectId);
  }

  static accessCode(code: string): string {
    return CACHE_CONFIG.ACCESS_CODES.key.replace('{code}', code);
  }

  static syncStatus(projectId: string): string {
    return CACHE_CONFIG.SYNC_STATUS.key.replace('{projectId}', projectId);
  }

  static websiteSettings(subdomain: string): string {
    return CACHE_CONFIG.WEBSITE_SETTINGS.key.replace('{subdomain}', subdomain);
  }

  static dashboardStats(userId: string): string {
    return CACHE_CONFIG.DASHBOARD_STATS.key.replace('{userId}', userId);
  }

  static imageMetadata(imageId: string): string {
    return CACHE_CONFIG.IMAGE_METADATA.key.replace('{id}', imageId);
  }

  static collectionData(collectionId: string): string {
    return CACHE_CONFIG.COLLECTION_DATA.key.replace('{id}', collectionId);
  }

  static userSession(userId: string): string {
    return CACHE_CONFIG.USER_SESSION.key.replace('{id}', userId);
  }

  static qrCodeUrl(projectId: string): string {
    return CACHE_CONFIG.QR_CODE_URL.key.replace('{projectId}', projectId);
  }

  static signedUrl(bucket: string, path: string): string {
    return CACHE_CONFIG.SIGNED_URLS.key.replace('{bucket}', bucket).replace('{path}', path);
  }
}

// Cache invalidation helpers
export class CacheInvalidation {
  // Invalidate project-related cache
  static async invalidateProject(projectId: string): Promise<void> {
    const keys = [
      CacheKeys.projectSettings(projectId),
      CacheKeys.syncStatus(projectId),
      CacheKeys.qrCodeUrl(projectId),
    ];

    await Promise.all(keys.map(key => CacheManager.del(key)));
  }

  // Invalidate user-related cache
  static async invalidateUser(userId: string): Promise<void> {
    const keys = [
      CacheKeys.userSession(userId),
      CacheKeys.dashboardStats(userId),
    ];

    await Promise.all(keys.map(key => CacheManager.del(key)));
  }

  // Invalidate image-related cache
  static async invalidateImage(imageId: string): Promise<void> {
    await CacheManager.del(CacheKeys.imageMetadata(imageId));
  }

  // Invalidate collection-related cache
  static async invalidateCollection(collectionId: string): Promise<void> {
    await CacheManager.del(CacheKeys.collectionData(collectionId));
  }

  // Invalidate website-related cache
  static async invalidateWebsite(subdomain: string): Promise<void> {
    await CacheManager.del(CacheKeys.websiteSettings(subdomain));
  }
}

// All classes and functions are already exported individually
