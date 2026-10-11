import dbData from '@/data/db.json';
import type { Dish } from '@/lib/types';
import { persistDbDev } from '@/lib/persist-dev';

/**
 * Dish store — seeded once per server process from db.json (the single
 * data source). Every mutation (create, edit, delete, hide/show) is written
 * back to db.json in development, so kitchen-created dishes survive server
 * restarts and are readable by anyone opening the file. Production
 * (serverless): /tmp cache via persist-store keeps them within the warm
 * instance lifetime — documented in docs/DATA.md.
 */
const dishes = (dbData as unknown as { dishes: Dish[] }).dishes.map((d) => structuredClone(d));

export const listAllDishes = (): Dish[] => dishes;

export const findDishById = (id: string): Dish | null =>
  dishes.find((d) => d.id === id) ?? null;

export const addDish = (dish: Dish): void => {
  dishes.unshift(dish);
  persistDbDev({ dishes });
};

export function patchDish(id: string, patch: Partial<Dish>): void {
  const dish = findDishById(id);
  if (!dish) return;
  Object.assign(dish, patch);
  persistDbDev({ dishes });
}

export function removeDish(id: string): void {
  const index = dishes.findIndex((d) => d.id === id);
  if (index >= 0) {
    dishes.splice(index, 1);
    persistDbDev({ dishes });
  }
}

export const nextDishId = (name: string): string =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') ||
  `dish-${Date.now()}`;