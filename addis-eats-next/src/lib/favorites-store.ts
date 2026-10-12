import dbData from '@/data/db.json';
import type { Favorite } from '@/lib/types';
import { persistDbDev } from '@/lib/persist-dev';

/**
 * Favorites v2 — per-account, server-side. Seeded from db.json (the single
 * data source). AUTH.md: only scoped reads and a public aggregate exist
 * here; there is no "all favorites with users" export.
 */
const favorites = ((dbData as unknown as { favorites?: Favorite[] }).favorites ?? []).map((f) =>
  structuredClone(f),
);

/** AUTH.md — scoped: a user's favorite dish ids, newest first. */
export const getFavoritesFor = (userId: string): string[] =>
  favorites
    .filter((f) => f.userId === userId)
    .map((f) => f.dishId)
    .reverse();

export const isFavorite = (userId: string, dishId: string): boolean =>
  favorites.some((f) => f.userId === userId && f.dishId === dishId);

/** Public aggregate — a count leaks nothing personal. */
export const getFavoriteCounts = (): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const f of favorites) counts[f.dishId] = (counts[f.dishId] ?? 0) + 1;
  return counts;
};

export function toggleFavoriteFor(userId: string, dishId: string): { favorited: boolean; count: number } {
  const index = favorites.findIndex((f) => f.userId === userId && f.dishId === dishId);
  let favorited: boolean;
  if (index >= 0) {
    favorites.splice(index, 1);
    favorited = false;
  } else {
    favorites.push({ userId, dishId, at: new Date().toISOString() });
    favorited = true;
  }
  persistDbDev({ favorites });
  return { favorited, count: favorites.filter((f) => f.dishId === dishId).length };
}