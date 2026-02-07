/**
 * useDataSync Hook
 * Simplified hook for using dataSyncService in React components
 */

import { useEffect, useState, useCallback } from 'react';
import { dataSyncService } from './dataSync';

export interface UseDataSyncOptions {
  pollInterval?: number;
  enableOfflineMode?: boolean;
  forceRefresh?: boolean;
}

export function useDataSync<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  options?: UseDataSyncOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [source, setSource] = useState<'cached' | 'fetched' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const startPolling = useCallback(() => {
    setIsLoading(true);
    const stopPolling = dataSyncService.startPolling(
      cacheKey,
      fetchFn,
      (newData, dataSource) => {
        setData(newData);
        setSource(dataSource);
        setIsLoading(false);
        setError(null);
      }
    );

    return stopPolling;
  }, [cacheKey, fetchFn]);

  useEffect(() => {
    const cleanup = startPolling();
    return cleanup;
  }, [startPolling]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await dataSyncService.getCachedOrFetch(
        cacheKey,
        fetchFn,
        true // force refresh
      );
      setData(result.data);
      setSource(result.source);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey, fetchFn]);

  return { data, source, isLoading, error, refresh };
}
