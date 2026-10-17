'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { cancelOrder, type CancelResult } from '@/actions/orders';

const messages: Record<Exclude<CancelResult, { ok: true }>['refusedBy'], string> = {
  session: 'Refused at the session layer — you are not signed in.',
  ownership: 'Refused at the ownership layer — this order is not yours.',
  state: 'Only pending orders can be cancelled.',
};

export default function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CancelResult | null>(null);

  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const outcome = await cancelOrder(orderId); // the action holds both auth layers
            setResult(outcome);
            if (outcome.ok) router.refresh();
          })
        }
        className="rounded-full border border-accent px-5 py-2 text-sm font-semibold text-accent hover:bg-accent hover:text-white disabled:opacity-60"
      >
        {pending ? 'Cancelling…' : 'Cancel this order'}
      </button>
      {result && !result.ok && (
        <p role="alert" className="mt-3 rounded-xl bg-accent/10 p-3 text-sm font-medium text-accent">
          {messages[result.refusedBy]}
        </p>
      )}
      {result?.ok && (
        <p className="mt-3 rounded-xl bg-primary/10 p-3 text-sm font-medium text-primary">Order cancelled.</p>
      )}
    </div>
  );
}