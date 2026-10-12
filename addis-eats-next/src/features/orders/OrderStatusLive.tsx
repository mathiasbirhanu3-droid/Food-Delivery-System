'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import StatusPill from '@/components/StatusPill';
import type { Order } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json()) as Promise<{ order: Order }>;

/**
 * Day 45 · Live data — the ONE polled query.
 * - Seeded: the server-rendered order arrives as fallbackData, so the status
 *   is correct on FIRST PAINT — no spinner, ever (the seeding rule).
 * - Polled: SWR revalidates /api/orders/[id] every 5 s — one request per
 *   interval, visible in the network tab. The endpoint re-checks session +
 *   ownership itself; this component grants nothing by existing.
 */
export default function OrderStatusLive({ initialOrder }: { initialOrder: Order }) {
  const router = useRouter();
  const lastStatus = useRef(initialOrder.status);

  const { data } = useSWR<{ order: Order }>(`/api/orders/${initialOrder.id}`, fetcher, {
    fallbackData: { order: initialOrder }, // ← seeded by the server render
    refreshInterval: 5000,                 // ← the poll
    keepPreviousData: true,
  });

  const order = data?.order ?? initialOrder;

  // When the kitchen moves the order, let server-rendered parts catch up
  // (e.g. the cancel button only makes sense while pending).
  useEffect(() => {
    if (order.status !== lastStatus.current) {
      lastStatus.current = order.status;
      router.refresh();
    }
  }, [order.status, router]);

  return (
    <section aria-label="Live order status" aria-live="polite">
      <div className="flex items-center gap-3">
        <StatusPill status={order.status} />
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/50 dark:text-cream/50">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Live · updates every 5s
        </span>
      </div>

      <h2 className="mt-8 font-display font-semibold">Status timeline</h2>
      <ol className="mt-3 space-y-2 text-sm text-ink/70 dark:text-cream/70">
        {order.events.map((event) => (
          <li key={event.at} className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            <span className="capitalize">{event.status}</span>
            <span className="text-ink/40 dark:text-cream/40">{new Date(event.at).toLocaleTimeString()}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}