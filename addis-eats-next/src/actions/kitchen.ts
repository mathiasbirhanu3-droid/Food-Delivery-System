'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session-server';
import { getAllOrders, setOrderStatus } from '@/lib/orders-store';
import { addDish, findDishById, nextDishId, patchDish, removeDish } from '@/lib/dishes-store';
import {
  insertAnnouncement,
  listAllAnnouncements,
  nextAnnouncementId,
  removeAnnouncement,
  setAnnouncementActive,
} from '@/lib/announcements-store';
import { dishSchema } from '@/features/kitchen/schema';
import { sanitizeNext } from '@/lib/sanitize';
import type { Announcement, DishCategory, OrderStatus } from '@/lib/types';

// ── order status pipeline (kitchen queue) ────────────────────────────
const pipeline: Record<OrderStatus, OrderStatus | null> = {
  pending: 'preparing',
  preparing: 'delivering',
  delivering: 'delivered',
  delivered: null,
  cancelled: null,
};

export type AdvanceResult =
  | { ok: true; status: OrderStatus }
  | { ok: false; reason: 'session' | 'role' | 'state' };

/**
 * AUTH.md — the page guard proves nothing to an action; every check runs
 * HERE, on every call (Day 45 Decision Table 1, /kitchen row).
 */
export async function advanceOrderStatus(orderId: string): Promise<AdvanceResult> {
  const session = await getSession();
  if (!session) return { ok: false, reason: 'session' }; // ← signed-out refused HERE

  if (session.role !== 'kitchen') return { ok: false, reason: 'role' }; // ← customer refused HERE

  const order = getAllOrders().find((o) => o.id === orderId);
  if (!order) return { ok: false, reason: 'state' };

  const next = pipeline[order.status];
  if (!next) return { ok: false, reason: 'state' };

  setOrderStatus(orderId, next);
  revalidatePath('/kitchen');
  revalidatePath(`/orders/${orderId}`);
  return { ok: true, status: next };
}

// ── layer 3 helper: re-derives authority from the cookie, every call ──
async function assertKitchen() {
  const session = await getSession();
  if (!session || session.role !== 'kitchen') redirect('/kitchen?refused=1'); // ← role refused HERE
  return session;
}

// ── unified dish marketing form (create + update in one action) ──────
export async function upsertDish(formData: FormData): Promise<void> {
  await assertKitchen();

  const id = String(formData.get('id') ?? '');
  const parsed = dishSchema.safeParse({
    name: formData.get('name'),
    marketingLine: formData.get('marketingLine') || '',
    description: formData.get('description'),
    price: formData.get('price'),
    discountPercent: formData.get('discountPercent') || 0,
    image: formData.get('image') || '',
  });
  if (!parsed.success) redirect('/kitchen/menu?invalid=1');

  const { name, marketingLine, description, price, discountPercent, image } = parsed.data;

  if (id) {
    // Update — the form id must exist in the store; it grants no authority.
    if (findDishById(id)) {
      patchDish(id, {
        name,
        marketingLine: marketingLine || undefined,
        description,
        price,
        discountPercent,
        image: image || undefined,
      });
    }
  } else {
    const newId = nextDishId(name);
    addDish({
      id: newId,
      slug: newId,
      name,
      description,
      ingredients: [],
      category: (String(formData.get('category') ?? '') as DishCategory) || 'Ethiopian',
      price,
      image:
        image ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1080&auto=format&fit=crop',
      tags: [],
      spicy: false,
      vegetarian: false,
      popular: false,
      prepMinutes: 20,
      rating: 0,
      available: true,
      marketingLine: marketingLine || undefined,
      discountPercent,
    });
  }

  revalidatePath('/kitchen/menu');
  revalidatePath('/menu');
  revalidatePath('/');
}

export async function toggleDishAvailability(formData: FormData) {
  await assertKitchen();
  const dish = findDishById(String(formData.get('id') ?? ''));
  if (dish) patchDish(dish.id, { available: !dish.available });
  revalidatePath('/kitchen/menu');
  revalidatePath('/menu');
}

export async function deleteDish(formData: FormData) {
  await assertKitchen();
  removeDish(String(formData.get('id') ?? ''));
  revalidatePath('/kitchen/menu');
  revalidatePath('/menu');
}

// Compatibility aliases — old callers keep compiling; the new page uses
// upsertDish directly. Safe to delete once nothing imports these.
export async function createDish(formData: FormData) {
  await upsertDish(formData);
}
export async function updateDish(formData: FormData) {
  await upsertDish(formData);
}

// ── announcements (the marquee strip) ────────────────────────────────
export async function createAnnouncement(formData: FormData): Promise<void> {
  await assertKitchen();

  const message = String(formData.get('message') ?? '').trim().slice(0, 140);
  if (message.length < 4) redirect('/kitchen/announcements?invalid=1');

  const rawHref = String(formData.get('href') ?? '').trim();
  const href = rawHref ? sanitizeNext(rawHref) : undefined; // internal links only

  const toneRaw = String(formData.get('tone') ?? 'info');
  const tone: Announcement['tone'] =
    toneRaw === 'festival' || toneRaw === 'deal' ? toneRaw : 'info';

  insertAnnouncement({
    id: nextAnnouncementId(),
    message,
    href,
    tone,
    active: true,
  });

  revalidatePath('/');
  revalidatePath('/kitchen/announcements');
}

export async function toggleAnnouncement(formData: FormData) {
  await assertKitchen();
  const id = String(formData.get('id') ?? '');
  const item = listAllAnnouncements().find((a) => a.id === id);
  if (item) setAnnouncementActive(id, !item.active);
  revalidatePath('/');
  revalidatePath('/kitchen/announcements');
}

export async function deleteAnnouncement(formData: FormData) {
  await assertKitchen();
  removeAnnouncement(String(formData.get('id') ?? ''));
  revalidatePath('/');
  revalidatePath('/kitchen/announcements');
}