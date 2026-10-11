import dbData from '@/data/db.json';
import type { Order, OrderStatus } from '@/lib/types';
import { persistDbDev } from '@/lib/persist-dev';
import { readState, saveState } from '@/lib/persist-store';
import { courierFor } from '@/lib/tracking';

/**
 * Order store — seeded once per server process from db.json (the single
 * data source). Scoped reads (AUTH.md), data-derived id counter with an
 * insert-time collision guard, dev write-back into db.json, production
 * /tmp warm-cache rehydration, the ordered-counts aggregate, and dispatch
 * metadata (deliveringAt + courier) that drives the live tracking map.
 */
const orders = (dbData as unknown as { orders: Order[] }).orders.map((o) => structuredClone(o));

// production warm-cache rehydration (documented serverless tradeoff)
const cached = readState() as { orders?: Order[] };
if (cached.orders?.length) {
  const seededIds = new Set(orders.map((o) => o.id));
  for (const cachedOrder of cached.orders) {
    if (!seededIds.has(cachedOrder.id)) orders.unshift(cachedOrder);
  }
}

const ORDER_ID_FLOOR = 900;
const seededMax = orders.reduce((max, order) => {
  const match = /^ord_(\d+)$/.exec(order.id);
  return match ? Math.max(max, Number(match[1])) : max;
}, ORDER_ID_FLOOR - 1);

let nextSeq = Math.max(seededMax + 1, ORDER_ID_FLOOR);

export const nextOrderId = () => `ord_${nextSeq++}`;

/** Persist both ways: dev → db.json, prod → /tmp cache. */
function persistOrders(): void {
  persistDbDev({ orders });
  saveState({ orders });
}

/** AUTH.md — scoped read: no unscoped per-user order query exists. */
export const getOrdersFor = (userId: string) =>
  orders.filter((o) => o.userId === userId).sort((a, b) => b.placedAt.localeCompare(a.placedAt));

/** AUTH.md — the scoped read that stops attack 2: a foreign id returns null. */
export const getOrderFor = (userId: string, orderId: string) =>
  orders.find((o) => o.id === orderId && o.userId === userId) ?? null;

/** Kitchen only — callers must verify role BEFORE and INSIDE their actions. */
export const getAllOrders = () => orders;

/** Public aggregate — units ordered per dish, cancelled excluded. */
export const getOrderCountsByDish = (): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const order of orders) {
    if (order.status === 'cancelled') continue;
    for (const item of order.items) counts[item.dishId] = (counts[item.dishId] ?? 0) + item.qty;
  }
  return counts;
};

export function insertOrder(order: Order): void {
  while (orders.some((o) => o.id === order.id)) {
    order.id = `ord_${nextSeq++}`;
  }
  orders.unshift(order);
  persistOrders();
}

export function setOrderStatus(orderId: string, status: OrderStatus): Order | null {
  const order = orders.find((o) => o.id === orderId);
  if (!order) return null;
  order.status = status;
  // Dispatch metadata — drives the live tracking map (position is derived,
  // never stored; only the dispatch timestamp and courier identity are).
  if (status === 'delivering') {
    if (!order.deliveringAt) order.deliveringAt = new Date().toISOString();
    order.courier = courierFor(order);
  }
  order.events.push({ at: new Date().toISOString(), status });
  persistOrders();
  return order;
}