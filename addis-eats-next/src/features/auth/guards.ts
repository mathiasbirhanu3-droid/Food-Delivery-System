import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/session-server';
import { sanitizeNext } from '@/lib/sanitize';
import type { Session } from '@/lib/session';

/**
 * Layer 2 guards — the Next.js replacement for the Day 35 RequireAuth /
 * RequireAdmin client components. Client guards are rejected on purpose:
 * they can be bypassed and protect nothing. These run on the server,
 * before any data is read. Every private page calls one as its FIRST line.
 */

/** Any signed-in user (customer or kitchen). */
export async function requireSession(next: string): Promise<Session> {
  const session = await getSession();
  if (!session) {
    // sanitizeNext is belt-and-braces: `next` is always an internal path today.
    redirect(`/signin?next=${encodeURIComponent(sanitizeNext(next))}`);
  }
  return session;
}

/** Kitchen only. Wrong role gets a 404 — never a "forbidden" page that confirms the route exists. */
export async function requireKitchen(next = '/kitchen'): Promise<Session> {
  const session = await requireSession(next);
  if (session.role !== 'kitchen') notFound(); // ← role refused HERE (layer 2)
  return session;
}