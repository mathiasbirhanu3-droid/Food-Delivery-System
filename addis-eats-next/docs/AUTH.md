AUTH.md — one line per layer (updated: Step 1)
Routes
Route	Layers	What each layer proves
/, /menu, /menu/[id]	none	public, stays indexable
/signin	sanitizeNext() before any redirect	no open redirect (attack 3)
/orders	middleware -> cookie exists; page -> session verified; query -> getOrdersFor(session.userId)	signed in; only their own records
/orders/[id]	middleware; page -> session verified; query -> getOrderFor(session.userId, id)	signed in; foreign id = 404, never a leak
/checkout	middleware; page -> session verified	signed in (write re-checks — cart step)
/kitchen	middleware; page -> session + role verified	signed in, and permitted
Actions
Action	Checks, in order	Stopped by (file:line intent)
signInAction	credentials verified server-side; next sanitized before redirect	lib/sanitize.ts / lib/auth.ts
signOutAction	deletes cookie	src/actions/auth.ts
cancelOrder (cart step)	TODO session -> TODO ownership	TODO
kitchen status/CRUD (kitchen step)	TODO role re-checked inside action	TODO
The three attacks
#	Attack	Expected	Refused by	Status
1	signed-out: await cancelOrder("ord_812")	refused, not a crash	session check inside action	pending (cart step)
2	signed in as Selam, cancel Dawit's ord_814	refused on ownership	ownership line inside action	pending (cart step)
3	/signin?next=https://example.com	lands in-app, never off-site	sanitizeNext() in lib/sanitize.ts	PASS (runnable now)
+	URL IDOR: /orders/ord_814 as Selam	404	scoped query getOrderFor	PASS (runnable now)
Cookie
addis_session — HttpOnly; Secure (prod); SameSite=Lax; Path=/; Max-Age 7d;HMAC-SHA256 signed (Web Crypto, edge-safe), constant-time MAC compare.Confirmed flags in devtools on deployment: ☐ (screenshot at demo time)

Notes
Middleware deliberately verifies existence only — that is all a cookie checkcan prove. Signature and expiry are verified at layer 2 (lib/session.ts).
Demo seed uses demoPassword fields; the salted-hash path exists inlib/auth.ts and a seed script is planned. Production: real auth provider.
Attacks 1 and 2 need a target to attack — so this step builds the full write path: cart → checkout → `placeOrder` → `cancelOrder`, with every layer **inside the actions**, then wires the console bridge so the sheet's attack commands run verbatim. The refusing lines are marked in the code, because AUTH.md requires naming them.

---

## 1 · Data layer — orders become a mutable, scoped store

**`src/lib/types.ts`** (new — types live in one place, no import cycles)
```ts
export type Role = 'customer' | 'kitchen';
export type OrderStatus = 'pending' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';

export interface Zone { name: string; fee: number; etaMin: number; etaMax: number }

export interface User {
  id: string; email: string; name: string; phone: string;
  role: Role; defaultZone: string;
  passwordHash?: string; passwordSalt?: string; demoPassword?: string;
}

export type DishCategory = 'Ethiopian' | 'Pizza' | 'Burgers' | 'Drinks';
export interface Dish {
  id: string; slug: string; name: string; description: string; ingredients: string[];
  category: DishCategory; price: number; image: string; tags: string[];
  spicy: boolean; vegetarian: boolean; popular: boolean;
  prepMinutes: number; rating: number; available: boolean;
}

export interface OrderItem { dishId: string; qty: number; unitPrice: number }
export interface OrderEvent { at: string; status: OrderStatus }
export interface Order {
  id: string; userId: string; items: OrderItem[];
  zone: string; fee: number; etaMin: number; etaMax: number;
  note?: string; contact?: { name: string; phone: string };
  status: OrderStatus; placedAt: string; events: OrderEvent[];
}

export interface Restaurant {
  name: string; tagline: string; address: string; phone: string;
  hours: string; currency: string; zones: string[];
}
```

