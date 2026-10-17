'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/features/cart/cart-store';
import { formatETB } from '@/lib/format-etb';

const HIDDEN_ON = ['/cart', '/checkout', '/orders', '/kitchen', '/signin'];

/** Sticky "view cart" bar while browsing — the pattern every major food app
 *  ships. Mobile only (sm+ has the header badge), floats above BottomNav. */
export default function CartBar() {
  const pathname = usePathname();
  const { count, subtotal, hydrated } = useCart();

  if (!hydrated || count === 0) return null;
  if (HIDDEN_ON.some((path) => pathname.startsWith(path))) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 sm:hidden">
      <Link
        href="/cart"
        aria-label={`View cart, ${count} items, ${formatETB(subtotal)}`}
        className="flex items-center justify-between gap-3 rounded-full bg-primary px-5 py-3 text-white shadow-lg shadow-primary/30 transition active:scale-[0.98]"
      >
        <span className="text-sm font-semibold">
          {count} item{count === 1 ? '' : 's'} · {formatETB(subtotal)}
        </span>
        <span className="text-sm font-bold">View cart →</span>
      </Link>
    </div>
  );
}