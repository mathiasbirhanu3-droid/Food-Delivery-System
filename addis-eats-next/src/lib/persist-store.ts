import fs from 'node:fs';
import path from 'node:path';

/**
 * Production-grade best-effort persistence for serverless:
 * Vercel's /tmp is writable at runtime. We mirror mutated collections there
 * and rehydrate on cold start, so users/orders/favorites/login-activity
 * survive within an instance's warm lifetime — and often across cold starts
 * on the same lambda. /tmp is NOT shared between different instances and is
 * cleared between deployments — documented honestly in DATA.md.
 */
const CACHE_FILE = path.join('/tmp', 'addis-eats-state.json');

interface StateShape {
  users?: unknown[];
  orders?: unknown[];
  favorites?: unknown[];
  announcements?: unknown[];
  loginActivity?: unknown[];
  savedAt?: string;
}

export function saveState(patch: StateShape): void {
  if (process.env.NODE_ENV !== 'production') return; // dev uses persistDbDev → db.json
  try {
    const current = readState();
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ ...current, ...patch, savedAt: new Date().toISOString() }));
  } catch {
    /* /tmp unavailable — silently continue in-memory (documented) */
  }
}

export function readState(): StateShape {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) as StateShape;
  } catch {
    return {};
  }
}