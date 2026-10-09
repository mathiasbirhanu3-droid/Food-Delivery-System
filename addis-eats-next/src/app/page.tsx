import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getDishes, getRestaurant } from '@/lib/db';
import DishCard from '@/features/menu/DishCard';

export const metadata: Metadata = {
  title: 'Ethiopian food, delivered in Addis Ababa',
  description:
    'Addis Eats delivers doro wat, sega tibs, pizza and buna across Addis Ababa — live order tracking, honest ETB prices, cash on delivery.',
};

// Swap the URL to change the photo — any images.unsplash.com URL works
// (host allow-listed in next.config.mjs). Alternatives:
//   …/photo-1583394293214-28ded15ee548  (chef portrait, dark background)
//   …/photo-1581299894007-aaa50297cf16  (chef tossing a pan — action shot)
const CHEF_IMAGE =
  'https://i.pinimg.com/736x/b2/a9/d2/b2a9d243324d76356613e7b1cd56ac89.jpg';

export default function HomePage() {
  const restaurant = getRestaurant();
  const specials = getDishes().filter((d) => d.popular).slice(0, 3);

  // JSON-LD must match what the page actually shows (Day 44 rule).
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

      {/* ── Animated, guest-inviting hero ── */}
      <section className="relative overflow-hidden">
        {/* kitchen-light glow — decorative pulse */}
        <div
          aria-hidden="true"
          className="animate-glowpulse pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/25 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:pt-16 lg:grid-cols-2">
          {/* Photo first on phones; right column on lg+ */}
          <div className="order-first relative lg:order-last">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-ink/10 shadow-card dark:border-cream/10">
              {/* Ken Burns: scales INSIDE the fixed frame — CLS stays 0 */}
              <Image
                src={CHEF_IMAGE}
                alt="Our chef welcoming you to the Addis Eats kitchen"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="animate-kenburns object-cover"
              />
              <span className="animate-floaty absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink shadow-card backdrop-blur dark:bg-ink/85 dark:text-cream">
                Open now · {restaurant.hours}
              </span>
            </div>

            <div className="absolute -bottom-5 left-4 flex items-center gap-2.5 rounded-2xl border border-ink/10 bg-white px-4 py-3 shadow-card dark:border-cream/10 dark:bg-ink sm:left-8">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-white" aria-hidden="true">
                ✓
              </span>
              <div>
                <p className="text-sm font-bold">Cooked fresh, every day</p>
                <p className="text-xs text-ink/55 dark:text-cream/55">From our kitchen in Bole</p>
              </div>
            </div>
          </div>

          {/* Staggered entrance: headline → copy → CTAs → note */}
          <div className="pt-4 lg:pt-0">
            <p className="animate-fadeup text-sm font-bold uppercase tracking-widest text-accent">
              Bole · Addis Ababa
            </p>
            <h1 className="animate-fadeup delay-100 mt-3 max-w-xl font-display text-4xl font-bold leading-tight sm:text-6xl">
              Welcome — you&apos;re eating with <span className="text-primary">family tonight.</span>
            </h1>
            <p className="animate-fadeup delay-200 mt-4 max-w-xl text-lg text-ink/70 dark:text-cream/70">
              Our chef slow-simmers every wat and fires every pizza to order. Browse the menu
              freely — sign in only when you&apos;re ready to eat.
            </p>

            <div className="animate-fadeup delay-300 mt-8 flex flex-wrap gap-3">
              <Link
                href="/menu"
                className="btn-shine rounded-full bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-600 active:scale-95"
              >
                Browse the menu
              </Link>
              <Link
                href="/signin"
                className="rounded-full border border-ink/15 px-6 py-3 font-semibold transition hover:border-primary hover:text-primary active:scale-95 dark:border-cream/20"
              >
                Sign in
              </Link>
            </div>

            <p className="animate-fadeup delay-300 mt-4 text-sm text-ink/50 dark:text-cream/50">
              New here? No account needed to browse — check out as a guest in seconds.
            </p>
          </div>
        </div>
      </section>

      {/* ── Today's specials ── */}
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
              <DishCard dish={dish} priority={false} />
            </li>
          ))}
        </ul>
      </section>

      {/* ── Trust cards ── */}
      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-16 sm:grid-cols-3">
        {[
          ['Live order status', 'Watch your order move from pending to delivered — no refresh needed.'],
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