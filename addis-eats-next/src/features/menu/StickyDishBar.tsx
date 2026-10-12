'use client';

import { useState } from 'react';
import FavoriteButton from '@/features/favorites/FavoriteButton';
import { useCart } from '@/features/cart/cart-store';
import { formatETB } from '@/lib/format-etb';

interface DishRef { id: string; name: string; price: number; image: string }

/** Mobile-only sticky order bar on the dish page: price + heart + Add,
 *  floating above BottomNav. Hidden on sm+ (inline actions serve there). */
export default function StickyDishBar({ dish, seedFavorited, seedCount }: {
  dish: DishRef;
  seedFavorited: boolean;
  seedCount: number;
}) {
  const { add, count } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <div className="fixed inset-x-3 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 flex items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white/95 p-3 shadow-lg backdrop-blur sm:hidden dark:border-cream/10 dark:bg-ink/95">
      <div className="min-w-0">
        <p className="truncate text-xs text-ink/50 dark:text-cream/50">{dish.name}</p>
        <p className="font-display font-bold text-primary">{formatETB(dish.price)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <FavoriteButton dishId={dish.id} seedFavorited={seedFavorited} seedCount={seedCount} />
        <button
          type="button"
          onClick={() => { add(dish); setAdded(true); window.setTimeout(() => setAdded(false), 1200); }}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition active:scale-95"
        >
          {added ? 'Added ✓' : count > 0 ? `Add · ${count} in cart` : 'Add to cart'}
        </button>
      </div>
    </div>
  );
}