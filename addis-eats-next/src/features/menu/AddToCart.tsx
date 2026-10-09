'use client';

import { useState } from 'react';
import { useCart } from '@/features/cart/cart-store';

export default function AddToCart({
  dish, compact = false,
}: { dish: { id: string; name: string; price: number; image: string }; compact?: boolean }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      aria-label={`Add ${dish.name} to cart`}
      onClick={() => { add(dish); setAdded(true); window.setTimeout(() => setAdded(false), 1200); }}
      className={`shrink-0 rounded-full font-semibold transition ${
        compact ? 'px-4 py-1.5 text-sm' : 'px-8 py-3'
      } ${added ? 'bg-primary/15 text-primary' : 'bg-primary text-white hover:bg-primary-600'}`}
    >
      {added ? (compact ? 'Added ✓' : 'Added to cart ✓') : compact ? 'Add' : 'Add to cart'}
    </button>
  );
}