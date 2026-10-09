'use client';

import { useState } from 'react';
import { upsertDish } from '@/actions/kitchen';
import { formatETB } from '@/lib/format-etb';

const input =
  'mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-cream/20 dark:bg-white/5';

export interface DishFormValues {
  id?: string;
  name: string;
  marketingLine: string;
  description: string;
  price: number;
  discountPercent: number;
  image: string;
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
  const [price, setPrice] = useState(dish?.price ?? 0);
  const [discountPercent, setDiscountPercent] = useState(dish?.discountPercent ?? 0);

  const safePrice = Number.isFinite(price) ? price : 0;
  const safeDiscount = Math.min(90, Math.max(0, Number.isFinite(discountPercent) ? discountPercent : 0));
  const finalPrice = Math.round(safePrice * (1 - safeDiscount / 100));

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
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium sm:col-span-2">
        Marketing line{' '}
        <span className="font-normal text-ink/40">(shows on the card · {marketingLine.length}/80)</span>
        <input
          name="marketingLine"
          value={marketingLine}
          maxLength={80}
          onChange={(e) => setMarketingLine(e.target.value)}
          placeholder="Chef Helina's 6-hour simmer — this weekend only!"
          className={input}
        />
      </label>

      <label className="block text-sm font-medium sm:col-span-2">
        Description
        <textarea
          name="description"
          required
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={input}
        />
      </label>

      <label className="block text-sm font-medium">
        Price (ETB)
        <input
          name="price"
          type="number"
          min="1"
          required
          value={price || ''}
          onChange={(e) => setPrice(Number(e.target.value))}
          className={input}
        />
      </label>

      <label className="block text-sm font-medium">
        Discount %
        <input
          name="discountPercent"
          type="number"
          min="0"
          max="90"
          value={discountPercent}
          onChange={(e) => setDiscountPercent(Number(e.target.value))}
          className={input}
        />
      </label>

      <p className="rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary sm:col-span-2">
        Now {formatETB(finalPrice)} · customer saves {formatETB(safePrice - finalPrice)}
      </p>

      <label className="block text-sm font-medium sm:col-span-2">
        Image URL <span className="font-normal text-ink/40">(Unsplash / Pexels / Pinterest)</span>
        <input
          name="image"
          defaultValue={dish?.image ?? ''}
          placeholder="https://images.unsplash.com/…"
          className={input}
        />
      </label>

      <button type="submit" className="rounded-full bg-primary px-5 py-2 font-semibold text-white sm:col-span-2">
        {dish?.id ? 'Save dish' : 'Create dish'}
      </button>
    </form>
  );
}