/**
 * The site's absolute URL — one source of truth for metadataBase, sitemap,
 * robots and every absolute link (og:image, share cards).
 *
 * Resolution order:
 * 1. NEXT_PUBLIC_SITE_URL (if set — full control, overrides everything)
 * 2. PRODUCTION: hardcoded deployment URL — the known truth. This exists
 *    because NEXT_PUBLIC_* vars are inlined at BUILD time, and a missing or
 *    mistyped dashboard var silently baked localhost into every share card
 *    (the localhost-og incident). The deployment URL is a fact, not config.
 * 3. DEVELOPMENT: localhost:3000
 */
export const SITE_URL: string =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  (process.env.NODE_ENV === 'production'
    ? 'https://food-delivery-system-sigma-pink.vercel.app'
    : 'http://localhost:3000');