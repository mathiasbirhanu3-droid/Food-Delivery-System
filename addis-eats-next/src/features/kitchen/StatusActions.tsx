'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { advanceOrderStatus, type AdvanceResult } from '@/actions/kitchen';

const nextLabel: Partial<Record<string, string>> = {
  pending: 'Start preparing',
  preparing: 'Send out for delivery',
  delivering: 'Mark delivered',
};

export default function StatusActions({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<AdvanceResult | null>(null);
  const label = nextLabel[status] ?? null;

  if (!label) return <span className="text-xs text-ink/40 dark:text-cream/40">—</span>;

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await advanceOrderStatus(orderId); // role check lives in the action
            setResult(r);
            if (r.ok) router.refresh();
          })
        }
        className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-600 disabled:opacity-60"
      >
        {pending ? '…' : label}
      </button>
      {result && !result.ok && (
        <span role="alert" className="text-[11px] font-medium text-accent">
          {result.reason === 'role' ? 'Refused: not kitchen' : result.reason === 'session' ? 'Refused: signed out' : 'No further step'}
        </span>
      )}
    </div>
  );
}