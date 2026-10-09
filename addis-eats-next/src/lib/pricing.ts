import type { Dish } from '@/lib/types';

/** Integer discount 0–90. Anything else is treated as no discount. */
function normalizeDiscount(discountPercent?: number): number {
  if (!Number.isFinite(discountPercent)) return 0;
  return Math.min(90, Math.max(0, Math.round(discountPercent as number)));
}

export interface Priced {
  original: number;   // list price, ETB
  final: number;      // what the customer pays, ETB
  discountPercent: number;
  savings: number;
}

/** The one place the discount math exists. */
export function priceOf(dish: Pick<Dish, 'price' | 'discountPercent'>): Priced {
  const original = dish.price;
  const discountPercent = normalizeDiscount(dish.discountPercent);
  const final = Math.round(original * (1 - discountPercent / 100));
  return { original, final, discountPercent, savings: original - final };
}