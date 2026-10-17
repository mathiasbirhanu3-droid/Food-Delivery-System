import fs from 'node:fs';
import crypto from 'node:crypto';

// One-shot repair: re-hashes the seeded demo accounts with the salt encoding
// the app expects (hex DECODED to raw bytes). The original hash-passwords.mjs
// passed the hex STRING, which Node treated as 32 UTF-8 bytes — so migrated
// accounts could never verify. Run with the dev server STOPPED:
//   node scripts/fix-demo-passwords.mjs
const file = new URL('../src/data/db.json', import.meta.url);
const db = JSON.parse(fs.readFileSync(file, 'utf8'));

const RESETS = [
  { email: 'kitchen@demo.et', password: 'kitchen1234' },
  { email: 'selam@demo.et', password: 'demo1234' },
  { email: 'dawit@demo.et', password: 'demo1234' },
];

const ITERATIONS = 100000;

for (const reset of RESETS) {
  const user = db.users.find((u) => u.email === reset.email);
  if (!user) {
    console.log('not found:', reset.email);
    continue;
  }
  const salt = crypto.randomBytes(16); // raw 16 bytes — matches lib/crypto.ts hexToBytes
  const digest = crypto.pbkdf2Sync(reset.password, salt, ITERATIONS, 32, 'sha256');
  user.passwordSalt = salt.toString('hex');
  user.passwordHash = `pbkdf2-sha256$${ITERATIONS}$${digest.toString('hex')}`;
  delete user.demoPassword;
  console.log('re-hashed:', reset.email);
}

fs.writeFileSync(file, JSON.stringify(db, null, 2) + '\n');
console.log('done — start the dev server, then sign in with the README passwords');