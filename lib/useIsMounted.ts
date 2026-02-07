"use client";

import { useSyncExternalStore } from 'react';

/**
 * Hook qui indique si le composant est monté côté client
 * Utile pour éviter les hydration mismatches avec i18n
 */
export function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