**`src/lib/orders-store.ts`** (new — the only place order state mutates)
```ts
import dbData from '@/data/db.json';
import type { Order, OrderStatus } from '@/lib/types';

/**
 * In-memory order store, seeded once per server process from db.json —
 * the single data source. Serverless cold-start caveat: documented in
 * docs/DATA.md, accepted for this build.
 */
const orders = (dbData as unknown as { orders: Order[] }).orders.map((o) => structuredClone(o));
let nextSeq = 900; // seed data ends at ord_815

export const nextOrderId = () => `ord_${nextSeq++}`;

/** AUTH.md — scoped read: no unscoped per-user order query exists. */
export const getOrdersFor = (userId: string) =>
  orders.filter((o) => o.userId === userId).sort((a, b) => b.placedAt.localeCompare(a.placedAt));

/** AUTH.md — the scoped read that stops attack 2: a foreign id returns null. */
export const getOrderFor = (userId: string, orderId: string) =>
  orders.find((o) => o.id === orderId && o.userId === userId) ?? null;

/** Kitchen only — callers must verify role BEFORE and INSIDE their actions. */
export const getAllOrders = () => orders;

export function insertOrder(order: Order): void {
  orders.unshift(order);
}

export function setOrderStatus(orderId: string, status: OrderStatus): Order | null {
  const order = orders.find((o) => o.id === orderId);
  if (!order) return null;
  order.status = status;
  order.events.push({ at: new Date().toISOString(), status });
  return order;
}
```

**`src/lib/db.ts`** (trimmed rewrite — reads only; order reads delegate to the store)
```ts
import dbData from '@/data/db.json';
import type { Dish, Restaurant, User, Zone } from '@/lib/types';

const db = dbData as unknown as {
  restaurant: Restaurant; zones: Zone[]; users: User[]; dishes: Dish[];
};

// ---- public reads ----
export const getRestaurant = (): Restaurant => db.restaurant;
export const getZones = (): Zone[] => db.zones;
export const getZone = (name: string): Zone | null => db.zones.find((z) => z.name === name) ?? null;
export const getDishes = (): Dish[] => db.dishes.filter((d) => d.available);
export const getDish = (id: string): Dish | null => db.dishes.find((d) => d.id === id) ?? null;

// ---- users ----
export const getUserByEmail = (email: string): User | null =>
  db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
export const getUserById = (id: string): User | null => db.users.find((u) => u.id === id) ?? null;

export function getDemoAccounts() {
  return db.users
    .filter((u): u is User & { demoPassword: string } => Boolean(u.demoPassword))
    .map(({ email, name, role, demoPassword }) => ({ email, name, role, demoPassword }));
}

// ---- order reads (AUTH.md: every call site goes through the scoped store) ----
export {
  getOrdersFor,
  getOrderFor,
  getAllOrders,
} from '@/lib/orders-store';
```

## 2 · The actions — where attacks 1 and 2 are refused

**`src/features/checkout/schema.ts`** (one zod schema, used by client validation **and** re-run server-side)
```ts
import { z } from 'zod';

export const placeOrderSchema = z.object({
  items: z.preprocess(
    (v) => {
      try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return []; }
    },
    z.array(z.object({ id: z.string().min(1), qty: z.number().int().min(1).max(20) }))
      .min(1, 'Your cart is empty.'),
  ),
  name: z.string().trim().min(2, 'Tell us your name.').max(80),
  phone: z.preprocess(
    (v) => String(v).replace(/[\s()-]/g, ''),
    z.string().regex(/^(\+?251|0)?9\d{8}$/, 'Enter a valid Ethiopian mobile, e.g. +251 91 123 4567'),
  ),
  zone: z.string().min(1, 'Choose a delivery area.'),
  note: z.string().trim().max(200, 'Keep the note under 200 characters.').optional(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
```

