// FavoritesView.tsx — one seeded fetch of the public dish list, filtered client-side
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useFavorites } from '@/features/favorites/favorites-store';
import SearchHit from '@/features/menu/SearchHit';
import type { Dish } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json()) as Promise<{ dishes: Dish[] }>;

export default function FavoritesView() {
  const { ids, hydrated } = useFavorites();
  const { data } = useSWR(hydrated ? '/api/dishes/search?q=' : null, fetcher, {
    fallbackData: { dishes: [] }, // no spinner on arrival — same seeding discipline
  });

  const favorites = (data?.dishes ?? []).filter((d) => ids.includes(d.id));

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Favorites</h1>
      {hydrated && favorites.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-ink/20 p-10 text-center dark:border-cream/20">
          <p className="text-ink/60 dark:text-cream/60">No saved dishes yet — tap the heart on anything that looks good.</p>
          <Link href="/menu" className="mt-4 inline-block rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-600">
            Browse the menu
          </Link>
        </div>
      )}
      {favorites.length > 0 && <ul className="mt-8 space-y-3">{favorites.map((dish) => <SearchHit key={dish.id} dish={dish} />)}</ul>}
    </section>
  );
}