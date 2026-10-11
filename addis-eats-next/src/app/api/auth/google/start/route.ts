import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomHex, toBase64Url } from '@/lib/crypto';
import { sanitizeNext } from '@/lib/sanitize';

const STATE_COOKIE = 'google_oauth';

/**
 * AUTH.md — OAuth start: a 32-byte random state goes into a short-lived
 * HttpOnly cookie (carrying the sanitized `next`), and we redirect to Google
 * with the exact registered redirect_uri. The cookie is the CSRF defense.
 *
 * Cookie policy: in production the state cookie is SameSite=None; Secure so
 * it survives the cross-site redirect chain through accounts.google.com —
 * with Lax, some browsers drop it on the way back and the callback refuses
 * with google_failed_state. Single-use + 10-minute TTL keep None safe here.
 * In development (http://localhost) Lax is used, because SameSite=None
 * requires Secure, which plain-HTTP localhost cannot carry.
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/signin?error=google_failed', request.nextUrl.origin));
  }

  const next = sanitizeNext(request.nextUrl.searchParams.get('next') ?? '');
  const state = randomHex(32);

  const isProduction = process.env.NODE_ENV === 'production';
  const stateCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    maxAge: 600, // ten minutes to complete the consent round-trip
  };

  const store = await cookies();
  store.set(
    STATE_COOKIE,
    toBase64Url(new TextEncoder().encode(JSON.stringify({ s: state, n: next }))),
    stateCookieOptions,
  );

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', request.nextUrl.origin + '/api/auth/google/callback');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('prompt', 'select_account');

  return NextResponse.redirect(authUrl.toString());
}