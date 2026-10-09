'use client';

import { useCallback, useEffect, useState } from 'react';

const KEY = 'addis_eats_favorites_v1';

/** Feature 17 — favorite dish IDs, client store persisted to localStorage. */
export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setIds(JSON.parse(raw) as string[]);
    } catch {
      /* corrupted storage — start empty */
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((next: string[]) => {
    setIds(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);
  const toggle = useCallback(
    (id: string) => persist(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]),
    [ids, persist],
  );

  return { ids, hydrated, has, toggle };
}