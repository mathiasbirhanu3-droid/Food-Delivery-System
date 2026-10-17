'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { useFavorites } from '@/features/favorites/favorites-store';
import SearchHit from '@/features/menu/SearchHit';
import type { Dish } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json()) as Promise<{ dishes: Dish[] }>;

/**
 * Feature 17 — Favorites. Reads the localStorage store, fetches the public
 * dish list once, filters locally. Seeding discipline: skeleton until the
 * list lands, honest empty state after — never a bare spinner. Skipped
 * entirely when nothing is saved yet (key = null → zero requests).
 */
export default function FavoritesView() {
  const { ids, hydrated } = useFavorites();

  const shouldFetch = hydrated && ids.length > 0;
  const { data, isLoading } = useSWR(shouldFetch ? '/api/dishes/search?q=' : null, fetcher, {
    keepPreviousData: true,
  });

  const favorites = (data?.dishes ?? []).filter((dish) => ids.includes(dish.id));
  const loading = !hydrated || (shouldFetch && isLoading);

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Favorites</h1>

      {loading ? (
        <ul className="mt-8 space-y-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="h-20 animate-pulse rounded-2xl bg-ink/10 dark:bg-cream/10" />
          ))}
        </ul>
      ) : favorites.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-ink/20 p-10 text-center dark:border-cream/20">
          <p className="text-ink/60 dark:text-cream/60">
            No saved dishes yet — tap the heart on anything that looks good.
          </p>
          <Link
            href="/menu"
            className="mt-4 inline-block rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-600"
          >
            Browse the menu
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {favorites.map((dish) => (
            <SearchHit key={dish.id} dish={dish} />
          ))}
        </ul>
      )}
    </section>
  );
}