'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FavoriteButton from '@/features/favorites/FavoriteButton';
import { useCart } from '@/features/cart/cart-store';
import { formatETB } from '@/lib/format-etb';

export interface FavoriteItem {
  id: string; name: string; price: number; image: string;
  description: string; favCount: number;
}

export default function FavoritesViewList({ items }: { items: FavoriteItem[] }) {
  const { add } = useCart();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-display text-3xl font-bold">Favorites</h1>
        <div className="mt-10 rounded-2xl border border-dashed border-ink/20 p-10 text-center dark:border-cream/20">
          <p className="text-ink/60 dark:text-cream/60">
            No saved dishes yet — tap the heart on anything that looks good.
          </p>
          <Link href="/menu" className="mt-4 inline-block rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-600">
            Browse the menu
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Favorites</h1>
          <p className="mt-1 text-sm text-ink/60 dark:text-cream/60">
            {items.length} saved — add them back in one tap.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            for (const item of items) {
              add({ id: item.id, name: item.name, price: item.price, image: item.image });
            }
            router.push('/cart');
          }}
          className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
        >
          Add all to cart
        </button>
      </div>

      <ul className="mt-8 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-white p-3 dark:border-cream/10 dark:bg-white/5">
            <Link href={`/menu/${item.id}`} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-primary-50 dark:bg-primary-900/40">
              <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/menu/${item.id}`} className="block truncate font-semibold hover:text-primary">{item.name}</Link>
              <p className="truncate text-sm text-ink/60 dark:text-cream/60">{item.description}</p>
              <p className="text-xs text-ink/50 dark:text-cream/50">
                {formatETB(item.price)} · ❤ {item.favCount} {item.favCount >= 2 ? '· Most loved' : ''}
              </p>
            </div>
            <FavoriteButton dishId={item.id} seedFavorited seedCount={item.favCount} />
            <button
              type="button"
              onClick={() => add({ id: item.id, name: item.name, price: item.price, image: item.image })}
              className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary-600"
            >
              Add
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}