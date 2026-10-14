'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatusPill from '@/components/StatusPill';
import TrackingMap from '@/features/orders/TrackingMap';
import { formatEtaRange, formatPhone, formatTime } from '@/lib/format';
import type { LatLng } from '@/lib/tracking';

interface TrackingSnapshot {
  status: string;
  courier: LatLng;
  courierName: string | null;
  etaMin: number;
  etaMax: number;
  updatedAt: string;
}

export default function OrderTracking({
  orderId, initialStatus, initialCourier, initialCourierName,
  restaurant, dropoff, etaMin, etaMax, courierPhone,
}: {
  orderId: string;
  initialStatus: string;
  initialCourier: LatLng;
  initialCourierName: string | null;
  restaurant: LatLng;
  dropoff: LatLng;
  etaMin: number;
  etaMax: number;
  courierPhone?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [courier, setCourier] = useState<LatLng>(initialCourier);
  const [courierName, setCourierName] = useState<string | null>(initialCourierName);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const lastStatus = useRef(initialStatus);

  useEffect(() => {
    const es = new EventSource(`/api/orders/${orderId}/stream`);

    es.addEventListener('order', (event) => {
      const snap = JSON.parse((event as MessageEvent).data) as TrackingSnapshot;
      setConnected(true);
      setStatus(snap.status);
      setCourier(snap.courier);
      setUpdatedAt(snap.updatedAt);
      if (snap.courierName) setCourierName(snap.courierName);
      if (snap.status !== lastStatus.current) {
        lastStatus.current = snap.status;
        router.refresh(); // server-rendered sections catch up on status change
      }
    });

    es.onerror = () => setConnected(false); // EventSource retries automatically

    return () => es.close();
  }, [orderId, router]);

  return (
    <section aria-label="Live delivery tracking" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <StatusPill status={status} />
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/50 dark:text-cream/50">
            <span
              className={`h-2 w-2 rounded-full ${connected ? 'animate-pulse bg-primary' : 'bg-ink/30 dark:bg-cream/30'}`}
              aria-hidden="true"
            />
            {connected ? 'Live · server-sent events' : 'Reconnecting…'}
          </span>
        </div>
        {updatedAt && (
          <span className="text-xs text-ink/40 dark:text-cream/40">updated {formatTime(updatedAt)}</span>
        )}
      </div>

      <div className="mt-4">
        <TrackingMap restaurant={restaurant} dropoff={dropoff} courier={courier} status={status} />
      </div>

      <dl className="mt-4 grid gap-2 rounded-2xl border border-ink/10 bg-white p-4 text-sm dark:border-cream/10 dark:bg-white/5 sm:grid-cols-3">
        <div>
          <dt className="text-ink/50 dark:text-cream/50">Courier</dt>
          <dd className="font-medium">{courierName ?? 'Assigning…'}</dd>
          <dd className="text-xs text-ink/50 dark:text-cream/50">{formatPhone(courierPhone)}</dd>
        </div>
        <div>
          <dt className="text-ink/50 dark:text-cream/50">Estimated arrival</dt>
          <dd className="font-medium">{formatEtaRange(etaMin, etaMax)}</dd>
        </div>
        <div>
          <dt className="text-ink/50 dark:text-cream/50">Delivery address</dt>
          <dd className="font-medium">📍 marked on the map</dd>
        </div>
      </dl>
    </section>
  );
}