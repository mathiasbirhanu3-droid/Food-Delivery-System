'use client';

import { usePathname, useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { toggleFavoriteAction } from '@/actions/favorites';

type Me = { ids: string[]; counts: Record<string, number> };
const fetcher = (url: string) =>
  fetch(url).then((res) => (res.ok ? res.json() : Promise.reject(res.status))) as Promise<Me>;

/**
 * The heart on every card. First paint is correct from server seeds (no
 * spinner); all instances share one SWR key (/api/favorites/me), so a toggle
 * anywhere — card, detail, panel — updates every heart and the header badge
 * with a single reconciling request. Guests see counts (public) but are
 * nudged to sign in on tap.
 */
export default function FavoriteButton({
  dishId,
  seedFavorited = false,
  seedCount = 0,
}: {
  dishId: string;
  seedFavorited?: boolean;
  seedCount?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { mutate } = useSWRConfig();

  const { data, error } = useSWR<Me>('/api/favorites/me', fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const guest = Boolean(error); // 401 → signed out
  const favorited = data ? data.ids.includes(dishId) : seedFavorited;
  const count = data ? (data.counts[dishId] ?? 0) : seedCount;

  async function onClick() {
    if (guest || data === undefined) {
      router.push(`/signin?next=${encodeURIComponent(pathname)}`);
      return;
    }
    // Optimistic flip, then reconcile from the server.
    mutate(
      '/api/favorites/me',
      (me: Me | undefined) => {
        if (!me) return me;
        const wasFavorited = me.ids.includes(dishId);
        const ids = wasFavorited ? me.ids.filter((id) => id !== dishId) : [...me.ids, dishId];
        const counts = {
          ...me.counts,
          [dishId]: Math.max(0, (me.counts[dishId] ?? 0) + (wasFavorited ? -1 : 1)),
        };
        return { ids, counts };
      },
      { revalidate: false },
    );

    const result = await toggleFavoriteAction(dishId);
    if (result.ok) mutate('/api/favorites/me');
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={favorited}
      aria-label={
        favorited
          ? `Remove ${dishId} from favorites, ${count} people love this`
          : `Save ${dishId} to favorites, ${count} people love this`
      }
      className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-full border transition ${
        favorited
          ? 'border-accent bg-accent/10 text-accent'
          : 'border-ink/15 text-ink/50 hover:border-accent hover:text-accent dark:border-cream/20 dark:text-cream/50'
      }`}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill={favorited ? 'currentColor' : 'none'} aria-hidden="true">
        <path
          d="M12 21s-7.5-4.6-10-9.3C.5 8 2.6 4.5 6.2 4.5c2 0 3.6 1.1 4.6 2.7l1.2 1.9 1.2-1.9c1-1.6 2.6-2.7 4.6-2.7 3.6 0 5.7 3.5 4.2 7.2C19.5 16.4 12 21 12 21Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
      {count > 0 && (
        <span
          className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold leading-none text-ink"
          aria-hidden="true"
        >
          {count}
        </span>
      )}
    </button>
  );
}