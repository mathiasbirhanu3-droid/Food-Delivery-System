import type { Metadata } from 'next';
import { listAllDishes } from '@/lib/dishes-store';
import { deleteDish, toggleDishAvailability, upsertDish } from '@/actions/kitchen';
import ConfirmSubmit from '@/features/kitchen/ConfirmSubmit';
import DishMarketingForm from '@/features/kitchen/DishMarketingForm';
import { formatETB } from '@/lib/format-etb';
import { priceOf } from '@/lib/pricing';
import { CATEGORIES } from '@/features/menu/categories';
import { requireKitchen } from '@/features/auth/guards';

export const metadata: Metadata = { title: 'Kitchen · Menu manager', robots: { index: false } };

export default async function KitchenMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ invalid?: string }>;
}) {
  await requireKitchen('/kitchen/menu');
  const { invalid } = await searchParams;
  const dishes = listAllDishes();

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Menu manager</h1>
      <p className="mt-1 text-sm text-ink/60 dark:text-cream/60">
        Name, marketing line, price and discount — all editable here. Changes go live on the menu instantly.
      </p>

      {invalid && (
        <p role="alert" className="mt-4 rounded-xl bg-accent/10 p-3 text-sm font-medium text-accent">
          A dish form had invalid values — name needs 2+ characters, description 10+, price above 0, discount between 0 and 90.
        </p>
      )}

      <details className="mt-6 rounded-2xl border border-ink/10 p-4 dark:border-cream/10">
        <summary className="cursor-pointer font-semibold">＋ Add a new dish</summary>
        <DishMarketingForm categories={CATEGORIES} />
      </details>

      <ul className="mt-8 space-y-3">
        {dishes.map((dish) => {
          const { original, final, discountPercent } = priceOf(dish);
          return (
            <li
              key={dish.id}
              className="rounded-2xl border border-ink/10 bg-white p-4 dark:border-cream/10 dark:bg-white/5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {dish.name}{' '}
                    {discountPercent > 0 && (
                      <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </p>
                  <p className="text-sm">
                    {discountPercent > 0 && (
                      <span className="mr-1 text-ink/40 line-through dark:text-cream/40">
                        {formatETB(original)}
                      </span>
                    )}
                    <span className="font-bold text-primary">{formatETB(final)}</span>
                  </p>
                  {dish.marketingLine && (
                    <p className="mt-0.5 text-xs text-ink/50 dark:text-cream/50">✦ {dish.marketingLine}</p>
                  )}
                  <p className="text-xs text-ink/50 dark:text-cream/50">
                    {dish.category} · {dish.available ? 'available' : 'hidden'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <form action={toggleDishAvailability}>
                    <input type="hidden" name="id" value={dish.id} />
                    <button className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold dark:border-cream/20">
                      {dish.available ? 'Hide' : 'Show'}
                    </button>
                  </form>
                  <form action={deleteDish}>
                    <input type="hidden" name="id" value={dish.id} />
                    <ConfirmSubmit label="Delete" message={`Delete “${dish.name}”? This cannot be undone.`} />
                  </form>
                </div>
              </div>

              <details className="mt-2">
                <summary className="cursor-pointer text-xs font-semibold text-primary">
                  Edit marketing &amp; price
                </summary>
                <DishMarketingForm
                  categories={CATEGORIES}
                  dish={{
                    id: dish.id,
                    name: dish.name,
                    marketingLine: dish.marketingLine ?? '',
                    description: dish.description,
                    price: dish.price,
                    discountPercent: dish.discountPercent ?? 0,
                    image: dish.image,
                  }}
                />
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}