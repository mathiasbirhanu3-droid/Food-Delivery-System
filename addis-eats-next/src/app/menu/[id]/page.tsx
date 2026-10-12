import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getDish, getFavoriteCounts, getOrderCountsByDish, isFavorite } from '@/lib/db';
import { getSession } from '@/lib/session-server';
import { formatETB } from '@/lib/format-etb';
import AddToCart from '@/features/menu/AddToCart';
import FavoriteButton from '@/features/favorites/FavoriteButton';
import StickyDishBar from '@/features/menu/StickyDishBar';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const dish = getDish(id);
  if (!dish) return { title: 'Dish not found' };
  return {
    title: dish.name,
    description: `${dish.name} — ${dish.description} ${formatETB(dish.price)} at Addis Eats.`,
    openGraph: {
      title: `${dish.name} — Addis Eats`,
      description: `${dish.description} · ${formatETB(dish.price)}`,
    },
  };
}

export default async function DishPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dish = getDish(id);
  if (!dish) notFound();

  const session = await getSession();
  const favCount = getFavoriteCounts()[dish.id] ?? 0;
  const orderedCount = getOrderCountsByDish()[dish.id] ?? 0;
  const seedFavorited = session ? isFavorite(session.userId, dish.id) : false;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MenuItem',
    name: dish.name,
    description: dish.description,
    offers: {
      '@type': 'Offer',
      price: dish.price,
      priceCurrency: 'ETB',
      availability: dish.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <article className="mx-auto max-w-4xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-primary-50 dark:bg-primary-900/40">
        <Image src={dish.image} alt={dish.name} fill priority sizes="(max-width: 1024px) 100vw, 896px" className="object-cover" />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">{dish.name}</h1>
        <span className="font-display text-2xl font-bold text-primary">{formatETB(dish.price)}</span>
      </div>

      <p className="mt-3 text-ink/70 dark:text-cream/70">{dish.description}</p>

      {(favCount > 0 || orderedCount > 0) && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink/60 dark:text-cream/60">
          {favCount > 0 && <span>{favCount} {favCount === 1 ? 'person loves' : 'people love'} this</span>}
          {favCount > 0 && orderedCount > 0 && <span aria-hidden="true">·</span>}
          {orderedCount > 0 && <span>ordered ×{orderedCount}</span>}
          {favCount >= 2 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white">Most loved</span>
          )}
        </p>
      )}

      <h2 className="mt-6 font-semibold">Ingredients</h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {dish.ingredients.map((ingredient) => (
          <li key={ingredient} className="rounded-full border border-ink/15 px-3 py-1 text-sm dark:border-cream/20">
            {ingredient}
          </li>
        ))}
      </ul>

      {/* Desktop/tablet actions — mobile gets the sticky bar below */}
      <div className="mt-8 hidden flex-wrap items-center gap-4 sm:flex">
        <FavoriteButton dishId={dish.id} seedFavorited={seedFavorited} seedCount={favCount} />
        <AddToCart dish={{ id: dish.id, name: dish.name, price: dish.price, image: dish.image }} />
        <span className="text-sm text-ink/50 dark:text-cream/50">★ {dish.rating} · {dish.prepMinutes} min prep</span>
      </div>

      {/* Mobile sticky order bar */}
      <StickyDishBar
        dish={{ id: dish.id, name: dish.name, price: dish.price, image: dish.image }}
        seedFavorited={seedFavorited}
        seedCount={favCount}
      />

      <p className="mt-10 pb-16 text-xs text-ink/40 sm:pb-0 dark:text-cream/40">
        Cash on delivery · {dish.prepMinutes} min prep · delivering to Bole, Kazanchis, Piassa, Saris, Gerji
      </p>
    </article>
  );
}