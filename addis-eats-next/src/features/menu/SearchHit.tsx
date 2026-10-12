'use client';

import Image from 'next/image';
import Link from 'next/link';
import AddToCart from '@/features/menu/AddToCart';
import FavoriteButton from '@/features/favorites/FavoriteButton';
import { formatETB } from '@/lib/format-etb';
import { priceOf } from '@/lib/pricing';
import type { Dish } from '@/lib/types';

export default function SearchHit({ dish }: { dish: Dish }) {
  const { original, final, discountPercent } = priceOf(dish);
  const discounted = discountPercent > 0;

  return (
    <li className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-white p-3 dark:border-cream/10 dark:bg-white/5">
      <Link href={`/menu/${dish.id}`} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-primary-50 dark:bg-primary-900/40">
        <Image src={dish.image} alt={dish.name} fill sizes="64px" className="object-cover" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/menu/${dish.id}`} className="block truncate font-semibold hover:text-primary">{dish.name}</Link>
        {dish.marketingLine && (
          <p className="truncate text-xs font-semibold text-accent">✦ {dish.marketingLine}</p>
        )}
        <p className="truncate text-sm text-ink/60 dark:text-cream/60">{dish.description}</p>
      </div>
      <span className="shrink-0 text-right">
        {discounted && (
          <span className="mr-1 text-xs text-ink/40 line-through dark:text-cream/40">{formatETB(original)}</span>
        )}
        <span className="font-semibold text-primary">{formatETB(final)}</span>
      </span>
      <FavoriteButton dishId={dish.id} />
      <AddToCart compact dish={{ id: dish.id, name: dish.name, price: final, image: dish.image }} />
    </li>
  );
}