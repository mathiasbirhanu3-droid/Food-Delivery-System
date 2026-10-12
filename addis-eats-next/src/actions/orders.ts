'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session-server';
import { getDish, getZone } from '@/lib/db';
import { getOrderFor, insertOrder, nextOrderId, setOrderStatus } from '@/lib/orders-store';
import { placeOrderSchema } from '@/features/checkout/schema';
import type { Order } from '@/lib/types';
import { priceOf } from '@/lib/pricing';

export type CancelResult =
  | { ok: true }
  | { ok: false; refusedBy: 'session' | 'ownership' | 'state' };

/**
 * cancelOrder — the sheet's attack surface. Both authorization checks live
 * HERE, inside the action, not in the interface.
 */
export async function cancelOrder(orderId: string): Promise<CancelResult> {
  // ── Layer 3a · session ─────────────────────────────────────────────
  const session = await getSession();
  if (!session) return { ok: false, refusedBy: 'session' };   // ← ATTACK 1 REFUSED HERE

  // ── Layer 3b · ownership, via the SCOPED read ─────────────────────
  const order = getOrderFor(session.userId, orderId);
  if (!order) return { ok: false, refusedBy: 'ownership' };   // ← ATTACK 2 REFUSED HERE

  // ── state check ────────────────────────────────────────────────────
  if (order.status !== 'pending') return { ok: false, refusedBy: 'state' };

  setOrderStatus(orderId, 'cancelled');
  revalidatePath('/orders');
  revalidatePath(`/orders/${orderId}`);
  return { ok: true };
}

export type PlaceOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

/**
 * placeOrder — checkout write. Middleware+page prove sign-in; the write
 * re-checks the session and re-prices everything from db.json. Client-sent
 * prices are never trusted.
 */
export async function placeOrder(formData: FormData): Promise<PlaceOrderResult> {
  // ── Layer 3 · session re-check inside the write ────────────────────
  const session = await getSession();
  if (!session) return { ok: false, error: 'Please sign in to place your order.' };

  const parsed = placeOrderSchema.safeParse({
    items: formData.get('items'),
    name: formData.get('name'),
    phone: formData.get('phone'),
    zone: formData.get('zone'),
    note: formData.get('note') || undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { items, name, phone, zone, note } = parsed.data;

  // Server re-prices every line from the data source — the cart snapshot
  // the browser sent is treated as a wish list, never as pricing truth.
  const lines = items.map((item) => {
    const dish = getDish(item.id);
    if (!dish || !dish.available) return null;
    return { dishId: dish.id, qty: item.qty, unitPrice: priceOf(dish).final }; // discounted price, server-side
  });

  const unavailable = items
    .filter((_, index) => lines[index] === null)
    .map((item) => getDish(item.id)?.name ?? item.id);
  if (unavailable.length > 0) {
    return {
      ok: false,
      error: `No longer on the menu: ${unavailable.join(', ')}. Your cart has been refreshed — remove it and try again.`,
    };
  }

  const zoneInfo = getZone(zone);
  if (!zoneInfo) return { ok: false, error: 'Choose a delivery area.' };

  const now = new Date().toISOString();
  const order: Order = {
    id: nextOrderId(),
    userId: session.userId,          // ← ownership by construction
    items: lines as Order['items'],
    zone: zoneInfo.name,
    fee: zoneInfo.fee,
    etaMin: zoneInfo.etaMin,
    etaMax: zoneInfo.etaMax,
    note: note || undefined,
    contact: { name, phone },
    status: 'pending',
    placedAt: now,
    events: [{ at: now, status: 'pending' }],
  };

  insertOrder(order);
  revalidatePath('/orders');
  return { ok: true, orderId: order.id };
}