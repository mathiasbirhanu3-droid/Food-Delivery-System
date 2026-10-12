import { getUserByEmail } from '@/lib/db';
import type { User } from '@/lib/types';
import { PBKDF2_ITERATIONS, pbkdf2Sha256, randomHex, timingSafeEqual } from '@/lib/crypto';

export type SafeUser = Pick<User, 'id' | 'email' | 'name' | 'role'>;

/**
 * passwordHash format: "pbkdf2-sha256$<iterations>$<hex digest>", salt kept
 * separately in passwordSalt. Embedding the iteration count lets us raise
 * the work factor later without breaking existing users.
 */

const DUMMY_SALT = 'ab'.repeat(16);

/** Constant-work path for unknown emails — sign-in timing never reveals
 *  whether an email exists. */
async function burnCycle(): Promise<void> {
  await pbkdf2Sha256('timing-equalizer', DUMMY_SALT);
}

export async function hashPassword(
  password: string,
): Promise<{ passwordHash: string; passwordSalt: string }> {
  const passwordSalt = randomHex(16);
  const digest = await pbkdf2Sha256(password, passwordSalt);
  return { passwordHash: `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${digest}`, passwordSalt };
}

export async function verifyCredentials(email: string, password: string): Promise<SafeUser | null> {
  const user = getUserByEmail(email);
  if (!user?.passwordHash || !user.passwordSalt) {
    await burnCycle();
    return null;
  }

  const [algo, iterationsRaw, digest] = user.passwordHash.split('$');
  const iterations = Number(iterationsRaw) || PBKDF2_ITERATIONS;
  if (algo !== 'pbkdf2-sha256' || !digest) {
    await burnCycle();
    return null;
  }

  const candidate = await pbkdf2Sha256(password, user.passwordSalt, iterations);
  if (!timingSafeEqual(candidate, digest)) return null;

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}