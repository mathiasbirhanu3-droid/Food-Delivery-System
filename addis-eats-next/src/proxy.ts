import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

/**
 * Layer 1 of 3 — proves a session cookie EXISTS, nothing more (that is all a
 * cookie check can prove). Layer 2 (session verified) lives in pages,
 * layer 3 (role / ownership) inside every action. See docs/AUTH.md.
 *
 * Next 16 renamed the middleware convention to proxy — same job, new name.
 * matcher paths are route patterns, not a security boundary: route handlers
 * and pages re-verify everything themselves (see AUTH.md boundary note).
 */
const protectedPaths = [
  /^\/orders(\/|$)/,
  /^\/checkout(\/|$)/,
  /^\/kitchen(\/|$)/,
  /^\/favorites(\/|$)/,
];

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (!protectedPaths.some((re) => re.test(pathname))) return NextResponse.next();
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const signIn = new URL('/signin', request.url);
  signIn.searchParams.set('next', pathname + search);
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: ['/orders/:path*', '/checkout/:path*', '/kitchen/:path*', '/favorites/:path*'],
};