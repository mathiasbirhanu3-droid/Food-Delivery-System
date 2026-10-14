import type { Order } from '@/lib/types';

export type LatLng = [number, number];

/** Demo pacing: courier completes the route in ~2 minutes of wall time.
 *  The customer-facing promise remains the zone's real ETA (DATA.md). */
export const TRACKING_TRAVEL_MINUTES = 2;

const DEMO_COURIER = { name: 'Courier Abebe', phone: '+251 91 700 0001' };

export const courierFor = (order: Order): { name: string; phone: string } =>
  order.courier ?? DEMO_COURIER;

/** Server-authoritative courier position — derived, never stored. */
export function computeCourierPosition(
  order: Pick<Order, 'status' | 'deliveringAt'>,
  restaurant: LatLng,
  dropoff: LatLng,
): LatLng {
  if (order.status === 'delivered') return dropoff;
  if (order.status !== 'delivering' || !order.deliveringAt) return restaurant;

  const elapsed = Date.now() - new Date(order.deliveringAt).getTime();
  const travel = TRACKING_TRAVEL_MINUTES * 60 * 1000;
  const progress = Math.min(1, Math.max(0, elapsed / travel));

  return [
    restaurant[0] + (dropoff[0] - restaurant[0]) * progress,
    restaurant[1] + (dropoff[1] - restaurant[1]) * progress,
  ];
}