import type { Metadata } from 'next';
import Link from 'next/link';
import { getOrdersFor, getDish } from '@/lib/db';
import { formatETB } from '@/lib/format-etb';
import StatusPill from '@/components/StatusPill';
import ReorderButton from '@/features/orders/ReorderButton';
import { requireSession } from '@/features/auth/guards';

export const metadata: Metadata = {
  title: 'My orders',
  description: 'Your Addis Eats order history and live status.',
  robots: { index: false },
};

export default async function OrdersPage() {
  // Layer 2 — middleware proved a cookie exists; here the session is verified.
  const session = await requireSession('/orders');

  // AUTH.md — scoped query: getOrdersFor(session.userId). No id is ever
  // accepted from the URL, body, or props.
  const orders = getOrdersFor(session.userId);

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">My orders</h1>
      <p className="mt-1 text-ink/60 dark:text-cream/60">
        Signed in as {session.name} — you only ever see your own orders.
      </p>

      {orders.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-ink/20 p-10 text-center dark:border-cream/20">
          <p className="text-ink/60 dark:text-cream/60">
            No orders yet — the menu is calling.
          </p>
          <Link
            href="/menu"
            className="mt-4 inline-block rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-600"
          >
            Browse the menu
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {orders.map((order) => {
            const total = order.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0) + order.fee;
            const items = order.items.map((item) => {
              const dish = getDish(item.dishId);
              return {
                id: item.dishId,
                name: dish?.name ?? 'Item',
                price: dish?.price ?? item.unitPrice,
                image: dish?.image ?? '',
                qty: item.qty,
              };
            });
            return (
              <li key={order.id}>
                <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-card dark:border-cream/10 dark:bg-white/5">
                  <div className="flex items-center justify-between gap-4">
                    <Link href={`/orders/${order.id}`} className="min-w-0">
                      <p className="font-semibold">{order.id}</p>
                      <p className="text-sm text-ink/50 dark:text-cream/50">
                        {new Date(order.placedAt).toLocaleString()} · {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </p>
                    </Link>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusPill status={order.status} />
                      <span className="font-semibold">{formatETB(total)}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-ink/5 pt-3 dark:border-cream/5">
                    <span className="text-xs text-ink/50 dark:text-cream/50">
                      {order.zone} · {formatETB(order.fee)} delivery
                    </span>
                    <ReorderButton items={items} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}