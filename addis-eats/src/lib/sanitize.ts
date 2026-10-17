/**
 * The line that stops attack 3 (open redirect via /signin?next=…):
 * "https://example.com" fails startsWith('/'); "//example.com" fails the
 * double-slash guard. Anything suspicious falls back to '/'.
 */
export function sanitizeNext(next: string | null | undefined): string {
  if (!next) return '/';
  if (!next.startsWith('/')) return '/';
  if (next.startsWith('//')) return '/';
  return next;
}