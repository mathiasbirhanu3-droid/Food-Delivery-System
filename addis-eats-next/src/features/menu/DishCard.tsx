import Image from 'next/image';
import Link from 'next/link';
import { getSession } from '@/lib/session-server';
import { getFavoriteCounts, getOrderCountsByDish, isFavorite } from '@/lib/db';
import { resolveDishImage } from '@/lib/resolve-dish-image';
import { priceOf } from '@/lib/pricing';
import AddToCart from '@/features/menu/AddToCart';
import FavoriteButton from '@/features/favorites/FavoriteButton';
import { formatETB } from '@/lib/format-etb';
import type { Dish } from '@/lib/types';

export default async function DishCard({ dish, priority = false }: { dish: Dish; priority?: boolean }) {
  const session = await getSession();
  const seedFavorited = session ? isFavorite(session.userId, dish.id) : false;
  const favCount = getFavoriteCounts()[dish.id] ?? 0;
  const orderedCount = getOrderCountsByDish()[dish.id] ?? 0;
  const mostLoved = favCount >= 2;

  const image = resolveDishImage(dish.image);
  const { original, final, discountPercent } = priceOf(dish);
  const discounted = discountPercent > 0;

  return (
    <article className="group overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 dark:border-cream/10 dark:bg-white/5">
      <Link href={`/menu/${dish.id}`} className="block">
        <div className="relative aspect-[4/3] bg-primary-50 dark:bg-primary-900/40">
          <Image
            src={image} alt={dish.name} fill priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {dish.popular && (
              <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-ink">Popular</span>
            )}
            {mostLoved && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white">Most loved</span>
            )}
            {discounted && (
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-accent shadow">
                {discountPercent}% OFF
              </span>
            )}
          </div>
        </div>
        <div className="p-4 pb-0">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-display font-semibold">{dish.name}</h2>
            <span className="whitespace-nowrap text-right">
              {discounted && (
                <span className="mr-1 text-sm text-ink/40 line-through dark:text-cream/40">{formatETB(original)}</span>
              )}
              <span className="font-semibold text-primary">{formatETB(final)}</span>
            </span>
          </div>
          {dish.marketingLine && (
            <p className="mt-1 rounded-lg bg-gold/15 px-2 py-1 text-xs font-semibold text-ink dark:text-cream">
              ✦ {dish.marketingLine}
            </p>
          )}
          <p className="mt-1 line-clamp-2 text-sm text-ink/60 dark:text-cream/60">{dish.description}</p>
        </div>
      </Link>
      <div className="flex items-center justify-between p-4">
        <span className="text-xs text-ink/50 dark:text-cream/50">
          ★ {dish.rating} · {dish.prepMinutes} min{orderedCount > 0 ? ` · ordered ×${orderedCount}` : ''}
        </span>
        <div className="flex items-center gap-2">
          <FavoriteButton dishId={dish.id} seedFavorited={seedFavorited} seedCount={favCount} />
          <AddToCart compact dish={{ id: dish.id, name: dish.name, price: final, image }} />
        </div>
      </div>
    </article>
  );
}