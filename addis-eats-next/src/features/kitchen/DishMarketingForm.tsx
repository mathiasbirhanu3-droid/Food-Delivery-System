'use client';

import { useState } from 'react';
import { upsertDish } from '@/actions/kitchen';
import { formatETB } from '@/lib/format';

const input =
  'mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-cream/20 dark:bg-white/5';

export interface DishFormValues {
  id?: string;
  name: string;
  marketingLine: string;
  description: string;
  ingredients: string;      // comma-separated for the input
  price: number;
  discountPercent: number;
  image: string;
  popular: boolean;
  specialOfDay: boolean;
}

export default function DishMarketingForm({
  categories,
  dish,
}: {
  categories: readonly string[];
  dish?: DishFormValues;
}) {
  const [name, setName] = useState(dish?.name ?? '');
  const [marketingLine, setMarketingLine] = useState(dish?.marketingLine ?? '');
  const [description, setDescription] = useState(dish?.description ?? '');
  const [ingredients, setIngredients] = useState(dish?.ingredients ?? '');
  const [price, setPrice] = useState(dish?.price ?? 0);
  const [discountPercent, setDiscountPercent] = useState(dish?.discountPercent ?? 0);
  const [popular, setPopular] = useState(dish?.popular ?? false);
  const [specialOfDay, setSpecialOfDay] = useState(dish?.specialOfDay ?? false);

  const safePrice = Number.isFinite(price) ? price : 0;
  const safeDiscount = Math.min(90, Math.max(0, Number.isFinite(discountPercent) ? discountPercent : 0));
  const finalPrice = Math.round(safePrice * (1 - safeDiscount / 100));
  const ingredientList = ingredients.split(',').map((s) => s.trim()).filter(Boolean);
  const ingredientCount = ingredientList.length;

  return (
    <form action={upsertDish} className="mt-4 grid gap-3 sm:grid-cols-2">
      {dish?.id && <input type="hidden" name="id" value={dish.id} />}

      <label className="block text-sm font-medium">
        Name
        <input name="name" required value={name} onChange={(e) => setName(e.target.value)} className={input} />
      </label>

      <label className="block text-sm font-medium">
        Category <span className="font-normal text-ink/40">(new dishes only)</span>
        <select name="category" disabled={Boolean(dish?.id)} className={input} defaultValue={categories[0]}>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium sm:col-span-2">
        Marketing line{' '}
        <span className="font-normal text-ink/40">(shows on the card · {marketingLine.length}/80)</span>
        <input
          name="marketingLine" value={marketingLine} maxLength={80}
          onChange={(e) => setMarketingLine(e.target.value)}
          placeholder="Chef Helina's 6-hour simmer — this weekend only!"
          className={input}
        />
      </label>

      {/* ── DESCRIPTION — required by the schema (min 10 chars) ── */}
      <label className="block text-sm font-medium sm:col-span-2">
        Description <span className="font-normal text-ink/40">(required · 10+ characters)</span>
        <textarea
          name="description" required rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Slow-simmered chicken stew in berbere and niter kibbeh, served with injera."
          className={input}
        />
        {description.length > 0 && description.trim().length < 10 && (
          <span className="mt-1 block text-xs font-medium text-accent">
            {10 - description.trim().length} more characters needed.
          </span>
        )}
      </label>

      {/* ── INGREDIENTS — comma-separated → array in the store ── */}
      <label className="block text-sm font-medium sm:col-span-2">
        Ingredients <span className="font-normal text-ink/40">(comma-separated · {ingredientCount}/12)</span>
        <input
          name="ingredients" value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="Chicken, Berbere, Niter kibbeh, Injera, Boiled egg"
          className={input}
        />
        {ingredientCount > 0 && (
          <span className="mt-1 block text-xs text-ink/50 dark:text-cream/50">
            {ingredientList.join(' · ')}
          </span>
        )}
      </label>

      <label className="block text-sm font-medium">
        Price (ETB)
        <input name="price" type="number" min="1" required value={price || ''} onChange={(e) => setPrice(Number(e.target.value))} className={input} />
      </label>

      <label className="block text-sm font-medium">
        Discount %
        <input name="discountPercent" type="number" min="0" max="90" value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} className={input} />
      </label>

      <p className="rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary sm:col-span-2">
        Now {formatETB(finalPrice)} · customer saves {formatETB(safePrice - finalPrice)}
      </p>

      <label className="block text-sm font-medium sm:col-span-2">
        Image URL <span className="font-normal text-ink/40">(Unsplash / Pexels / Pinterest)</span>
        <input name="image" defaultValue={dish?.image ?? ''} placeholder="https://images.unsplash.com/…" className={input} />
      </label>

      {/* ── visibility & promotion toggles ── */}
      <div className="flex flex-wrap gap-4 rounded-2xl border border-ink/10 p-4 sm:col-span-2 dark:border-cream/10">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox" name="popular" checked={popular}
            onChange={(e) => setPopular(e.target.checked)}
            className="h-4 w-4 accent-[#0C7A4D]"
          />
          ⭐ Popular <span className="font-normal text-ink/40">(gold badge on the card)</span>
        </label>

        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox" name="specialOfDay" checked={specialOfDay}
            onChange={(e) => setSpecialOfDay(e.target.checked)}
            className="h-4 w-4 accent-[#E4572E]"
          />
          🔥 Special of the day{' '}
          <span className="font-normal text-ink/40">(one only — replaces the current one, shown on the home page)</span>
        </label>

        {specialOfDay && !dish?.specialOfDay && (
          <p className="w-full rounded-xl bg-accent/10 px-3 py-2 text-xs font-medium text-accent">
            Saving will replace the current Special of the Day.
          </p>
        )}
      </div>

      <button type="submit" className="rounded-full bg-primary px-5 py-2 font-semibold text-white sm:col-span-2">
        {dish?.id ? 'Save dish' : 'Create dish'}
      </button>
    </form>
  );
}