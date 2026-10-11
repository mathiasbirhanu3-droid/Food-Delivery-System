import dbData from '@/data/db.json';
import type { Order, OrderStatus } from '@/lib/types';
import { persistDbDev } from '@/lib/persist-dev';
import { readState, saveState } from '@/lib/persist-store';

/**
 * Order store — seeded once per server process from db.json (the single
 * data source). Everything the app knows about orders lives here:
 *
 * - scoped reads (AUTH.md: no unscoped per-user order query exists)
 * - a data-derived id counter + insert-time collision guard (the
 *   duplicate-ord_900 fix: restarts can never re-issue a persisted id)
 * - persistence: dev → written back into db.json (persistDbDev) so order
 *   history survives dev restarts; production → mirrored into the /tmp
 *   warm-cache (persist-store) for the instance lifetime (documented in
 *   docs/DATA.md — cold starts reset to the committed seed)
 * - the public ordered-counts aggregate (ordered ×N, ?sort=loved)
 */
const orders = (dbData as unknown as { orders: Order[] }).orders.map((o) => structuredClone(o));

// ── production warm-cache rehydration ─────────────────────────────────
// On a cold start, restore orders saved by previous warm instances (best
// effort: /tmp is per-instance and cleared on deploys — documented tradeoff).
const cached = readState() as { orders?: Order[] };
if (cached.orders?.length) {
  const seededIds = new Set(orders.map((o) => o.id));
  for (const cachedOrder of cached.orders) {
    if (!seededIds.has(cachedOrder.id)) orders.unshift(cachedOrder);
  }
}

// ── id counter: derived from the data, with a demo floor ──────────────
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

/** Public aggregate — units ordered per dish, cancelled excluded. A count
 *  leaks nothing personal. Feeds "ordered ×N" on cards and ?sort=loved. */
export const getOrderCountsByDish = (): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const order of orders) {
    if (order.status === 'cancelled') continue;
    for (const item of order.items) counts[item.dishId] = (counts[item.dishId] ?? 0) + item.qty;
  }
  return counts;
};

export function insertOrder(order: Order): void {
  // Defense in depth: an id collision can never enter the store. The caller
  // reads order.id after this call, so any bump stays truthful.
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
  order.events.push({ at: new Date().toISOString(), status });
  persistOrders();
  return order;
}