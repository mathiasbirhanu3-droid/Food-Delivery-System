import dbData from '@/data/db.json';
import type { Dish } from '@/lib/types';
import { persistDbDev } from '@/lib/persist-dev';
import { readState, saveState } from '@/lib/persist-store';

/**
 * Dish store — seeded from db.json; every mutation persists (dev → db.json
 * write-back, prod → /tmp warm-cache). The specialOfDay invariant lives
 * HERE: at most ONE dish is the Special of the Day — setting it clears all
 * others. Home page reads getSpecialOfDay().
 */

/** Persist both ways: dev → db.json, prod → /tmp cache. Declared FIRST so
 *  every export below can reference it without use-before-declaration. */
function persistDishes(): void {
  persistDbDev({ dishes });
  saveState({ dishes });
}

// ── seed + rehydrate ─────────────────────────────────────────────────
const dishes = (dbData as unknown as { dishes: Dish[] }).dishes.map((d) => structuredClone(d));

const cached = readState() as { dishes?: Dish[] };
if (cached.dishes?.length) {
  const seededIds = new Set(dishes.map((d) => d.id));
  for (const cachedDish of cached.dishes) {
    if (!seededIds.has(cachedDish.id)) dishes.unshift(cachedDish);
  }
}

// ── reads ────────────────────────────────────────────────────────────
export const listAllDishes = (): Dish[] => dishes;

export const findDishById = (id: string): Dish | null =>
  dishes.find((d) => d.id === id) ?? null;

/** The one dish marked specialOfDay (or null) — the home page hero reads this. */
export const getSpecialOfDay = (): Dish | null =>
  dishes.find((d) => d.specialOfDay && d.available) ?? null;

// ── writes (each persists via the helper declared above) ─────────────
export const addDish = (dish: Dish): void => {
  dishes.unshift(dish);
  persistDishes();
};

export function patchDish(id: string, patch: Partial<Dish>): void {
  const dish = findDishById(id);
  if (!dish) return;

  // ── the Special-of-the-Day invariant ────────────────────────────────
  if (patch.specialOfDay === true) {
    for (const other of dishes) {
      if (other.id !== id) other.specialOfDay = false;
    }
  }

  Object.assign(dish, patch);
  persistDishes();
}

export function removeDish(id: string): void {
  const index = dishes.findIndex((d) => d.id === id);
  if (index >= 0) {
    dishes.splice(index, 1);
    persistDishes();
  }
}

export const nextDishId = (name: string): string =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
  `dish-${Date.now()}`;