'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signInAction, type AuthState } from '@/actions/auth';

const inputClass =
  'mt-1.5 w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-ink/40 focus:border-primary dark:border-cream/20 dark:bg-white/5 dark:placeholder:text-cream/40';

export default function SignInForm({
  next,
  googleEnabled,
  oauthError,
}: {
  next: string;
  googleEnabled: boolean;
  oauthError?: string;
}) {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(signInAction, {});

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-3xl font-bold">Welcome back</h1>
      <p className="mt-2 text-ink/70 dark:text-cream/70">
        Sign in to order, track your delivery live, and keep your history.
      </p>

      {oauthError && (
        <p role="alert" className="mt-4 rounded-xl bg-accent/10 p-3 text-sm font-medium text-accent">
          {oauthError}
        </p>
      )}

      {googleEnabled && (
        <>
          <a
            href={`/api/auth/google/start${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-full border border-ink/15 bg-white py-3 text-sm font-semibold text-ink transition hover:border-ink/30 dark:border-cream/20 dark:bg-white/5 dark:text-cream"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            Continue with Google
          </a>
          <div className="my-6 flex items-center gap-3 text-xs text-ink/40 dark:text-cream/40" aria-hidden="true">
            <span className="h-px flex-1 bg-ink/10 dark:bg-cream/10" />
            or
            <span className="h-px flex-1 bg-ink/10 dark:bg-cream/10" />
          </div>
        </>
      )}

      <form action={formAction} className={googleEnabled ? 'space-y-4' : 'mt-8 space-y-4'} noValidate>
        <input type="hidden" name="next" value={next} />

        <label className="block text-sm font-medium">
          Email
          <input type="email" name="email" autoComplete="email" required placeholder="you@example.et" className={inputClass} />
        </label>

        <label className="block text-sm font-medium">
          Password
          <input type="password" name="password" autoComplete="current-password" required placeholder="••••••••" className={inputClass} />
        </label>

        {state.error && <p role="alert" className="text-sm font-medium text-accent">{state.error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-full bg-primary py-3 font-semibold text-white hover:bg-primary-600 disabled:opacity-60"
        >
          {isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60 dark:text-cream/60">
        New here?{' '}
        <Link
          href={next !== '/' ? `/signup?next=${encodeURIComponent(next)}` : '/signup'}
          className="font-semibold text-primary hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}