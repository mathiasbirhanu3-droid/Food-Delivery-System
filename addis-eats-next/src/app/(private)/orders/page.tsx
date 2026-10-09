import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session-server';
import { getOrdersFor } from '@/lib/db';
import { formatETB } from '@/lib/format-etb';
import StatusPill from '@/components/StatusPill';
import { requireSession } from '@/features/auth/guards';

export const metadata: Metadata = {
  title: 'My orders',
  description: 'Your Addis Eats order history and live status.',
  robots: { index: false },
};

export default async function OrdersPage() {
  // Layer 2 — middleware proved a cookie exists; here the session itself is verified.
  const session = await requireSession('/orders');
  //const session = await getSession();
  if (!session) redirect('/signin?next=/orders');

  // AUTH.md — the query is scoped to the session: getOrdersFor(session.userId).
  // No id is ever accepted from the URL, body, or props.
  const orders = getOrdersFor(session.userId);

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">My orders</h1>
      <p className="mt-1 text-ink/60 dark:text-cream/60">
        Signed in as {session.name} — you only ever see your own orders.
      </p>

      {orders.length === 0 ? (
        <p className="mt-12 rounded-2xl border border-dashed border-ink/20 p-10 text-center text-ink/60 dark:border-cream/20 dark:text-cream/60">
          No orders yet — the menu is calling.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {orders.map((order) => {
            const total = order.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0) + order.fee;
            return (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-white p-4 shadow-card transition hover:border-primary/50 dark:border-cream/10 dark:bg-white/5"
                >
                  <div>
                    <p className="font-semibold">{order.id}</p>
                    <p className="text-sm text-ink/50 dark:text-cream/50">
                      {new Date(order.placedAt).toLocaleString()} · {order.items.length} item{order.items.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill status={order.status} />
                    <span className="font-semibold">{formatETB(total)}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}