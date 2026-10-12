import dbData from '@/data/db.json';
import type { User } from '@/lib/types';
import { persistDbDev } from '@/lib/persist-dev';
import { readState, saveState } from '@/lib/persist-store';

interface LoginActivity {
  id: string;
  email: string;
  userId?: string;
  at: string;
  outcome: 'success' | 'wrong-password' | 'unknown-email' | 'locked' | 'google';
  ip?: string;
  userAgent?: string;
}

/**
 * Users store — seeded from db.json, then rehydrated from the /tmp cache
 * (production) so warm instances keep signed-up users and login activity.
 * In dev, persistDbDev writes back to db.json itself.
 */
const seeded = (dbData as unknown as { users: User[] }).users.map((u) => structuredClone(u));
const cached = readState() as { users?: User[]; loginActivity?: LoginActivity[] };

// Cold-start rehydration: cached users (sign-ups) merge over the seed by id.
const users: User[] = [...seeded];
for (const cachedUser of cached.users ?? []) {
  const index = users.findIndex((u) => u.id === cachedUser.id);
  if (index >= 0) users[index] = cachedUser;
  else users.push(cachedUser);
}

// Login activity lives ONLY in the cache/store — never in the seed file.
let loginActivity: LoginActivity[] = cached.loginActivity ?? [];
const ACTIVITY_LIMIT = 200; // keep the last 200 events — enough for demo review

export const getUserByEmail = (email: string): User | null =>
  users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;

export const getUserById = (id: string): User | null =>
  users.find((u) => u.id === id) ?? null;

/** Sign-up only. Role is never a parameter — the store fixes it to customer. */
export function insertUser(input: {
  id: string; email: string; name: string; phone: string;
  defaultZone: string; passwordHash: string; passwordSalt: string;
}): { id: string; email: string; name: string; role: User['role'] } {
  const user: User = { ...input, role: 'customer', provider: 'local' };
  users.push(user);
  persistDbDev({ users });   // dev → db.json
  saveState({ users });      // prod → /tmp cache
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export type GoogleResolution =
  | { outcome: 'signed-in'; user: { id: string; email: string; name: string; role: User['role'] } }
  | { outcome: 'password-exists' };

export function resolveGoogleUser(email: string, name: string): GoogleResolution {
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (existing) {
    if (existing.passwordHash) return { outcome: 'password-exists' };
    existing.name = name || existing.name;
    persistDbDev({ users });
    saveState({ users });
    return {
      outcome: 'signed-in',
      user: { id: existing.id, email: existing.email, name: existing.name, role: existing.role },
    };
  }

  const user: User = {
    id: `u_${Date.now().toString(36)}`,
    email: email.toLowerCase(),
    name: name || email,
    role: 'customer',
    provider: 'google',
  };
  users.push(user);
  persistDbDev({ users });
  saveState({ users });
  return {
    outcome: 'signed-in',
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}

// ── login activity (the audit trail) ────────────────────────────────

/** Records one login attempt. Called from the auth actions — never from UI. */
export function recordLoginActivity(entry: {
  email: string;
  userId?: string;
  outcome: LoginActivity['outcome'];
  ip?: string;
  userAgent?: string;
}): void {
  loginActivity.unshift({
    id: `act_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
    ...entry,
  });
  loginActivity = loginActivity.slice(0, ACTIVITY_LIMIT);
  saveState({ loginActivity });
  persistDbDev({ loginActivity }); // dev → db.json (optional; see note)
}

/** Kitchen/admin view — the audit trail, newest first. */
export const getLoginActivity = (): LoginActivity[] => loginActivity;