'use client';

import { useRouter } from 'next/navigation';
import { useCart } from '@/features/cart/cart-store';

export interface ReorderItem {
  id: string; name: string; price: number; image: string; qty: number;
  available: boolean;   // server-resolved from db.json — never trusted from the client
}

/**
 * Reorder — only adds items the kitchen still offers.
 * - Some unavailable: adds the available ones and names the excluded.
 * - All unavailable: renders as a disabled "Out of stock" state.
 * Availability is computed server-side and passed in — the client store
 * only holds ids, so it cannot know availability on its own.
 */
export default function ReorderButton({ items }: { items: ReorderItem[] }) {
  const { add } = useCart();
  const router = useRouter();

  const available = items.filter((i) => i.available);
  const unavailable = items.filter((i) => !i.available);

  if (available.length === 0) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-1.5 text-xs font-semibold text-ink/40 dark:border-cream/20 dark:text-cream/40">
        Out of stock
      </span>
    );
  }

  const handleReorder = () => {
    for (const item of available) {
      for (let n = 0; n < item.qty; n++) add(item);
    }
    router.push('/cart');
  };

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleReorder}
        className="rounded-full border border-primary px-4 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-white"
      >
        Reorder
      </button>
      {unavailable.length > 0 && (
        <span className="text-[11px] font-medium text-ink/50 dark:text-cream/50">
          {unavailable.map((i) => i.name).join(', ')} out of stock
        </span>
      )}
    </span>
  );
}