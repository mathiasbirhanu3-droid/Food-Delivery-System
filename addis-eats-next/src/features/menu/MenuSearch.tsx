'use client';

import { useState } from 'react';
import useSWR from 'swr';
import SearchHit from '@/features/menu/SearchHit';
import { useDebounce } from '@/hooks/useDebounce';
import type { Dish } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json()) as Promise<{ dishes: Dish[] }>;

/** The ONE debounced search — seeded, 300 ms, zero requests when empty. */
export default function MenuSearch({ children, category }: { children: React.ReactNode; category: string }) {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 300);

  const trimmed = debounced.trim();
  const searching = trimmed.length > 0;
  const key = searching
    ? `/api/dishes/search?q=${encodeURIComponent(trimmed)}${category ? `&category=${encodeURIComponent(category)}` : ''}`
    : null;

  const { data, isLoading } = useSWR(key, fetcher, { keepPreviousData: true });

  if (!searching) return <div>{children}</div>; // ← default view = server cards, no client rendering

  const dishes = data?.dishes;

  return (
    <div>
      <input
        type="search" value={query} autoFocus
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search the menu"
        className="w-full rounded-full border border-ink/15 bg-white px-5 py-3 text-sm outline-none focus:border-primary dark:border-cream/20 dark:bg-white/5"
      />
      {isLoading && <p role="alert" aria-live="polite">Error searching for dishes.</p>}

      {!data ? (
        <ul className="mt-6 space-y-3" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="h-20 animate-pulse rounded-2xl bg-ink/10 dark:bg-cream/10" />
          ))}
        </ul>
      ) : dishes && dishes.length > 0 ? (
        <ul className="mt-6 space-y-3">{dishes.map((dish) => <SearchHit key={dish.id} dish={dish} />)}</ul>
      ) : (
        <p className="mt-12 rounded-2xl border border-dashed border-ink/20 p-10 text-center text-ink/60 dark:border-cream/20 dark:text-cream/60">
          Nothing matches “{trimmed}” — try “tibs”, “pizza” or “buna”.
        </p>
      )}
    </div>
  );
}