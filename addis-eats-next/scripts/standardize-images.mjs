import fs from 'node:fs';

// One-shot: standardizes every dish image URL in db.json to the
// bot-friendly, optimizer-friendly pattern:
//   https://images.unsplash.com/photo-<ID>?q=70&w=1080&auto=format&fit=crop
//
// - pinimg.com URLs are replaced (Pinterest blocks server-side fetchers —
//   the root cause of the 3,024 ms LCP resource-load phase)
// - Unsplash URLs keep their photo ID but get the standard params
// - other hosts (pexels) are left alone
//
// Run with the dev server STOPPED:  node scripts/standardize-images.mjs

const file = new URL('../src/data/db.json', import.meta.url);
const db = JSON.parse(fs.readFileSync(file, 'utf8'));

const PARAMS = 'q=70&w=1080&auto=format&fit=crop';

// Known pinimg dishes → Unsplash equivalents (adjust if you prefer others)
const PINIMG_MAP = {
  'doro-wat':  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
  'sega-tibs': 'https://images.unsplash.com/photo-1544025162-d76694265947',
};

// Category defaults for any unmapped pinimg URL
const CATEGORY_FALLBACK = {
  Ethiopian: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
  Pizza:     'https://images.unsplash.com/photo-1513104890138-7c749659a591',
  Burgers:   'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
  Drinks:    'https://images.unsplash.com/photo-1546173159-315724a31696',
};

function standardize(url, dish) {
  if (!url) {
    const base = CATEGORY_FALLBACK[dish.category] ?? CATEGORY_FALLBACK.Ethiopian;
    return `${base}?${PARAMS}`;
  }
  if (url.includes('pinimg.com')) {
    const base = PINIMG_MAP[dish.id] ?? CATEGORY_FALLBACK[dish.category] ?? CATEGORY_FALLBACK.Ethiopian;
    return `${base}?${PARAMS}`;
  }
  if (url.includes('unsplash.com')) {
    return `${url.split('?')[0]}?${PARAMS}`;   // keep the photo, fix the params
  }
  return url; // pexels and other allowed hosts — optimizer handles them
}

let changed = 0;
for (const dish of db.dishes) {
  const next = standardize(dish.image, dish);
  if (next !== dish.image) {
    console.log(`${dish.id}:\n  was: ${dish.image}\n  now: ${next}`);
    dish.image = next;
    changed++;
  }
}

fs.writeFileSync(file, JSON.stringify(db, null, 2) + '\n');
console.log(`\nstandardized ${changed} of ${db.dishes.length} dish images`);