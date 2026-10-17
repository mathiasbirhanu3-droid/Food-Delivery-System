'use client';

import { useState } from 'react';
import { useCart } from '@/features/cart/cart-store';

export default function AddToCart({
  dish,
  compact = false,
  available = true,
}: {
  dish: { id: string; name: string; price: number; image: string };
  compact?: boolean;
  available?: boolean;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  // Hidden by the kitchen → no purchase path. Honest, small label.
  if (!available) {
    return (
      <span
        className={`shrink-0 text-[11px] font-semibold text-ink/45 dark:text-cream/45 ${
          compact ? 'px-2' : 'px-8 py-3'
        }`}
      >
        Out of stock
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-label={`Add ${dish.name} to cart`}
      onClick={() => {
        add(dish);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1200);
      }}
      className={`shrink-0 rounded-full font-semibold transition ${
        compact ? 'px-4 py-1.5 text-sm' : 'px-8 py-3'
      } ${added ? 'bg-primary/15 text-primary' : 'bg-primary text-white hover:bg-primary-600'}`}
    >
      {added ? (compact ? 'Added ✓' : 'Added to cart ✓') : compact ? 'Add' : 'Add to cart'}
    </button>
  );
}