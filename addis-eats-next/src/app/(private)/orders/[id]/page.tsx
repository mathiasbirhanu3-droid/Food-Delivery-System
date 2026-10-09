import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/session-server';
import { getDish, getOrderFor } from '@/lib/db';
import { formatETB } from '@/lib/format-etb';
import OrderStatusLive from '@/features/orders/OrderStatusLive';
import CancelOrderButton from '@/features/orders/CancelOrderButton';
import { requireSession } from '@/features/auth/guards';

export const metadata: Metadata = { title: 'Order detail', robots: { index: false } };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession(`/orders/${id}`);
  //const session = await getSession();
  //if (!session) redirect(`/signin?next=/orders/${id}`);

  // AUTH.md — scoped read: getOrderFor(session.userId, id). Foreign id → 404.
  const order = getOrderFor(session.userId, id);
  if (!order) notFound();

  const lines = order.items.map((item) => ({ ...item, dish: getDish(item.dishId) }));
  const total = order.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0) + order.fee;

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">{order.id}</h1>
      <p className="mt-1 text-sm text-ink/50 dark:text-cream/50">
        Placed {new Date(order.placedAt).toLocaleString()} · {order.zone} · {formatETB(order.fee)} delivery
      </p>

      <div className="mt-6"><OrderStatusLive initialOrder={order} /></div>

      <ul className="mt-8 divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-white dark:divide-cream/10 dark:border-cream/10 dark:bg-white/5">
        {lines.map(({ dish, qty, unitPrice }) => (
          <li key={dish?.id ?? unitPrice} className="flex items-center justify-between p-4">
            <span className="font-medium">{qty} × {dish?.name ?? 'Item'}</span>
            <span>{formatETB(qty * unitPrice)}</span>
          </li>
        ))}
        <li className="flex items-center justify-between p-4 font-bold"><span>Total</span><span>{formatETB(total)}</span></li>
      </ul>

      {order.note && <p className="mt-4 rounded-xl bg-gold/15 p-4 text-sm">Note: {order.note}</p>}

      {order.status === 'pending' && <CancelOrderButton orderId={order.id} />}
    </section>
  );
}