**`src/actions/orders.ts`** (new)
```ts
'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session-server';
import { getDish, getZone } from '@/lib/db';
import { getOrderFor, insertOrder, nextOrderId, setOrderStatus } from '@/lib/orders-store';
import { placeOrderSchema } from '@/features/checkout/schema';
import type { Order } from '@/lib/types';

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
  // A foreign orderId is indistinguishable from a missing one: null.
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
    return { dishId: dish.id, qty: item.qty, unitPrice: dish.price };
  });
  if (lines.some((line) => line === null)) {
    return { ok: false, error: 'Something in your cart is no longer available.' };
  }

  const zoneInfo = getZone(zone);
  if (!zoneInfo) return { ok: false, error: 'Choose a delivery area.' };

  const now = new Date().toISOString();
  const order: Order = {
    id: nextOrderId(),
    userId: session.userId,          // ← ownership by construction: scoped to the session
    items: lines as Order['items'],
    zone: zoneInfo.name,
    fee: zoneInfo.fee,               // derived server-side from the zone
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
```

## 3 · Cart — client store, localStorage, derived totals and badge

**`src/features/cart/cart-store.tsx`** (new)
```tsx
'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface CartLine { id: string; name: string; price: number; image: string; qty: number }

const STORAGE_KEY = 'addis_eats_cart_v1';

interface CartApi {
  lines: CartLine[];
  hydrated: boolean;
  add: (line: Omit<CartLine, 'qty'>) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;   // floors at 1 — removal is explicit (feature 6)
  remove: (id: string) => void;
  clear: () => void;
  count: number;                     // derived — never stored (Day 35 state table)
  subtotal: number;                  // derived ETB subtotal
}

const CartContext = createContext<CartApi | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { // feature 8 — cart survives refresh
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch { /* corrupted storage — start empty */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const add = useCallback((line: Omit<CartLine, 'qty'>) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.id === line.id);
      if (existing) return prev.map((l) => (l.id === line.id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { ...line, qty: 1 }];
    });
  }, []);

  const increment = useCallback((id: string) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, qty: Math.min(l.qty + 1, 20) } : l)));
  }, []);

  const decrement = useCallback((id: string) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, qty: Math.max(l.qty - 1, 1) } : l)));
  }, []);

  const remove = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartApi>(() => ({
    lines, hydrated, add, increment, decrement, remove, clear,
    count: lines.reduce((sum, l) => sum + l.qty, 0),
    subtotal: lines.reduce((sum, l) => sum + l.qty * l.price, 0),
  }), [lines, hydrated, add, increment, decrement, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
```

**`src/features/cart/CartBadge.tsx`** (new — feature 24, derived count)
```tsx
'use client';

import Link from 'next/link';
import { useCart } from '@/features/cart/cart-store';

export default function CartBadge() {
  const { count, hydrated } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
      className="relative rounded-full border border-ink/15 p-2 hover:border-primary dark:border-cream/20"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 6h15l-1.5 9h-12L6 6Zm0 0L5 3H2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="20" r="1.5" fill="currentColor" />
        <circle cx="18" cy="20" r="1.5" fill="currentColor" />
      </svg>
      {hydrated && count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
```

**`src/app/layout.tsx`** (updated — CartProvider wraps everything; AttackBridge mounts globally so attack 1 runs signed-out from any page)
```tsx
import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CartProvider } from '@/features/cart/cart-store';
import AttackBridge from '@/features/orders/AttackBridge';

const display = Outfit({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Addis Eats — Ethiopian food, delivered in Addis Ababa', template: '%s — Addis Eats' },
  description:
    'Order doro wat, sega tibs, pizza and buna from Addis Eats. Live order tracking and delivery across Addis Ababa.',
  openGraph: { type: 'website', siteName: 'Addis Eats' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable}`}>
        <CartProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
          >
            Skip to content
          </a>
          <Header />
          <main id="main" className="min-h-[70vh]">{children}</main>
          <Footer />
        </CartProvider>
        <AttackBridge />
      </body>
    </html>
  );
}
```

**`src/components/Header.tsx`** (updated — cart badge in the cluster)
```tsx
import Link from 'next/link';
import { getSession } from '@/lib/session-server';
import { signOutAction } from '@/actions/auth';
import Logo from '@/components/Logo';
import CartBadge from '@/features/cart/CartBadge';

