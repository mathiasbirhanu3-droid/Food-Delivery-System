import type { Dish } from '@/lib/types';

/** Hosts configured in next.config.mjs — keep the two lists in sync. */
const ALLOWED_HOSTS = new Set([
  'images.unsplash.com',
  'i.pinimg.com',
  'images.pexels.com',
]);

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1080&auto=format&fit=crop';

/**
 * Returns the dish image if its host is allow-listed by next/image, else the
 * fallback. Resilience rule: a kitchen paste with an unknown host must never
 * crash the menu render — the optimizer would otherwise throw at render time.
 */
export function resolveDishImage(src: string | undefined): string {
  if (!src) return FALLBACK_IMAGE;
  try {
    const hostname = new URL(src).hostname;
    return ALLOWED_HOSTS.has(hostname) ? src : FALLBACK_IMAGE;
  } catch {
    return FALLBACK_IMAGE; // not even a valid URL — kitchen fat-fingered it
  }
}

/** Convenience for server components that want a whole dish back. */
export function withResolvedImage(dish: Dish): Dish {
  return { ...dish, image: resolveDishImage(dish.image) };
}