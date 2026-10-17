export { formatETB } from '@/lib/format';

const etb = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'ETB', minimumFractionDigits: 0, maximumFractionDigits: 2,
});

/** Feature 26 — prices are consistently formatted as Ethiopian Birr. */


/** Kept as a compatibility shim — all formatting now lives in lib/format.ts. */
