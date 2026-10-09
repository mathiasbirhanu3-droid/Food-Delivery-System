'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session-server';
import { getDish } from '@/lib/db';
import { toggleFavoriteFor } from '@/lib/favorites-store';

export type ToggleFavoriteResult =
  | { ok: true; favorited: boolean; count: number }
  | { ok: false; reason: 'session' | 'dish' };

/** AUTH.md — layer 3a: the session is re-derived here on every call. */
export async function toggleFavoriteAction(dishId: string): Promise<ToggleFavoriteResult> {
  const session = await getSession();
  if (!session) return { ok: false, reason: 'session' }; // ← guest refused HERE

  const dish = getDish(dishId);
  if (!dish) return { ok: false, reason: 'dish' };

  const result = toggleFavoriteFor(session.userId, dishId);
  revalidatePath('/favorites');
  revalidatePath('/');
  return { ok: true, ...result };
}