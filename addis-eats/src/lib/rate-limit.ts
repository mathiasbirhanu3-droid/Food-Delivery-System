/**
 * Brute-force protection: 5 failed sign-ins per email per 15-minute window,
 * then a 15-minute lock. In-memory by design — per-instance on serverless
 * (documented in docs/DATA.md). Keys are normalized lowercase emails.
 */
interface Attempt {
  count: number;
  windowStart: number;
  lockedUntil: number;
}

const attempts = new Map<string, Attempt>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;

/** Seconds remaining on an active lock, 0 if none. */
export function remainingLockSeconds(key: string): number {
  const entry = attempts.get(key);
  if (!entry) return 0;
  const now = Date.now();
  if (entry.lockedUntil > now) return Math.ceil((entry.lockedUntil - now) / 1000);
  return 0;
}

/** Records a failure; returns lock seconds now in force (0 if not locked). */
export function registerFailure(key: string): number {
  const now = Date.now();
  const entry = attempts.get(key) ?? { count: 0, windowStart: now, lockedUntil: 0 };

  if (now - entry.windowStart > WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }

  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCK_MS;
    attempts.set(key, entry);
    return Math.ceil(LOCK_MS / 1000);
  }

  attempts.set(key, entry);
  return 0;
}

export function clearFailures(key: string): void {
  attempts.delete(key);
}