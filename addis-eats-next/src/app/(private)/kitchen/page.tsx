import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllOrders, getUserById } from '@/lib/db';
import { formatETB } from '@/lib/format-etb';
import {
  getKitchenAnalytics,
  parseRange,
  RANGE_OPTIONS,
  type RangeKey,
} from '@/lib/kitchen-analytics';
import { requireKitchen } from '@/features/auth/guards';
import RevenueChart from '@/features/kitchen/RevenueChart';
import StatusChart from '@/features/kitchen/StatusChart';
import TopDishesChart from '@/features/kitchen/TopDishesChart';
import ChartEmpty from '@/features/kitchen/ChartEmpty';
import StatusPill from '@/components/StatusPill';
import StatusActions from '@/features/kitchen/StatusActions';
import type { OrderStatus } from '@/lib/types';
import KitchenNav from '@/components/KitchenNav';

export const metadata: Metadata = { title: 'Kitchen', robots: { index: false } };

const STATUSES: OrderStatus[] = ['pending', 'preparing', 'delivering', 'delivered', 'cancelled'];
const PAGE_SIZE = 8;

const cardClass =
  'rounded-2xl border border-ink/10 bg-white p-5 shadow-card dark:border-cream/10 dark:bg-white/5';
const chip = (active: boolean) =>
  `whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold transition ${
    active
      ? 'border-primary bg-primary text-white'
      : 'border-ink/15 hover:border-primary hover:text-primary dark:border-cream/20'
  }`;

