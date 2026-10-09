'use client';

import { useRouter } from 'next/navigation';
import { useCart } from '@/features/cart/cart-store';

export default function ReorderButton({ items }: { items: { id: string; name: string; price: number; image: string; qty: number }[] }) {
  const { add } = useCart();
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        for (const item of items) for (let n = 0; n < item.qty; n++) add(item);
        router.push('/cart');
      }}
      className="rounded-full border border-primary px-4 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-white"
    >
      Reorder
    </button>
  );
}