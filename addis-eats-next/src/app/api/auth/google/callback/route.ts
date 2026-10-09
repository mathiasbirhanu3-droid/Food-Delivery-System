import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, createSessionValue, sessionCookieOptions } from '@/lib/session';
import { resolveGoogleUser } from '@/lib/users-store';
import { sanitizeNext } from '@/lib/sanitize';
import { fromBase64Url, timingSafeEqual } from '@/lib/crypto';

const STATE_COOKIE = 'google_oauth';

function backTo(request: NextRequest, error: string): NextResponse {
  return NextResponse.redirect(new URL(`/signin?error=${error}`, request.nextUrl.origin));
}

/**
 * AUTH.md — OAuth callback. Checks, in order:
 * 1. state cookie vs query param (constant-time) — CSRF refused HERE
 * 2. code exchange over TLS with Google's token endpoint
 * 3. id_token claims: iss / aud / exp — the token arrived directly from the
 *    token endpoint, so transport validation suffices (OIDC §3.1.3.7)
 * 4. email_verified === true — only verified Google emails proceed
 * 5. linking policy: existing password accounts are refused, never linked
 * 6. our flagged session cookie is issued — same session system as passwords
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return backTo(request, 'google_failed');

  const params = request.nextUrl.searchParams;
  if (params.get('error')) return backTo(request, 'google_denied');

  const code = params.get('code');
  const state = params.get('state');
  if (!code || !state) return backTo(request, 'google_failed');

  const store = await cookies();
  const raw = store.get(STATE_COOKIE)?.value;
  store.delete(STATE_COOKIE); // single-use, whatever happens next
  if (!raw) return backTo(request, 'google_failed');

  let carried: { s?: string; n?: string };
  try {
    carried = JSON.parse(new TextDecoder().decode(fromBase64Url(raw)));
  } catch {
    return backTo(request, 'google_failed');
  }
  if (!carried.s || !timingSafeEqual(carried.s, state)) return backTo(request, 'google_failed');
  const next = sanitizeNext(carried.n ?? '');

  // ── token exchange ──────────────────────────────────────────────────
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: request.nextUrl.origin + '/api/auth/google/callback',
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenRes.ok) return backTo(request, 'google_failed');

  const tokens = (await tokenRes.json()) as { id_token?: string };
  if (!tokens.id_token) return backTo(request, 'google_failed');

  // ── id_token claims ─────────────────────────────────────────────────
  let claims: {
    iss?: string; aud?: string; exp?: number;
    email?: string; email_verified?: boolean; name?: string;
  };
  try {
    claims = JSON.parse(new TextDecoder().decode(fromBase64Url(tokens.id_token.split('.')[1])));
  } catch {
    return backTo(request, 'google_failed');
  }

  const issOk = claims.iss === 'https://accounts.google.com' || claims.iss === 'accounts.google.com';
  const expOk = typeof claims.exp === 'number' && claims.exp > Date.now() / 1000;
  if (!issOk || claims.aud !== clientId || !expOk) return backTo(request, 'google_failed');
  if (claims.email_verified !== true || !claims.email) return backTo(request, 'google_failed');

  // ── find or create the account (linking policy) ─────────────────────
  const result = resolveGoogleUser(claims.email, claims.name ?? claims.email);
  if (result.outcome === 'password-exists') return backTo(request, 'google_link');

  // ── our flagged session — identical to password sign-in ─────────────
  const sessionStore = await cookies();
  sessionStore.set(SESSION_COOKIE, await createSessionValue(result.user), sessionCookieOptions());

  const destination = next !== '/' ? next : '/menu';
  return NextResponse.redirect(new URL(destination, request.nextUrl.origin));
}