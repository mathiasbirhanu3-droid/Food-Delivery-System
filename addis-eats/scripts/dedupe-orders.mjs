import fs from 'node:fs';

// Dev utility: removes duplicate order ids from the seed file (keeps the
// first occurrence). Run once: node scripts/dedupe-orders.mjs
const file = new URL('../src/data/db.json', import.meta.url);
const db = JSON.parse(fs.readFileSync(file, 'utf8'));

const seen = new Set();
const before = db.orders.length;
db.orders = db.orders.filter((order) => {
  if (seen.has(order.id)) {
    console.log('removing duplicate:', order.id);
    return false;
  }
  seen.add(order.id);
  return true;
});

fs.writeFileSync(file, JSON.stringify(db, null, 2) + '\n');
console.log(`orders: ${before} -> ${db.orders.length}`);