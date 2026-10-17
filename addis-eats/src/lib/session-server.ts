import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionValue, type Session } from '@/lib/session';

/** Layer 2 helper — call in pages and actions. Returns null when signed out. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return verifySessionValue(store.get(SESSION_COOKIE)?.value);
}