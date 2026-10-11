'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { hashPassword, verifyCredentials } from '@/lib/auth';
import { clearFailures, registerFailure, remainingLockSeconds } from '@/lib/rate-limit';
import { getUserByEmail } from '@/lib/db';
import { insertUser, recordLoginActivity } from '@/lib/users-store';
import { signUpSchema } from '@/features/auth/schema';
import { sanitizeNext } from '@/lib/sanitize';
import { SESSION_COOKIE, createSessionValue, sessionCookieOptions } from '@/lib/session';

export type AuthState = { error?: string };

function lockMessage(seconds: number): string {
  return `Too many attempts. Try again in about ${Math.max(1, Math.ceil(seconds / 60))} minute(s).`;
}

// AUTH.md — credentials verified server-side; next sanitized BEFORE any
// redirect; failures rate-limited per email; errors stay generic.
// AUDIT: every attempt is recorded (success / wrong-password / locked) —
// failures are logged as 'wrong-password' even for unknown emails, because
// telling them apart in the log would defeat the enumeration defense.
export async function signInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const next = sanitizeNext(String(formData.get('next') ?? ''));

  if (!email || !password) return { error: 'Enter your email and password.' };

  const lockedFor = remainingLockSeconds(email);
  if (lockedFor > 0) {
    recordLoginActivity({ email, outcome: 'locked' });
    return { error: lockMessage(lockedFor) };
  }

  const user = await verifyCredentials(email, password);
  if (!user) {
    const lockAfter = registerFailure(email);
    recordLoginActivity({ email, outcome: 'wrong-password' });
    if (lockAfter > 0) {
      return { error: lockMessage(lockAfter) };
    }
    return { error: 'Email or password is incorrect.' };
  }

  clearFailures(email);
  recordLoginActivity({ email, userId: user.id, outcome: 'success' });

  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionValue(user), sessionCookieOptions());

  const destination = next !== '/' ? next : user.role === 'kitchen' ? '/kitchen' : '/menu';
  redirect(destination);
}

// AUTH.md — role is NEVER taken from client input; the store fixes it to
// 'customer'. Kitchen accounts exist only in the seed. New users are signed
// in immediately with the same flagged cookie, and their registration +
// first login are recorded in the audit trail.
export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const next = sanitizeNext(String(formData.get('next') ?? ''));

  const parsed = signUpSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    zone: formData.get('zone'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, email, phone, zone, password } = parsed.data;

  if (getUserByEmail(email)) {
    return { error: 'An account with this email already exists.' };
  }

  const { passwordHash, passwordSalt } = await hashPassword(password);
  const user = insertUser({
    id: `u_${Date.now().toString(36)}`,
    email,
    name,
    phone,
    defaultZone: zone,
    passwordHash,
    passwordSalt,
  });

  recordLoginActivity({ email: user.email, userId: user.id, outcome: 'success' });

  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionValue(user), sessionCookieOptions());

  redirect(next !== '/' ? next : '/menu');
}

// AUTH.md — signOutAction: clears the session cookie. No body to check,
// nothing to scope — and nothing to audit (logout is not an attempt).
export async function signOutAction() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect('/');
}