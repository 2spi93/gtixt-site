/**
 * Data Synchronization Service
 * Handles automatic polling, caching, and error recovery
 */

export interface DataSyncConfig {
  pollInterval: number; // milliseconds
  cacheExpiry: number; // milliseconds
  offlineMaxAge: number; // milliseconds
  retryAttempts: number;
  retryDelay: number; // milliseconds
  enableOfflineMode: boolean;
}

export interface CachedData<T> {
  data: T;
  timestamp: number;
  source: 'local' | 'remote';
  hash: string;
}

const DEFAULT_CONFIG: DataSyncConfig = {
  pollInterval: 5 * 60 * 1000, // 5 minutes
  cacheExpiry: 30 * 60 * 1000, // 30 minutes
  offlineMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  enableOfflineMode: true,
};

class DataSyncService {
  private config: DataSyncConfig;
  private cache: Map<string, CachedData<any>> = new Map();
  private pollers: Map<string, NodeJS.Timeout> = new Map();
  private isOnline: boolean = true;

  constructor(config?: Partial<DataSyncConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeOfflineDetection();
  }

  /**
   * Initialize offline detection
   */
  private initializeOfflineDetection(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('[DataSync] Back online - triggering refresh');
      this.triggerAllPollers();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('[DataSync] Offline mode activated');
    });
  }

  /**
   * Compute hash for change detection
   */
  private computeHash(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Fetch data with retry logic
   */
  async fetchWithRetry<T>(
    url: string,
    options?: RequestInit
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data as T;
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `[DataSync] Fetch attempt ${attempt + 1}/${this.config.retryAttempts} failed:`,
          lastError.message
        );

        if (attempt < this.config.retryAttempts - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.config.retryDelay * Math.pow(2, attempt))
          );
        }
      }
    }

    throw lastError || new Error('Failed to fetch data');
  }

  /**
   * Get cached data or fetch if expired
   */
  async getCachedOrFetch<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    forceRefresh: boolean = false
  ): Promise<{ data: T; source: 'cached' | 'fetched' }> {
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    // Return cached if valid and not forcing refresh
    if (
      !forceRefresh &&
      cached &&
      now - cached.timestamp < this.config.cacheExpiry
    ) {
      console.log(`[DataSync] Using cached ${cacheKey}`);
      return { data: cached.data, source: 'cached' };
    }

    try {
      const data = await fetchFn();
      const newHash = this.computeHash(data);

      // Check if data changed
      const changed = !cached || cached.hash !== newHash;

      if (changed) {
        console.log(`[DataSync] Data changed for ${cacheKey} - updating cache`);
      }

      // Update cache
      this.cache.set(cacheKey, {
        data,
        timestamp: now,
        source: 'remote',
        hash: newHash,
      });

      return { data, source: 'fetched' };
    } catch (error) {
      console.error(`[DataSync] Fetch failed for ${cacheKey}:`, error);

      // Fall back to stale cache if offline mode enabled
      if (this.config.enableOfflineMode && cached) {
        const cacheAge = now - cached.timestamp;
        if (cacheAge > this.config.offlineMaxAge) {
          throw error;
        }
        console.log(
          `[DataSync] Using stale cache for ${cacheKey} (offline mode)`
        );
        return { data: cached.data, source: 'cached' };
      }

      throw error;
    }
  }

  /**
   * Start polling for a specific endpoint
   */
  startPolling<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    onDataChange?: (data: T, source: 'cached' | 'fetched') => void
  ): () => void {
    console.log(`[DataSync] Starting polling for ${cacheKey}`);

    const poll = async () => {
      try {
        const { data, source } = await this.getCachedOrFetch(
          cacheKey,
          fetchFn,
          true
        );
        onDataChange?.(data, source);
      } catch (error) {
        console.error(`[DataSync] Polling error for ${cacheKey}:`, error);
      }
    };

    // Initial fetch
    poll();

    // Set up recurring polling
    const interval = setInterval(poll, this.config.pollInterval);
    this.pollers.set(cacheKey, interval);

    // Return cleanup function
    return () => {
      clearInterval(interval);
      this.pollers.delete(cacheKey);
      console.log(`[DataSync] Stopped polling for ${cacheKey}`);
    };
  }

  /**
   * Trigger all active pollers
   */
  private triggerAllPollers(): void {
    this.pollers.forEach((_, key) => {
      console.log(`[DataSync] Manually triggering poll for ${key}`);
    });
  }

  /**
   * Clear specific cache
   */
  clearCache(cacheKey?: string): void {
    if (cacheKey) {
      this.cache.delete(cacheKey);
      console.log(`[DataSync] Cleared cache for ${cacheKey}`);
    } else {
      this.cache.clear();
      console.log(`[DataSync] Cleared all cache`);
    }
  }

  /**
   * Get online status
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Stop all polling
   */
  stopAllPolling(): void {
    this.pollers.forEach((interval) => clearInterval(interval));
    this.pollers.clear();
    console.log(`[DataSync] Stopped all polling`);
  }
}

// Singleton instance
const pollInterval = process.env.NEXT_PUBLIC_POLL_INTERVAL
  ? parseInt(process.env.NEXT_PUBLIC_POLL_INTERVAL, 10)
  : 5 * 60 * 1000;

const cacheExpiry = process.env.NEXT_PUBLIC_CACHE_TTL
  ? parseInt(process.env.NEXT_PUBLIC_CACHE_TTL, 10)
  : 30 * 60 * 1000;

const offlineMaxAge = process.env.NEXT_PUBLIC_OFFLINE_MAX_AGE_DAYS
  ? parseInt(process.env.NEXT_PUBLIC_OFFLINE_MAX_AGE_DAYS, 10) * 24 * 60 * 60 * 1000
  : 7 * 24 * 60 * 60 * 1000;

export const dataSyncService = new DataSyncService({
  pollInterval,
  cacheExpiry,
  offlineMaxAge,
  enableOfflineMode: true,
});

export default dataSyncService;
