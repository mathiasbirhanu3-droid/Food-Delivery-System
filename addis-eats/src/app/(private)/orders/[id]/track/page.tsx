import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDish, getOrderFor, getRestaurant, getZone } from '@/lib/db';
import { computeCourierPosition, type LatLng } from '@/lib/tracking';
import { formatDateTime, formatETB, formatEtaRange, formatPhone } from '@/lib/format';
import OrderTracking from '@/features/orders/OrderTracking';
import { requireSession } from '@/features/auth/guards';

export const metadata: Metadata = { title: 'Live tracking', robots: { index: false } };

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Layer 2 — signed-out users get a sign-in redirect (better than 404);
  // a foreign order id still gets a 404 (the security working as designed).
  const session = await requireSession(`/orders/${id}/track`);

  // AUTH.md — scoped read: getOrderFor(session.userId, id). A foreign id is
  // indistinguishable from a missing one — 404, never a leak.
  const order = getOrderFor(session.userId, id);
  if (!order) notFound();

  const restaurant = (getRestaurant().location ?? [9.0054, 38.7636]) as LatLng;
  const dropoff = (getZone(order.zone)?.center ?? restaurant) as LatLng;
  const initialCourier = computeCourierPosition(order, restaurant, dropoff);

  const lines = order.items.map((item) => ({ ...item, dish: getDish(item.dishId) }));
  const total = order.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0) + order.fee;

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <Link href={`/orders/${order.id}`} className="text-sm font-semibold text-primary hover:underline">
        ← Back to order
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Tracking {order.id}</h1>
        <span className="text-sm text-ink/50 dark:text-cream/50">
          {order.zone} · {formatEtaRange(order.etaMin, order.etaMax)} · {formatETB(total)}
        </span>
      </div>
      {order.note && <p className="mt-2 rounded-xl bg-gold/15 p-3 text-sm">Note: {order.note}</p>}

      <div className="mt-6">
        <OrderTracking
          orderId={order.id}
          initialStatus={order.status}
          initialCourier={initialCourier}
          initialCourierName={order.courier?.name ?? null}
          courierPhone={order.courier?.phone}
          restaurant={restaurant}
          dropoff={dropoff}
          etaMin={order.etaMin}
          etaMax={order.etaMax}
        />
      </div>

      <h2 className="mt-8 font-display font-semibold">Status timeline</h2>
      <ol className="mt-3 space-y-2 text-sm text-ink/70 dark:text-cream/70">
        {order.events.map((event) => (
          <li key={event.at} className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            <span className="capitalize">{event.status}</span>
            <span className="text-ink/40 dark:text-cream/40">{formatDateTime(event.at)}</span>
          </li>
        ))}
      </ol>

      <h2 className="mt-8 font-display font-semibold">In this order</h2>
      <ul className="mt-3 divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-white dark:divide-cream/10 dark:border-cream/10 dark:bg-white/5">
        {lines.map(({ dish, qty, unitPrice }) => (
          <li key={dish?.id ?? unitPrice} className="flex items-center justify-between p-4 text-sm">
            <span className="font-medium">{qty} × {dish?.name ?? 'Item'}</span>
            <span>{formatETB(qty * unitPrice)}</span>
          </li>
        ))}
        <li className="flex items-center justify-between p-4 text-sm font-bold">
          <span>Total</span><span>{formatETB(total)}</span>
        </li>
      </ul>
      <p className="mt-3 text-xs text-ink/40 dark:text-cream/40">
        Contact: {order.contact?.name ?? '—'} · {formatPhone(order.contact?.phone)}
      </p>
    </section>
  );
}