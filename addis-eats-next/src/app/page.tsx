import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getDishes, getRestaurant, getSpecialOfDay } from '@/lib/db';
import { priceOf } from '@/lib/pricing';
import { formatETB } from '@/lib/format';
import DishCard from '@/features/menu/DishCard';
import AddToCart from '@/features/menu/AddToCart';

export const metadata: Metadata = {
  title: 'Ethiopian food, delivered in Addis Ababa',
  description:
    'Addis Eats delivers doro wat, sega tibs, pizza and buna across Addis Ababa — live order tracking, honest ETB prices, cash on delivery.',
};

export default async function HomePage() {
  const restaurant = getRestaurant();
  const special = getSpecialOfDay(); // null when none is set
  const specials = special
    ? [special]
    : getDishes().filter((d) => d.popular).slice(0, 3); // Day 35 fallback: popular dishes

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: restaurant.name,
    description: restaurant.tagline,
    telephone: restaurant.phone,
    servesCuisine: ['Ethiopian', 'Pizza', 'Burgers'],
    address: {
      '@type': 'PostalAddress',
      streetAddress: restaurant.address,
      addressLocality: 'Addis Ababa',
      addressCountry: 'ET',
    },
    openingHours: restaurant.hours,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* hero — unchanged */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
        <p className="text-sm font-bold uppercase tracking-widest text-accent">Bole · Addis Ababa</p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-tight sm:text-6xl">
          Ethiopian kitchens, <span className="text-primary">delivered hot.</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-ink/70 dark:text-cream/70">
          Doro wat, sega tibs and buna from Addis Eats — live order tracking, honest ETB
          prices, delivery across Addis Ababa.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/menu" className="rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-600">
            Browse the menu
          </Link>
          <Link href="/signin" className="rounded-full border border-ink/15 px-6 py-3 font-semibold hover:border-primary hover:text-primary dark:border-cream/20">
            Sign in
          </Link>
        </div>
      </section>

      {/* ── Special of the Day — admin-controlled hero ── */}
      {special && (
        <section className="mx-auto max-w-6xl px-4 pb-14" aria-label="Special of the day">
          <div className="overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-r from-accent/10 via-gold/10 to-transparent shadow-card">
            <div className="grid gap-0 md:grid-cols-2">
              <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[320px]">
                <Image
                  src={special.image} alt={special.name} fill priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
                <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
                  🔥 Special of the day
                </span>
              </div>
              <div className="flex flex-col justify-center gap-3 p-8">
                <p className="text-xs font-bold uppercase tracking-widest text-accent">Today only</p>
                <h2 className="font-display text-3xl font-bold">{special.name}</h2>
                {special.marketingLine && (
                  <p className="text-sm font-semibold text-ink/70 dark:text-cream/70">✦ {special.marketingLine}</p>
                )}
                <p className="text-ink/60 dark:text-cream/60">{special.description}</p>
                <div className="flex flex-wrap items-center gap-3">
                  {priceOf(special).discountPercent > 0 && (
                    <span className="text-lg text-ink/40 line-through dark:text-cream/40">
                      {formatETB(priceOf(special).original)}
                    </span>
                  )}
                  <span className="font-display text-3xl font-bold text-primary">
                    {formatETB(priceOf(special).final)}
                  </span>
                  {priceOf(special).savings > 0 && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white">
                      save {formatETB(priceOf(special).savings)}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <AddToCart dish={{ id: special.id, name: special.name, price: priceOf(special).final, image: special.image }} />
                  <Link href={`/menu/${special.id}`} className="text-sm font-semibold text-primary hover:underline">
                    See details →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Today's specials — the special dish, or the popular fallback */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-bold">Today&apos;s specials</h2>
          <Link href="/menu" className="text-sm font-semibold text-primary hover:underline">
            See the full menu →
          </Link>
        </div>
        <ul className="mt-6 grid gap-5 sm:grid-cols-3">
          {specials.map((dish, index) => (
            <li key={dish.id}>
              <DishCard dish={dish} priority={index === 0} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-16 sm:grid-cols-3">
        {[
          ['Live order tracking', 'Watch your courier move on a real map — no refresh needed.'],
          ['Your data, yours only', 'Every order list and favorite list is scoped to your signed-in session.'],
          ['Fast on any phone', 'Server-rendered pages, optimized images, measured performance.'],
        ].map(([title, body]) => (
          <div key={title} className="rounded-2xl border border-ink/10 bg-white p-6 shadow-card dark:border-cream/10 dark:bg-white/5">
            <h2 className="font-display font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-ink/60 dark:text-cream/60">{body}</p>
          </div>
        ))}
      </section>
    </>
  );
}