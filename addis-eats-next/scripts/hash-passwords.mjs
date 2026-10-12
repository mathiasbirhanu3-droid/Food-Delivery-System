import fs from 'node:fs';
import crypto from 'node:crypto';

// One-time migration: converts every demoPassword in db.json to a salted
// PBKDF2-SHA256 hash (same format as lib/auth.ts verifies) and removes the
// plaintext. Idempotent — already-hashed users are skipped.
// Run once from the project root:  npm run seed:hash

const file = new URL('../src/data/db.json', import.meta.url);
const db = JSON.parse(fs.readFileSync(file, 'utf8'));

const ITERATIONS = 100000;
let converted = 0;

for (const user of db.users) {
  if (user.passwordHash) continue;
  if (!user.demoPassword) {
    console.log(`skip (no plaintext to migrate): ${user.email}`);
    continue;
  }
  const salt = crypto.randomBytes(16).toString('hex');
  //const digest = crypto.pbkdf2Sync(user.demoPassword, salt, ITERATIONS, 32, 'sha256').toString('hex');
  // was:  crypto.pbkdf2Sync(user.demoPassword, salt, ITERATIONS, 32, 'sha256')
  const digest = crypto.pbkdf2Sync(user.demoPassword, Buffer.from(salt, 'hex'), ITERATIONS, 32, 'sha256').toString('hex');
  user.passwordHash = `pbkdf2-sha256$${ITERATIONS}$${digest}`;
  user.passwordSalt = salt;
  delete user.demoPassword;
  converted += 1;
}

fs.writeFileSync(file, JSON.stringify(db, null, 2) + '\n');
console.log(`hashed ${converted} of ${db.users.length} users — plaintext removed from db.json`);