import { fromBase64Url, hmacSha256, timingSafeEqual, toBase64Url } from '@/lib/crypto';

export const SESSION_COOKIE = 'addis_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // one week

export type SessionRole = 'customer' | 'kitchen';
export type Session = { userId: string; role: SessionRole; name: string; exp: number };

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET is required in production.');
  }
  return secret ?? 'dev-only-insecure-secret-change-me';
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,                                 // AUTH.md — unreadable by JavaScript
    secure: process.env.NODE_ENV === 'production',  // AUTH.md — HTTPS-only in production
    sameSite: 'lax' as const,                       // AUTH.md — CSRF-resistant for top-level nav
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  };
}

export async function createSessionValue(user: { id: string; role: SessionRole; name: string }): Promise<string> {
  const payload = { id: user.id, role: user.role, name: user.name, iat: Date.now(), exp: Date.now() + SESSION_TTL_SECONDS * 1000 };
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const mac = await hmacSha256(getSecret(), new TextEncoder().encode(body));
  return `${body}.${toBase64Url(mac)}`;
}

export async function verifySessionValue(token: string | undefined | null): Promise<Session | null> {
  if (!token || !token.includes('.')) return null;
  const [body, mac] = token.split('.');
  const expected = toBase64Url(await hmacSha256(getSecret(), new TextEncoder().encode(body)));
  if (!timingSafeEqual(mac, expected)) return null; // AUTH.md — forged cookie refused HERE
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body)));
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    return { userId: payload.id, role: payload.role, name: payload.name, exp: payload.exp };
  } catch {
    return null;
  }
}