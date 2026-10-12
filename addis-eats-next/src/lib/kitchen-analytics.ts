import { getAllOrders } from '@/lib/orders-store';
import { getDish } from '@/lib/db';
import type { OrderStatus } from '@/lib/types';

export const RANGE_OPTIONS = [
  { key: 'all', label: 'All time' },
  { key: '30', label: 'Last 30 days' },
  { key: '7', label: 'Last 7 days' },
] as const;

export type RangeKey = (typeof RANGE_OPTIONS)[number]['key'];

export function parseRange(value: string | undefined): RangeKey {
  return value === '7' || value === '30' ? value : 'all';
}

const MS_DAY = 86_400_000;
const dayKey = (iso: string) => iso.slice(0, 10);

/** UTC day labels — deterministic between server render and client hydration. */
function dayLabel(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export interface DayPoint { day: string; label: string; revenue: number; orders: number }
export interface StatusPoint { status: OrderStatus; count: number }
export interface DishPoint { id: string; name: string; units: number }

export interface KitchenAnalytics {
  range: RangeKey;
  windowLabel: string;
  hasAnyOrders: boolean;
  inRangeCount: number;
  allCancelledInRange: boolean;
  revenueSeries: DayPoint[];
  statusSeries: StatusPoint[];
  topDishes: DishPoint[];
  totals: { revenue: number; orders: number; avg: number; cancelled: number };
}

const STATUSES: OrderStatus[] = ['pending', 'preparing', 'delivering', 'delivered', 'cancelled'];

export function getKitchenAnalytics(range: RangeKey): KitchenAnalytics {
  const orders = getAllOrders();
  const hasAnyOrders = orders.length > 0;

  const today = dayKey(new Date().toISOString());
  let from: string | null = null;
  if (range === '7') from = dayKey(new Date(Date.now() - 6 * MS_DAY).toISOString());
  if (range === '30') from = dayKey(new Date(Date.now() - 29 * MS_DAY).toISOString());
  const fromDay = from;

  const inRange = fromDay ? orders.filter((o) => dayKey(o.placedAt) >= fromDay) : orders;
  const inRangeCount = inRange.length;

  // Window span: recent ranges run from..today. "All time" spans the data's
  // own first..last order day — padding empty months up to "now" would imply
  // "nothing sold since" (chart lie #3 in docs/CHARTS.md), so we don't.
  let start = today;
  let end = today;
  if (fromDay) {
    start = fromDay;
    end = today;
  } else if (inRange.length > 0) {
    const days = inRange.map((o) => dayKey(o.placedAt)).sort();
    start = days[0];
    end = days[days.length - 1];
  }

  // Every day in the span gets a bucket — zeros stay visible (lie #3 guard).
  const byDay = new Map<string, DayPoint>();
  const startMs = Date.parse(`${start}T00:00:00Z`);
  const endMs = Date.parse(`${end}T00:00:00Z`);
  for (let t = startMs; t <= endMs; t += MS_DAY) {
    const day = new Date(t).toISOString().slice(0, 10);
    byDay.set(day, { day, label: dayLabel(day), revenue: 0, orders: 0 });
  }

  for (const order of inRange) {
    const point = byDay.get(dayKey(order.placedAt));
    if (!point) continue;
    if (order.status !== 'cancelled') {
      point.revenue += order.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0) + order.fee;
      point.orders += 1;
    }
  }

  const statusSeries = STATUSES.map((status) => ({
    status,
    count: inRange.filter((o) => o.status === status).length,
  }));

  const units = new Map<string, number>();
  for (const order of inRange) {
    if (order.status === 'cancelled') continue;
    for (const item of order.items) units.set(item.dishId, (units.get(item.dishId) ?? 0) + item.qty);
  }
  const topDishes: DishPoint[] = [...units.entries()]
    .map(([id, unitsSold]) => ({ id, name: getDish(id)?.name ?? id, units: unitsSold }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);

  const nonCancelled = inRange.filter((o) => o.status !== 'cancelled');
  const revenue = nonCancelled.reduce(
    (sum, o) => sum + o.items.reduce((t, i) => t + i.qty * i.unitPrice, 0) + o.fee,
    0,
  );

  return {
    range,
    windowLabel: `${dayLabel(start)} – ${dayLabel(end)}`,
    hasAnyOrders,
    inRangeCount,
    allCancelledInRange: inRangeCount > 0 && nonCancelled.length === 0,
    revenueSeries: [...byDay.values()],
    statusSeries,
    topDishes,
    totals: {
      revenue,
      orders: nonCancelled.length,
      avg: nonCancelled.length ? revenue / nonCancelled.length : 0,
      cancelled: inRange.filter((o) => o.status === 'cancelled').length,
    },
  };
}