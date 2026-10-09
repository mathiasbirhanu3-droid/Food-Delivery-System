'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/features/cart/cart-store';
import { formatETB } from '@/lib/format-etb';

export interface FavoriteMenuItem {
  id: string; name: string; price: number; image: string; favCount: number;
}

/** Header favorites. Desktop: dropdown panel. Mobile: bottom sheet with
 *  backdrop + scroll lock (the Swiggy/Uber pattern). One-tap re-add. */
export default function FavoritesMenu({ items, count }: { items: FavoriteMenuItem[]; count: number }) {
  const [open, setOpen] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const { add } = useCart();

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const rows = (
    <>
      {items.length === 0 ? (
        <div className="p-5 text-center">
          <p className="text-sm text-ink/60 dark:text-cream/60">No favorites yet — tap a heart on the menu.</p>
          <Link href="/menu" onClick={() => setOpen(false)} className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">
            Browse the menu →
          </Link>
        </div>
      ) : (
        <>
          <ul className="max-h-[50vh] space-y-1 overflow-y-auto sm:max-h-80">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-cream dark:hover:bg-white/5">
                <Link href={`/menu/${item.id}`} onClick={() => setOpen(false)} className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-primary-50 dark:bg-primary-900/40">
                  <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/menu/${item.id}`} onClick={() => setOpen(false)} className="block truncate text-sm font-semibold hover:text-primary">
                    {item.name}
                  </Link>
                  <p className="text-xs text-ink/50 dark:text-cream/50">
                    {formatETB(item.price)} · ❤ {item.favCount}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    add({ id: item.id, name: item.name, price: item.price, image: item.image });
                    setJustAdded(item.id);
                    window.setTimeout(() => setJustAdded(null), 1200);
                  }}
                  aria-label={`Add ${item.name} to cart`}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition active:scale-95 ${
                    justAdded === item.id ? 'bg-primary/15 text-primary' : 'bg-primary text-white hover:bg-primary-600'
                  }`}
                >
                  {justAdded === item.id ? 'Added ✓' : 'Add'}
                </button>
              </li>
            ))}
          </ul>
          <Link
            href="/favorites"
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-xl p-3 text-center text-sm font-semibold text-primary hover:bg-primary/5"
          >
            See all favorites →
          </Link>
        </>
      )}
    </>
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Favorites, ${count} saved`}
        className="relative grid h-9 w-9 place-items-center rounded-full border border-ink/15 text-sm transition hover:border-accent hover:text-accent active:scale-95 dark:border-cream/20"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 21s-7.5-4.6-10-9.3C.5 8 2.6 4.5 6.2 4.5c2 0 3.6 1.1 4.6 2.7l1.2 1.9 1.2-1.9c1-1.6 2.6-2.7 4.6-2.7 3.6 0 5.7 3.5 4.2 7.2C19.5 16.4 12 21 12 21Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close favorites"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 sm:hidden"
          />
          <div
            role="dialog"
            aria-label="Your favorites"
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border border-ink/10 bg-white p-3 pb-safe shadow-card sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 sm:rounded-2xl dark:border-cream/10 dark:bg-ink"
          >
            <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-ink/15 sm:hidden dark:bg-cream/15" aria-hidden="true" />
            {rows}
          </div>
        </>
      )}
    </div>
  );
}