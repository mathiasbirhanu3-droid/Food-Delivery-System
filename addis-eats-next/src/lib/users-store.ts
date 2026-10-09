import dbData from '@/data/db.json';
import type { User } from '@/lib/types';
import { persistDbDev } from '@/lib/persist-dev';

const users = (dbData as unknown as { users: User[] }).users.map((u) => structuredClone(u));

export const getUserByEmail = (email: string): User | null =>
  users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;

export const getUserById = (id: string): User | null =>
  users.find((u) => u.id === id) ?? null;

/** Local sign-up only. Role is never a parameter — the store fixes it to customer. */
export function insertUser(input: {
  id: string; email: string; name: string; phone: string;
  defaultZone: string; passwordHash: string; passwordSalt: string;
}): { id: string; email: string; name: string; role: User['role'] } {
  const user: User = { ...input, role: 'customer' };
  users.push(user);
  persistDbDev({ users });
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export type GoogleResolution =
  | { outcome: 'signed-in'; user: { id: string; email: string; name: string; role: User['role'] } }
  | { outcome: 'password-exists' };

/**
 * Google sign-in resolution — the Auth.js-default linking policy:
 * - an existing LOCAL account (has a password) is never silently linked to an
 *   OAuth identity (blocks account takeover via unverified local emails);
 * - an existing GOOGLE account simply signs in again (profile name refreshed);
 * - a brand-new verified email creates a customer.
 * The role is never taken from the OAuth profile — the store fixes it.
 */
export function resolveGoogleUser(email: string, name: string): GoogleResolution {
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (existing) {
    if (existing.passwordHash) return { outcome: 'password-exists' };
    existing.name = name || existing.name;
    persistDbDev({ users });
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
  return {
    outcome: 'signed-in',
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}