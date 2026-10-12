/**
 * The site's absolute URL — one source of truth for metadataBase, sitemap,
 * robots and every absolute link.
 *
 * Resolution order:
 * 1. NEXT_PUBLIC_SITE_URL (explicit, set in Vercel/local env)
 * 2. VERCEL_URL (injected automatically by Vercel into every build —
 *    guarantees correct og/sitemap URLs even if the explicit var is forgotten)
 * 3. localhost (development)
 *
 * Lesson from the localhost-og incident: NEXT_PUBLIC_* vars are inlined at
 * BUILD time — a dashboard change without a redeploy changes nothing. This
 * fallback chain makes the deployment self-correcting regardless.
 */
export const SITE_URL: string =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');