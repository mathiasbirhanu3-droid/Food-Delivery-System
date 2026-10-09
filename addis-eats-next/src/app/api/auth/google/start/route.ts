import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomHex, toBase64Url } from '@/lib/crypto';
import { sanitizeNext } from '@/lib/sanitize';

const STATE_COOKIE = 'google_oauth';

/**
 * AUTH.md — OAuth start: a 32-byte random state goes into a short-lived
 * HttpOnly cookie (with the sanitized `next`), and we redirect to Google
 * with the exact registered redirect_uri. The cookie is the CSRF defense.
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/signin?error=google_failed', request.nextUrl.origin));
  }

  const next = sanitizeNext(request.nextUrl.searchParams.get('next') ?? '');
  const state = randomHex(32);

  const store = await cookies();
  store.set(
    STATE_COOKIE,
    toBase64Url(new TextEncoder().encode(JSON.stringify({ s: state, n: next }))),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 600, // ten minutes to complete the consent round-trip
    },
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