export default async function KitchenPage({
  searchParams,
}: {
  searchParams: Promise<{ refused?: string; range?: string; status?: string; page?: string }>;
}) {
  await requireKitchen('/kitchen');
  const sp = await searchParams;

  const range: RangeKey = parseRange(sp.range);
  const analytics = getKitchenAnalytics(range);

  // Table: status filter + page both live in the URL — shareable, back/forward safe.
  const statusFilter = STATUSES.find((s) => s === sp.status) ?? null;
  const all = getAllOrders();
  const filtered = statusFilter ? all.filter((o) => o.status === statusFilter) : all;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(sp.page) || 1), totalPages); // out-of-bounds clamps, never crashes
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function buildQuery(patch: Record<string, string | undefined>): string {
    const merged = {
      range: range === 'all' ? undefined : range,
      status: statusFilter ?? undefined,
      page: page > 1 ? String(page) : undefined,
      ...patch,
    };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) if (value) params.set(key, value);
    const qs = params.toString();
    return qs ? `/kitchen?${qs}` : '/kitchen';
  }

  const stats: [string, string, string][] = [
    ['Revenue', formatETB(analytics.totals.revenue), `excl. cancelled · ${analytics.windowLabel}`],
    ['Orders', String(analytics.totals.orders), 'placed, excl. cancelled'],
    ['Avg order value', formatETB(Math.round(analytics.totals.avg)), 'revenue ÷ orders — with n shown above'],
    ['Cancelled', String(analytics.totals.cancelled), 'shown separately, never hidden in revenue'],
  ];

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Kitchen console</h1>
        <KitchenNav current="/kitchen" />
        <Link href="/kitchen/menu" className="text-sm font-semibold text-primary hover:underline">
          Menu manager →
        </Link>
      </div>
      {sp.refused && (
        <p role="alert" className="mt-4 rounded-xl bg-accent/10 p-3 text-sm font-medium text-accent">
          A kitchen action refused your request — kitchen actions re-check the role themselves.
        </p>
      )}

      {/* ── Stat cards (context on every number — an average without n is a lie) ── */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value, note]) => (
          <div key={label} className={cardClass}>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-cream/50">{label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-primary">{value}</p>
            <p className="mt-1 text-[11px] text-ink/50 dark:text-cream/50">{note}</p>
          </div>
        ))}
      </div>

      {/* ── Range tabs (window is labeled and switchable — no cherry-picking) ── */}
      <div className="mt-6 flex gap-2">
        {RANGE_OPTIONS.map((option) => (
          <Link
            key={option.key}
            href={buildQuery({ range: option.key === 'all' ? undefined : option.key, status: undefined, page: undefined })}
            className={chip(range === option.key)}
            aria-current={range === option.key ? 'true' : undefined}
          >
            {option.label}
          </Link>
        ))}
      </div>

      {/* ── Charts: failure states designed alongside the happy path ── */}
      {!analytics.hasAnyOrders ? (
        <div className={`mt-6 ${cardClass}`}>
          <ChartEmpty
            title="No orders yet"
            message="Charts appear after the first order — place one from a customer account to see the dashboard come alive."
          >
            <Link href="/menu" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
              Open the menu →
            </Link>
          </ChartEmpty>
        </div>
      ) : analytics.inRangeCount === 0 ? (
        <div className={`mt-6 ${cardClass}`}>
          <ChartEmpty
            title={`No orders ${range === '7' ? 'in the last 7 days' : 'in the last 30 days'}`}
            message="The window is honest — recent days really had no orders. All-time data still exists."
          >
            <Link href={buildQuery({ range: undefined, status: undefined, page: undefined })} className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
              Switch to All time →
            </Link>
          </ChartEmpty>
        </div>
      ) : (
        <>
          <div className={`mt-6 ${cardClass}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display font-semibold">Revenue · {analytics.windowLabel}</h2>
              <span className="text-xs text-ink/50 dark:text-cream/50">Cancelled orders excluded — stated, not hidden</span>
            </div>
            {analytics.allCancelledInRange ? (
              <div className="mt-4">
                <ChartEmpty
                  title="No revenue to chart"
                  message={`All ${analytics.inRangeCount} orders in this window were cancelled. The status chart below still tells the true story.`}
                />
              </div>
            ) : (
              <div className="mt-4">
                <RevenueChart data={analytics.revenueSeries} />
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className={cardClass}>
              <h2 className="font-display font-semibold">Status distribution</h2>
              <p className="text-xs text-ink/50 dark:text-cream/50">Includes cancelled — zeros are shown, not skipped</p>
              <div className="mt-4">
                <StatusChart data={analytics.statusSeries} />
              </div>
            </div>
            <div className={cardClass}>
              <h2 className="font-display font-semibold">Top dishes</h2>
              <p className="text-xs text-ink/50 dark:text-cream/50">Units ordered, cancelled excluded</p>
              <div className="mt-4">
                {analytics.topDishes.length > 0 ? (
                  <TopDishesChart data={analytics.topDishes} />
                ) : (
                  <ChartEmpty title="No dish units" message="Every order in this window was cancelled." />
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Orders table: filter + pagination ── */}
      <div className={`mt-8 ${cardClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display font-semibold">
            Orders <span className="text-sm font-normal text-ink/50 dark:text-cream/50">({filtered.length})</span>
          </h2>
          <div className="flex flex-wrap gap-1.5">
            <Link href={buildQuery({ status: undefined, page: undefined })} className={chip(!statusFilter)}>
              All
            </Link>
            {STATUSES.map((status) => (
              <Link
                key={status}
                href={buildQuery({ status, page: undefined })}
                className={chip(statusFilter === status)}
                aria-current={statusFilter === status ? 'true' : undefined}
              >
                <span className="capitalize">{status}</span>
              </Link>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="mt-4">
            <ChartEmpty
              title={`No ${statusFilter} orders`}
              message="The filter is doing its job — nothing matches it right now."
            >
              <Link href={buildQuery({ status: undefined, page: undefined })} className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
                Clear the filter →
              </Link>
            </ChartEmpty>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/50 dark:border-cream/10 dark:text-cream/50">
                <tr>
                  <th className="p-3">Order</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Zone</th>
                  <th className="p-3">Placed</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((order) => {
                  const total = order.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0) + order.fee;
                  return (
                    <tr key={order.id} className="border-b border-ink/5 last:border-0 dark:border-cream/5">
                      <td className="p-3 font-medium">{order.id}</td>
                      <td className="p-3">{getUserById(order.userId)?.name ?? '—'}</td>
                      <td className="p-3">{order.zone}</td>
                      <td className="p-3">{new Date(order.placedAt).toLocaleDateString()}</td>
                      <td className="p-3">{formatETB(total)}</td>
                      <td className="p-3"><StatusPill status={order.status} /></td>
                      <td className="p-3"><StatusActions orderId={order.id} status={order.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer — out-of-range pages clamp, they never error */}
        <div className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={buildQuery({ page: String(page - 1) })} className="rounded-full border border-ink/15 px-4 py-1.5 font-semibold hover:border-primary dark:border-cream/20">
              ← Prev
            </Link>
          ) : (
            <span className="rounded-full border border-ink/10 px-4 py-1.5 font-semibold opacity-40 dark:border-cream/10">← Prev</span>
          )}
          <span className="text-ink/50 dark:text-cream/50">
            Page {page} of {totalPages} · {filtered.length} order{filtered.length === 1 ? '' : 's'}
          </span>
          {page < totalPages ? (
            <Link href={buildQuery({ page: String(page + 1) })} className="rounded-full border border-ink/15 px-4 py-1.5 font-semibold hover:border-primary dark:border-cream/20">
              Next →
            </Link>
          ) : (
            <span className="rounded-full border border-ink/10 px-4 py-1.5 font-semibold opacity-40 dark:border-cream/10">Next →</span>
          )}
        </div>
      </div>
    </section>
  );
}