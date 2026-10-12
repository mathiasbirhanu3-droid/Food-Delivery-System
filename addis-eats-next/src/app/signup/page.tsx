import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import SignUpForm from '@/features/auth/SignUpForm';
import { getSession } from '@/lib/session-server';
import { getZones } from '@/lib/db';
import { sanitizeNext } from '@/lib/sanitize';

export const metadata: Metadata = {
  title: 'Create account',
  description: 'Create your Addis Eats account — order, track live, and save favorites.',
  robots: { index: false },
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = sanitizeNext(next);

  const session = await getSession();
  if (session) {
    redirect(safeNext !== '/' ? safeNext : '/menu');
  }

  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return <SignUpForm next={safeNext} zones={getZones()} googleEnabled={googleEnabled} />;
}