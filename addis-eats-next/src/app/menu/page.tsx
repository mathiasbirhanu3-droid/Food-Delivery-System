import type { Metadata } from 'next';
import { getDishes, getFavoriteCounts, getOrderCountsByDish } from '@/lib/db';
import CategoryBar from '@/features/menu/CategoryBar';
import MenuSearch from '@/features/menu/MenuSearch';
import DishCard from '@/features/menu/DishCard';
import { CATEGORIES, type Category } from '@/features/menu/categories';
import { priceOf } from '@/lib/pricing';

export const metadata: Metadata = {
  title: 'Menu',
  description:
    'Doro wat, kitfo, tibs, pizza, burgers, fresh juice and buna — the full Addis Eats menu with ETB prices.',
};

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const { category, sort } = await searchParams;
  const active = CATEGORIES.find((c) => c === category) as Category | undefined;

  const all = getDishes();

  // live counts for the sidebar — computed from the single data source
  const counts: Record<string, number> = { all: all.length };
  for (const c of CATEGORIES) counts[c] = all.filter((d) => d.category === c).length;

  let dishes = active ? all.filter((d) => d.category === active) : all;

  if (sort === 'loved') {
    const favs = getFavoriteCounts();
    const ordered = getOrderCountsByDish();
    dishes = [...dishes].sort(
      (a, b) => (favs[b.id] ?? 0) - (favs[a.id] ?? 0) || (ordered[b.id] ?? 0) - (ordered[a.id] ?? 0),
    );
  } else if (sort === 'offers') {
    dishes = [...dishes].sort((a, b) => priceOf(b).discountPercent - priceOf(a).discountPercent);
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <header>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Our menu</h1>
        <p className="mt-2 text-ink/60 dark:text-cream/60">
          {sort === 'loved'
            ? 'Ranked by what people actually love and order.'
            : sort === 'offers'
              ? 'The best deals from the kitchen, biggest discount first.'
              : active
                ? `Fresh ${active.toLowerCase()} from the kitchen.`
                : 'Fresh from the kitchen.'}
        </p>
      </header>

      {/* left column: categories (sticky on desktop, chips on mobile) */}
      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <aside className="self-start lg:sticky lg:top-24 lg:w-56 lg:shrink-0">
          <CategoryBar active={active} sort={sort} counts={counts} />
        </aside>

        {/* right column: search + dish grid */}
        <div className="min-w-0 flex-1">
          <MenuSearch category={active ?? ''}>
            <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {dishes.map((dish, index) => (
                <li key={dish.id}>
                  <DishCard dish={dish} priority={index < 3} />
                </li>
              ))}
            </ul>
          </MenuSearch>
        </div>
      </div>
    </section>
  );
}