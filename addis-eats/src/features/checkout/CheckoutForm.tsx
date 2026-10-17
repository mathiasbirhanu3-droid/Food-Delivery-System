'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { placeOrder } from '@/actions/orders';
import { placeOrderSchema } from '@/features/checkout/schema';
import { useCart } from '@/features/cart/cart-store';
import { formatETB } from '@/lib/format-etb';
import type { Zone } from '@/lib/types';

const inputClass =
  'mt-1.5 w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-ink/40 focus:border-primary dark:border-cream/20 dark:bg-white/5 dark:placeholder:text-cream/40';

/** Feature 11 — the confirmation state shown in place of the form. */
interface Confirmation {
  orderId: string;
  total: number;
  zone: string;
  etaMin: number;
  etaMax: number;
}

export default function CheckoutForm({
  zones,
  defaults,
}: {
  zones: Zone[];
  defaults: { name: string; phone: string; zone: string };
}) {
  const { lines, subtotal, clear } = useCart();

  const [name, setName] = useState(defaults.name);
  const [phone, setPhone] = useState(defaults.phone);
  const [zone, setZone] = useState(defaults.zone);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  // Features 20–21 — fee and ETA are DERIVED from the selected zone, never stored.
  const selectedZone = useMemo(() => zones.find((z) => z.name === zone) ?? null, [zone, zones]);
  const total = subtotal + (selectedZone?.fee ?? 0);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    setErrors({});

    const payload = {
      items: JSON.stringify(lines.map(({ id, qty }) => ({ id, qty }))),
      name, phone, zone, note,
    };
    const parsed = placeOrderSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] ??= issue.message;
      setErrors(fieldErrors);
      return;
    }

    setPending(true);
    const result = await placeOrder(new FormData(event.currentTarget));
    setPending(false);

    if (result.ok) {
      // Capture the receipt BEFORE clearing — the cart store empties on clear().
      setConfirmation({
        orderId: result.orderId,
        total,
        zone: selectedZone?.name ?? zone,
        etaMin: selectedZone?.etaMin ?? 0,
        etaMax: selectedZone?.etaMax ?? 0,
      });
      clear(); // feature: the cart became an order — empty it (badge resets too)
    } else {
      setFormError(result.error);
    }
  }

  // ── Feature 11 · Order confirmation ─────────────────────────────────
  if (confirmation) {
    return (
      <section
        aria-live="polite"
        role="status"
        className="mx-auto max-w-xl px-4 py-16 text-center"
      >
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary text-3xl text-white">
          ✓
        </div>
        <h1 className="mt-5 font-display text-3xl font-bold">Your order is successful!</h1>
        <p className="mt-2 text-ink/70 dark:text-cream/70">
          The kitchen has it. You can watch it move from pending to delivered — live, no refresh.
        </p>

        <dl className="mt-8 space-y-2 rounded-2xl border border-ink/10 bg-white p-5 text-left text-sm shadow-card dark:border-cream/10 dark:bg-white/5">
          <div className="flex justify-between">
            <dt className="text-ink/60 dark:text-cream/60">Order ID</dt>
            <dd className="font-display font-bold">{confirmation.orderId}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink/60 dark:text-cream/60">Total (cash on delivery)</dt>
            <dd className="font-bold text-primary">{formatETB(confirmation.total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink/60 dark:text-cream/60">Delivering to</dt>
            <dd>{confirmation.zone}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink/60 dark:text-cream/60">Estimated arrival</dt>
            <dd>{confirmation.etaMin}–{confirmation.etaMax} min</dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/orders/${confirmation.orderId}`}
            className="rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-600"
          >
            Track your order live
          </Link>
          <Link
            href="/menu"
            className="rounded-full border border-ink/15 px-6 py-3 font-semibold hover:border-primary hover:text-primary dark:border-cream/20"
          >
            Order something else
          </Link>
        </div>

        <p className="mt-6 text-xs text-ink/40 dark:text-cream/40">
          The order is saved in your history — refresh-safe at /orders.
        </p>
      </section>
    );
  }

  // ── The form ────────────────────────────────────────────────────────
  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Checkout</h1>
      <p className="mt-1 text-ink/60 dark:text-cream/60">Cash on delivery. Your details are attached to your order only.</p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <input type="hidden" name="items" value={JSON.stringify(lines.map(({ id, qty }) => ({ id, qty })))} />

        <label className="block text-sm font-medium">
          Your name
          <input name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={inputClass} />
          {errors.name && <span role="alert" className="mt-1 block text-xs font-medium text-accent">{errors.name}</span>}
        </label>

        <label className="block text-sm font-medium">
          Phone
          <input name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel"
            placeholder="+251 91 123 4567" className={inputClass} />
          {errors.phone && <span role="alert" className="mt-1 block text-xs font-medium text-accent">{errors.phone}</span>}
        </label>

        <label className="block text-sm font-medium">
          Delivery area
          <select name="zone" value={zone} onChange={(e) => setZone(e.target.value)} className={inputClass}>
            {zones.map((z) => <option key={z.name} value={z.name}>{z.name}</option>)}
          </select>
          {errors.zone && <span role="alert" className="mt-1 block text-xs font-medium text-accent">{errors.zone}</span>}
        </label>

        <label className="block text-sm font-medium">
          Special instructions <span className="font-normal text-ink/40 dark:text-cream/40">(optional)</span>
          <textarea name="note" value={note} onChange={(e) => setNote(e.target.value)} rows={2}
            placeholder="Extra awaze on the side…" className={inputClass} />
          {errors.note && <span role="alert" className="mt-1 block text-xs font-medium text-accent">{errors.note}</span>}
        </label>

        <dl className="space-y-1 rounded-2xl bg-white p-4 text-sm shadow-card dark:bg-white/5">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatETB(subtotal)}</dd></div>
          <div className="flex justify-between">
            <dt>Delivery — {selectedZone?.name ?? '—'}</dt>
            <dd>{selectedZone ? formatETB(selectedZone.fee) : '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Estimated delivery</dt>
            <dd>{selectedZone ? `${selectedZone.etaMin}–${selectedZone.etaMax} min` : '—'}</dd>
          </div>
          <div className="flex justify-between border-t border-ink/10 pt-2 font-display text-base font-bold dark:border-cream/10">
            <dt>Total</dt><dd className="text-primary">{formatETB(total)}</dd>
          </div>
        </dl>

        {lines.length === 0 && (
          <p role="alert" className="text-sm font-medium text-accent">Your cart is empty — add a dish first.</p>
        )}
        {formError && (
          <p role="alert" className="rounded-xl bg-accent/10 p-3 text-sm font-medium text-accent">{formError}</p>
        )}

        <button type="submit" disabled={pending || lines.length === 0}
          className="w-full rounded-full bg-primary py-3 font-semibold text-white hover:bg-primary-600 disabled:opacity-60">
          {pending ? 'Placing your order…' : `Place order · ${formatETB(total)}`}
        </button>
      </form>
    </section>
  );
}