import dbData from '@/data/db.json';
import type { Dish, Restaurant, Zone } from '@/lib/types';
import { findDishById, listAllDishes } from '@/lib/dishes-store';
import { getUserByEmail as storeGetUserByEmail, getUserById as storeGetUserById } from '@/lib/users-store';

const db = dbData as unknown as {
  restaurant: Restaurant;
  zones: Zone[];
  dishes: Dish[];
};

// ── restaurant & zones (static config) ──────────────────────────────
export const getRestaurant = (): Restaurant => db.restaurant;
export const getZones = (): Zone[] => db.zones;
export const getZone = (name: string): Zone | null =>
  db.zones.find((z) => z.name === name) ?? null;

// ── dishes (delegated to the mutable store) ──────────────────────────
export const getDishes = (): Dish[] => listAllDishes().filter((d) => d.available);
export const getDish = (id: string): Dish | null => findDishById(id);
export { findDishById };

// ── users (delegated to the mutable store) ───────────────────────────
export const getUserByEmail = storeGetUserByEmail;
export const getUserById = storeGetUserById;

// ── orders + favorites + announcements — scoped stores ───────────────
export { getOrdersFor, getOrderFor, getAllOrders, getOrderCountsByDish } from '@/lib/orders-store';
export { getFavoritesFor, isFavorite, getFavoriteCounts } from '@/lib/favorites-store';
export { getActiveAnnouncements, listAllAnnouncements } from '@/lib/announcements-store';