export default async function Header() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/80 backdrop-blur dark:border-cream/10 dark:bg-ink/80">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" aria-label="Addis Eats home"><Logo /></Link>

        <div className="hidden items-center gap-6 text-sm font-medium sm:flex">
          <Link href="/menu" className="hover:text-primary">Menu</Link>
          {session && <Link href="/orders" className="hover:text-primary">My orders</Link>}
          {session?.role === 'kitchen' && <Link href="/kitchen" className="hover:text-primary">Kitchen</Link>}
        </div>

        <div className="flex items-center gap-3">
          <CartBadge />
          {session ? (
            <>
              <span className="hidden text-sm text-ink/70 sm:inline dark:text-cream/70">
                Hi, {session.name.split(' ')[0]}
              </span>
              <form action={signOutAction}>
                <button type="submit" className="rounded-full border border-ink/15 px-4 py-1.5 text-sm font-medium hover:border-accent hover:text-accent dark:border-cream/20">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link href="/signin" className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary-600">
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
```

## 4 · Add to cart on menu and dish pages

**`src/features/menu/DishCard.tsx`** (new — card becomes a client island; heart slot reserved for favorites)
```tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/features/cart/cart-store';
import { formatETB } from '@/lib/format-etb';
import type { Dish } from '@/lib/types';

export default function DishCard({ dish }: { dish: Dish }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    add({ id: dish.id, name: dish.name, price: dish.price, image: dish.image });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  return (
    <article className="group overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 dark:border-cream/10 dark:bg-white/5">
      <Link href={`/menu/${dish.id}`} className="block">
        <div className="relative aspect-[4/3] bg-primary-50 dark:bg-primary-900/40">
          <Image
            src={dish.image} alt={dish.name} fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
          {dish.popular && (
            <span className="absolute left-3 top-3 rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-ink">Popular</span>
          )}
        </div>
        <div className="p-4 pb-0">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-display font-semibold">{dish.name}</h2>
            <span className="font-semibold text-primary">{formatETB(dish.price)}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-ink/60 dark:text-cream/60">{dish.description}</p>
        </div>
      </Link>
      <div className="flex items-center justify-between p-4">
        <span className="text-xs text-ink/50 dark:text-cream/50">★ {dish.rating} · {dish.prepMinutes} min</span>
        <button
          type="button"
          onClick={handleAdd}
          aria-label={`Add ${dish.name} to cart`}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            added ? 'bg-primary/15 text-primary' : 'bg-primary text-white hover:bg-primary-600'
          }`}
        >
          {added ? 'Added ✓' : 'Add'}
        </button>
      </div>
    </article>
  );
}
```

**`src/app/menu/page.tsx`** — swap the inline card for `<DishCard dish={dish} />` inside the `<ul>` (everything else unchanged).

**`src/features/menu/AddToCart.tsx`** (new — detail-page action)
```tsx
'use client';

import { useState } from 'react';
import { useCart } from '@/features/cart/cart-store';

export default function AddToCart({ dish }: { dish: { id: string; name: string; price: number; image: string } }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => { add(dish); setAdded(true); window.setTimeout(() => setAdded(false), 1200); }}
      className={`rounded-full px-8 py-3 font-semibold transition ${
        added ? 'bg-primary/15 text-primary' : 'bg-primary text-white hover:bg-primary-600'
      }`}
    >
      {added ? 'Added to cart ✓' : 'Add to cart'}
    </button>
  );
}
```

In **`src/app/menu/[id]/page.tsx`**, replace the placeholder line with:
```tsx
<AddToCart dish={{ id: dish.id, name: dish.name, price: dish.price, image: dish.image }} />
```

## 5 · Cart page — lines, steppers, derived subtotal

**`src/app/cart/page.tsx`** (replaces the empty-state stub)
```tsx
import type { Metadata } from 'next';
import CartView from '@/features/cart/CartView';

export const metadata: Metadata = {
  title: 'Cart',
  description: 'Your Addis Eats cart — review your dishes and totals before checkout.',
};

export default function CartPage() {
  return <CartView />;
}
```

**`src/features/cart/CartView.tsx`** (new)
```tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/features/cart/cart-store';
import { formatETB } from '@/lib/format-etb';

export default function CartView() {
  const { lines, hydrated, increment, decrement, remove, subtotal } = useCart();

  if (!hydrated) return <div className="mx-auto max-w-2xl px-4 py-20" aria-busy="true" />;

  if (lines.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-ink/60 dark:text-cream/60">Nothing here yet — the kitchen is waiting.</p>
        <Link href="/menu" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-600">
          Browse the menu
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Your cart</h1>

      <ul className="mt-8 space-y-3">
        {lines.map((line) => (
          <li key={line.id} className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-white p-3 dark:border-cream/10 dark:bg-white/5">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-primary-50 dark:bg-primary-900/40">
              <Image src={line.image} alt="" fill sizes="64px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{line.name}</p>
              <p className="text-sm text-ink/50 dark:text-cream/50">{formatETB(line.price)} each</p>
            </div>
            <div className="flex items-center gap-2" role="group" aria-label={`Quantity for ${line.name}`}>
              <button type="button" onClick={() => decrement(line.id)} aria-label={`Decrease ${line.name}`}
                className="h-8 w-8 rounded-full border border-ink/15 font-bold hover:border-primary dark:border-cream/20">−</button>
              <span className="w-6 text-center font-semibold" aria-live="polite">{line.qty}</span>
              <button type="button" onClick={() => increment(line.id)} aria-label={`Increase ${line.name}`}
                className="h-8 w-8 rounded-full border border-ink/15 font-bold hover:border-primary dark:border-cream/20">+</button>
            </div>
            <span className="w-20 text-right font-semibold">{formatETB(line.qty * line.price)}</span>
            <button type="button" onClick={() => remove(line.id)} aria-label={`Remove ${line.name}`}
              className="text-ink/40 hover:text-accent dark:text-cream/40" aria-hidden="false">✕</button>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between rounded-2xl bg-white p-4 shadow-card dark:bg-white/5">
        <span className="font-medium">Subtotal</span>
        <span className="font-display text-xl font-bold text-primary" aria-live="polite">{formatETB(subtotal)}</span>
      </div>
      <p className="mt-2 text-sm text-ink/50 dark:text-cream/50">Delivery fee and estimated time are calculated at checkout from your area.</p>

      <Link href="/checkout" className="mt-6 block rounded-full bg-primary py-3 text-center font-semibold text-white hover:bg-primary-600">
        Continue to checkout
      </Link>
    </section>
  );
}
```

## 6 · Checkout — validated form, derived fee/ETA, guarded

**`src/app/(private)/checkout/page.tsx`** (new)
```tsx
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session-server';
import { getUserById, getZones } from '@/lib/db';
import CheckoutForm from '@/features/checkout/CheckoutForm';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Place your Addis Eats order — delivery area, contact details, and a live total.',
  robots: { index: false },
};

export default async function CheckoutPage() {
  // Layer 2 — middleware proved a cookie exists; the session is verified here.
  const session = await getSession();
  if (!session) redirect('/signin?next=/checkout');

  const user = getUserById(session.userId);
  const zones = getZones();

  return (
    <CheckoutForm
      zones={zones}
      defaults={{
        name: user?.name ?? '',
        phone: user?.phone ?? '',
        zone: user?.defaultZone ?? zones[0]?.name ?? '',
      }}
    />
  );
}
```

**`src/features/checkout/CheckoutForm.tsx`** (new)
```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { placeOrder } from '@/actions/orders';
import { placeOrderSchema, type PlaceOrderInput } from '@/features/checkout/schema';
import { useCart } from '@/features/cart/cart-store';
import { formatETB } from '@/lib/format-etb';
import type { Zone } from '@/lib/types';

const inputClass =
  'mt-1.5 w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-ink/40 focus:border-primary dark:border-cream/20 dark:bg-white/5 dark:placeholder:text-cream/40';

export default function CheckoutForm({ zones, defaults }: { zones: Zone[]; defaults: { name: string; phone: string; zone: string } }) {
  const router = useRouter();
  const { lines, subtotal, clear } = useCart();

  const [name, setName] = useState(defaults.name);
  const [phone, setPhone] = useState(defaults.phone);
  const [zone, setZone] = useState(defaults.zone);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);

  // Features 20–21 — fee and ETA are DERIVED from the selected zone, never stored.
  const selectedZone = useMemo(() => zones.find((z) => z.name === zone) ?? null, [zone, zones]);
  const total = subtotal + (selectedZone?.fee ?? 0);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    setErrors({});

    const payload = { items: JSON.stringify(lines.map(({ id, qty }) => ({ id, qty }))), name, phone, zone, note };
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
      clear(); // the cart became an order — empty it
      router.push(`/orders/${result.orderId}`);
    } else {
      setFormError(result.error);
    }
  }

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
        {formError && <p role="alert" className="text-sm font-medium text-accent">{formError}</p>}

        <button type="submit" disabled={pending || lines.length === 0}
          className="w-full rounded-full bg-primary py-3 font-semibold text-white hover:bg-primary-600 disabled:opacity-60">
          {pending ? 'Placing your order…' : `Place order · ${formatETB(total)}`}
        </button>
      </form>
    </section>
  );
}
```

## 7 · Cancel from the UI + the console bridge (attack target)

**`src/features/orders/CancelOrderButton.tsx`** (new)
```tsx
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
```

**`src/features/orders/AttackBridge.tsx`** (new)
```tsx
'use client';

import { useEffect } from 'react';
import { cancelOrder } from '@/actions/orders';

/**
 * Demo bridge — mounts the REAL server action on window so the reading
 * sheet's attack commands run verbatim from the browser console:
 *
 *   await cancelOrder("ord_812")   // signed out          → { refusedBy: 'session' }
 *   await cancelOrder("ord_814")   // someone else's id   → { refusedBy: 'ownership' }
 *
 * The action enforces every layer itself; this bridge grants no access —
 * it only makes the refusal observable, which is the point of the demo.
 */
export default function AttackBridge() {
  useEffect(() => {
    (window as unknown as { cancelOrder: typeof cancelOrder }).cancelOrder = cancelOrder;
  }, []);
  return null;
}
```

**`src/app/(private)/orders/[id]/page.tsx`** — add below the note block:
```tsx
{order.status === 'pending' && <CancelOrderButton orderId={order.id} />}
```

## 8 · Docs updated — the attacks recorded, the refusing lines named

**`docs/AUTH.md`** — actions table and attack table become:

```markdown
## Actions
| Action | Checks, in order | Refusing line |
|---|---|---|
| signInAction | credentials verified; next sanitized pre-redirect | lib/auth.ts / lib/sanitize.ts |
| signOutAction | deletes cookie | actions/auth.ts |
| placeOrder | session re-check → zod re-validation → server re-price → scoped write (userId = session.userId) | actions/orders.ts `if (!session)` |
| cancelOrder | session → ownership via getOrderFor(session.userId, id) → state (pending only) | actions/orders.ts `if (!session)` then `if (!order)` |

## The three attacks
| # | Attack | Expected | Refused by | Status |
|---|---|---|---|---|
| 1 | signed out, console: `await cancelOrder("ord_812")` | refused, not a crash | `if (!session) return { ok:false, refusedBy:'session' }` — src/actions/orders.ts, layer 3a | ✅ PASS |
| 2 | signed in as Selam, console: `await cancelOrder("ord_814")` (Dawit's) | refused on ownership, not on session | `if (!order) return { ok:false, refusedBy:'ownership' }` after the scoped read `getOrderFor(session.userId, orderId)` — layer 3b | ✅ PASS |
| 3 | /signin?next=https://example.com | lands in-app | sanitizeNext() | ✅ PASS |
| + | URL IDOR: /orders/ord_814 as Selam | 404 | scoped query | ✅ PASS |

## Notes
- The AttackBridge client component exposes the real action on `window` so
  the sheet's console commands run verbatim. It grants nothing: the checks
  it exercises live inside the action, not the interface.
- `refusedBy` labels exist so the assessor can SEE which layer refused.
  Production tradeoff: collapse to one generic refusal (and 'not found')
  so error text leaks nothing — recorded here as a deliberate demo choice.
```

**`docs/DATA.md`** — add rows:

```markdown
| Cart lines | client store + localStorage | — | derived totals/badge; snapshot prices | cart never lives on the server (Day 45 table) |
| placeOrder | server action | — | on submit only | re-prices every line from db.json; client prices never trusted |
| cancelOrder | server action | — | on submit only | session + ownership + state checks inside the action |
```

**README verify section** — add:

```bash
# Attack 1 — signed OUT, any page, browser console:
await cancelOrder("ord_812")
# → { ok: false, refusedBy: 'session' }

# Attack 2 — sign in as selam@demo.et, browser console:
await cancelOrder("ord_814")     # Dawit's pending order
# → { ok: false, refusedBy: 'ownership' }

# Happy path — as Selam:
await cancelOrder("ord_812")     # her own pending order
# → { ok: true }  … status flips to cancelled on /orders
```

## 9 · Run and verify this step
1. Add dishes from `/menu` and the dish page → badge count climbs, survives refresh.
2. `/cart` → steppers, remove, derived subtotal → **Continue to checkout**.
3. `/checkout` (signed out → bounced to `/signin?next=/checkout`) → zone picker live-updates fee/ETA/total → **Place order** → lands on `/orders/ord_900…`, cart is empty, status pending.
4. Run attacks 1 and 2 from the console exactly as scripted above; then as Selam cancel `ord_812` from the UI and watch the refusal/success messages — those messages are the named lines, made visible.
5. Confirm Dawit's `ord_814` is untouched (sign in as him) — refused ≠ destroyed.

Next (step 4): the live-data pair — SWR polling on `/orders/[id]` seeded with `fallbackData`, and the debounced search island seeded from the server. Then step 5: the Lighthouse baseline before we touch anything. Say go.

| GET /api/orders/[id] | handler: session → 401; scoped getOrderFor(session.userId, id) → 404 | private read with full checks; does not rely on middleware || GET /api/dishes/search | public by design | menu is public and indexable || advanceOrderStatus | session → role (kitchen) re-checked INSIDE the action → state pipeline | src/actions/kitchen.ts if (session.role !== 'kitchen') |

Attacks table — new row:| + (bonus) | customer console: await advanceOrderStatus("ord_812") | refused on role | role line inside the action | ✅ PASS |
How each number is taken (fixed before measuring)
Measure	Tool & method
LCP, throttled	Chrome Lighthouse, Mobile, Performance, deployed URL — median of 3 runs
CLS	same runs as LCP
First Load JS, /menu	npm run build → the /menu row of the route table
Largest image	DevTools → Network → filter Img, on /menu — largest transfer (next/image variant)
Lighthouse performance	same Lighthouse run as LCP
Budget (record BEFORE now — after this step, before any optimisation)
Measure	Target	Before	After	Cause of change
LCP, throttled	< 2.5s	—	—	—
CLS	< 0.1	—	—	—
First Load JS, /menu	< 120 kB	—	—	—
Largest image	< 150 kB	—	—	—
Lighthouse performance	≥ 90	—	—	—
Planned optimisations — DO NOT TOUCH ANYTHING until Before is recorded
#	Change	Expected cause → effect
1	DishCard → server component; only the Add button stays client (12 client cards today)	less per-card JS → First Load JS on /menu down
2	Search results get their own compact client card	keeps the search live while enabling #1
3	Verify hero priority + sizes on dish page	LCP element resolved early
4	Fonts already next/font + swap + subset — verify CLS ≈ 0	CLS stays under target
5	Optional: dynamic-import AttackBridge on prod paths	trims demo-only JS
README verify section — add:


