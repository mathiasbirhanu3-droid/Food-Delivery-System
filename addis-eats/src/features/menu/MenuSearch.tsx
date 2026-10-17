'use client';

import { useState } from 'react';
import useSWR from 'swr';
import SearchHit from '@/features/menu/SearchHit';
import { useDebounce } from '@/hooks/useDebounce';
import type { Dish } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json()) as Promise<{ dishes: Dish[] }>;

/**
 * The ONE debounced search — Day 45 live data, FR-M3.
 * Invariant 1: the input ALWAYS renders; only the results area switches.
 * Invariant 2: SearchHit already renders an <li> — used directly as the
 * list child, never wrapped (no <li>-in-<li> hydration error).
 * Seeded: default view = server grid via children; zero requests on load.
 */
export default function MenuSearch({ children, category }: { children: React.ReactNode; category: string }) {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 300);

  const trimmed = debounced.trim();
  const searching = trimmed.length > 0;
  const key = searching
    ? `/api/dishes/search?q=${encodeURIComponent(trimmed)}${category ? `&category=${encodeURIComponent(category)}` : ''}`
    : null;

  const { data, isValidating } = useSWR(key, fetcher, { keepPreviousData: true });
  const dishes = data?.dishes;

  return (
    <div>
      <div className="relative mb-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search dishes — doro, tibs, pizza, buna…"
          aria-label="Search the menu"
          className="w-full rounded-full border border-ink/15 bg-white py-3 pl-11 pr-24 text-sm outline-none placeholder:text-ink/40 focus:border-primary dark:border-cream/20 dark:bg-white/5 dark:placeholder:text-cream/40"
        />
        <svg
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40"
          width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {searching && isValidating && (
          <span role="status" className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink/40 dark:text-cream/40">
            searching…
          </span>
        )}
      </div>

      {searching ? (
        !data ? (
          <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="h-56 animate-pulse rounded-2xl bg-ink/10 dark:bg-cream/10" />
            ))}
          </ul>
        ) : dishes && dishes.length > 0 ? (
          <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {dishes.map((dish) => (
              <SearchHit key={dish.id} dish={dish} />
            ))}
          </ul>
        ) : (
          <p className="mt-2 rounded-2xl border border-dashed border-ink/20 p-10 text-center text-ink/60 dark:border-cream/20 dark:text-cream/60">
            Nothing matches “{trimmed}” — try “tibs”, “pizza” or “buna”.
          </p>
        )
      ) : (
        children
      )}
    </div>
  );
}