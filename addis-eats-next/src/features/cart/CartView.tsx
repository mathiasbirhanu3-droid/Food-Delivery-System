'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useCart } from '@/features/cart/cart-store';
import { formatETB } from '@/lib/format-etb';
import type { Dish } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json()) as Promise<{ dishes: Dish[] }>;

export default function CartView() {
  const { lines, hydrated, increment, decrement, remove, subtotal, clear } = useCart();
  const [staleNotice, setStaleNotice] = useState('');

  // Self-heal: on mount, compare cart lines against the live dish list.
  // Missing or unavailable dishes are removed and announced — the checkout
  // write would refuse them anyway (server re-prices from db.json).
  useEffect(() => {
    if (!hydrated || lines.length === 0) return;
    let cancelled = false;
    fetch('/api/dishes/search?q=')
      .then((res) => res.json())
      .then(({ dishes }: { dishes: Dish[] }) => {
        if (cancelled) return;
        const available = new Set(dishes.filter((d) => d.available).map((d) => d.id));
        const stale = lines.filter((line) => !available.has(line.id));
        if (stale.length > 0) {
          for (const line of stale) remove(line.id);
          setStaleNotice(
            `${stale.map((s) => s.name).join(', ')} ${stale.length === 1 ? 'is' : 'are'} no longer available and ${stale.length === 1 ? 'was' : 'were'} removed from your cart.`,
          );
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  if (!hydrated) return <div className="mx-auto max-w-2xl px-4 py-20" aria-busy="true" />;

  if (lines.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-ink/60 dark:text-cream/60">
          {staleNotice || 'Nothing here yet — the kitchen is waiting.'}
        </p>
        <Link href="/menu" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-600">
          Browse the menu
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Your cart</h1>

      {staleNotice && (
        <p role="alert" className="mt-4 rounded-xl bg-gold/20 p-3 text-sm font-medium">
          {staleNotice}
        </p>
      )}

      <ul className="mt-8 space-y-3">
        {lines.map((line) => (
          <li key={line.id} className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-white p-3 dark:border-cream/10 dark:bg-white/5">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-primary-50 dark:bg-primary-900/40">
              <Image src={line.image} alt="" fill sizes="64px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{line.name}</p>
              <p className="text-sm text-ink/50 dark:text-cream/50">{formatETB(line.price)} each</p>
            </div>
            <div className="flex items-center gap-2" role="group" aria-label={`Quantity for ${line.name}`}>
              <button type="button" onClick={() => decrement(line.id)} aria-label={`Decrease ${line.name}`}
                className="h-8 w-8 rounded-full border border-ink/15 font-bold hover:border-primary dark:border-cream/20">−</button>
              <span className="w-6 text-center font-semibold" aria-live="polite">{line.qty}</span>
              <button type="button" onClick={() => increment(line.id)} aria-label={`Increase ${line.name}`}
                className="h-8 w-8 rounded-full border border-ink/15 font-bold hover:border-primary dark:border-cream/20">+</button>
            </div>
            <span className="w-20 text-right font-semibold">{formatETB(line.qty * line.price)}</span>
            <button type="button" onClick={() => remove(line.id)} aria-label={`Remove ${line.name}`}
              className="text-ink/40 hover:text-accent dark:text-cream/40">✕</button>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between rounded-2xl bg-white p-4 shadow-card dark:bg-white/5">
        <span className="font-medium">Subtotal</span>
        <span className="font-display text-xl font-bold text-primary" aria-live="polite">{formatETB(subtotal)}</span>
      </div>
      <p className="mt-2 text-sm text-ink/50 dark:text-cream/50">Delivery fee and estimated time are calculated at checkout from your area.</p>

      <Link href="/checkout" className="mt-6 block rounded-full bg-primary py-3 text-center font-semibold text-white hover:bg-primary-600">
        Continue to checkout
      </Link>

      <button type="button" onClick={clear} className="mt-3 block w-full text-center text-sm text-ink/50 hover:text-accent dark:text-cream/50">
        Clear cart
      </button>
    </section>
  );
}