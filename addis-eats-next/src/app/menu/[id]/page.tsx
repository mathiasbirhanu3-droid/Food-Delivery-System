import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  getDish,
  getFavoriteCounts,
  getOrderCountsByDish,
  isFavorite,
} from '@/lib/db';
import { getSession } from '@/lib/session-server';
import { formatETB } from '@/lib/format';
import { priceOf } from '@/lib/pricing';
import AddToCart from '@/features/menu/AddToCart';
import FavoriteButton from '@/features/favorites/FavoriteButton';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const dish = getDish(id);
  if (!dish) return { title: 'Dish not found' };

  const { final } = priceOf(dish);
  const specialPrefix = dish.specialOfDay ? '🔥 Today only — ' : '';

  return {
    title: dish.name,
    description: `${specialPrefix}${dish.name} — ${dish.description} ${formatETB(final)} at Addis Eats.`,
    openGraph: {
      title: specialPrefix ? `🔥 Special of the day: ${dish.name}` : `${dish.name} — Addis Eats`,
      description: `${dish.description} · ${formatETB(final)}`,
    },
  };
}

export default async function DishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dish = getDish(id);
  if (!dish) notFound();

  // ── Social proof, computed server-side (no client fetch, no hydration cost) ──
  const session = await getSession();
  const favCount = getFavoriteCounts()[dish.id] ?? 0;
  const orderedCount = getOrderCountsByDish()[dish.id] ?? 0;
  const seedFavorited = session ? isFavorite(session.userId, dish.id) : false;

  const { original, final, discountPercent } = priceOf(dish);
  const discounted = discountPercent > 0;

  // JSON-LD must match what the page actually shows (Day 44 rule).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MenuItem',
    name: dish.name,
    description: dish.description,
    offers: {
      '@type': 'Offer',
      price: final,
      priceCurrency: 'ETB',
      availability: dish.available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <article className="mx-auto max-w-4xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-primary-50 dark:bg-primary-900/40">
        <Image
          src={dish.image}
          alt={dish.name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 896px"
          className="object-cover"
        />
        {/* ── badges: special / popular / discount ── */}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {dish.specialOfDay && (
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
              🔥 Special of the day
            </span>
          )}
          {dish.popular && (
            <span className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-ink shadow">
              ⭐ Popular
            </span>
          )}
          {discounted && (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-accent shadow">
              {discountPercent}% OFF
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">{dish.name}</h1>
        <span className="whitespace-nowrap text-right">
          {discounted && (
            <span className="mr-2 text-xl text-ink/40 line-through dark:text-cream/40">
              {formatETB(original)}
            </span>
          )}
          <span className="font-display text-3xl font-bold text-primary">{formatETB(final)}</span>
        </span>
      </div>

      {dish.marketingLine && (
        <p className="mt-3 rounded-xl bg-gold/15 px-4 py-2 text-sm font-semibold text-ink dark:text-cream">
          ✦ {dish.marketingLine}
        </p>
      )}

      <p className="mt-3 text-ink/70 dark:text-cream/70">{dish.description}</p>

      {(favCount > 0 || orderedCount > 0) && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink/60 dark:text-cream/60">
          {favCount > 0 && (
            <span>
              {favCount} {favCount === 1 ? 'person loves' : 'people love'} this
            </span>
          )}
          {favCount > 0 && orderedCount > 0 && <span aria-hidden="true">·</span>}
          {orderedCount > 0 && <span>ordered ×{orderedCount}</span>}
          {favCount >= 2 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white">
              Most loved
            </span>
          )}
        </p>
      )}

      <h2 className="mt-6 font-semibold">Ingredients</h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {dish.ingredients.map((ingredient) => (
          <li
            key={ingredient}
            className="rounded-full border border-ink/15 px-3 py-1 text-sm dark:border-cream/20"
          >
            {ingredient}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <FavoriteButton dishId={dish.id} seedFavorited={seedFavorited} seedCount={favCount} />
        <AddToCart dish={{ id: dish.id, name: dish.name, price: final, image: dish.image }} />
        <span className="text-sm text-ink/50 dark:text-cream/50">
          ★ {dish.rating} · {dish.prepMinutes} min prep
        </span>
      </div>

      <p className="mt-8 text-xs text-ink/40 dark:text-cream/40">
        Cash on delivery · {dish.prepMinutes} min prep · delivering to Bole, Kazanchis, Piassa, Saris, Gerji
      </p>
    </article>
  );
}