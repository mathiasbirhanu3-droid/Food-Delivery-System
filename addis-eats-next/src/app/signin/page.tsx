import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import SignInForm from '@/features/auth/SignInForm';
import { getSession } from '@/lib/session-server';
import { sanitizeNext } from '@/lib/sanitize';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to Addis Eats to place orders, track them live, and keep your order history.',
  robots: { index: false },
};

const OAUTH_ERRORS: Record<string, string> = {
  google_denied: 'Google sign-in was cancelled — no problem, try again.',
  google_link: 'This email already has a password account. Sign in with your password.',
  google_failed: 'Google sign-in could not complete. Please try again.',
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const safeNext = sanitizeNext(next);

  const session = await getSession();
  if (session) {
    redirect(safeNext !== '/' ? safeNext : session.role === 'kitchen' ? '/kitchen' : '/menu');
  }

  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const oauthError = error ? OAUTH_ERRORS[error] : undefined;

  return <SignInForm next={safeNext} googleEnabled={googleEnabled} oauthError={oauthError} />;
}