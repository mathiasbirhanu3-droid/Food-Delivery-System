import Link from 'next/link';
import { getSession } from '@/lib/session-server';
import { getActiveAnnouncements } from '@/lib/db';
import { listAllAnnouncements } from '@/lib/announcements-store';
import type { Announcement } from '@/lib/types';

const TONES: Record<Announcement['tone'], { bg: string; chip: string }> = {
  festival: {
    bg: 'bg-gradient-to-r from-accent-700 via-accent to-gold',
    chip: '🎉 Festival',
  },
  deal: {
    bg: 'bg-gradient-to-r from-primary-800 via-primary-600 to-primary-400',
    chip: '🔥 Deal',
  },
  info: {
    bg: 'bg-gradient-to-r from-ink via-ink to-ink/80',
    chip: '📣 Notice',
  },
};

/**
 * The marketing strip — pure CSS motion (marquee + sheen), server-rendered,
 * zero JavaScript.
 *
 * - Items repeat enough times that the track always exceeds the viewport, so
 *   the loop is seamless with no dead space; gradient masks on both edges
 *   make items glide in from off-screen instead of hard-clipping.
 * - Customers see nothing when everything is paused; kitchen admins instead
 *   see an explicit empty-state bar, so the Hide/Activate effect is visible
 *   to the person who caused it.
 * - The left pill shows the tone chip, and for admins also the live/paused
 *   status of the full announcement list.
 */
export default async function AnnouncementBar() {
  const [items, all, session] = await Promise.all([
    getActiveAnnouncements(),
    listAllAnnouncements(),
    getSession(),
  ]);

  const isAdmin = session?.role === 'kitchen';

  // Nothing live: customers get no strip at all; admins get the state bar.
  if (items.length === 0) {
    if (!isAdmin) return null;
    return (
      <div className="border-y border-ink/10 bg-ink/5 py-2 text-center text-xs font-semibold text-ink/50 dark:border-cream/10 dark:bg-cream/5 dark:text-cream/50">
        ⏸ All announcements paused — resume one in Kitchen → Announcements
      </div>
    );
  }

  const pausedCount = all.filter((a) => !a.active).length;
  const tone = TONES[items[0].tone] ?? TONES.info;

  // Fill guarantee: enough item-slots per half that the track always exceeds
  // the viewport; the half is duplicated for the seamless 0 → -50% loop.
  // Copies after the first are aria-hidden, so screen readers hear each
  // message exactly once.
  const reps = Math.max(2, Math.ceil(6 / items.length));
  const track = Array.from({ length: reps * 2 }).flatMap((_, copy) =>
    items.map((item) => ({ item, copy })),
  );

  return (
    <section aria-label="Announcements" className="relative isolate">
      <div className={`relative overflow-hidden border-y border-white/10 ${tone.bg}`}>
        {/* scrolling viewport — mask makes items fade at both edges */}
        <div className="marquee-viewport">
          <div className="marquee-track">
            {track.map(({ item, copy }) => (
              <span
                key={`${item.id}-${copy}`}
                aria-hidden={copy > 0 ? true : undefined}
                className="marquee-item text-white"
              >
                {item.href ? (
                  <Link
                    href={item.href}
                    tabIndex={copy > 0 ? -1 : 0}
                    className="underline decoration-white/40 underline-offset-4 transition hover:decoration-white"
                  >
                    {item.message} →
                  </Link>
                ) : (
                  item.message
                )}
                <span className="mx-7 text-white/50" aria-hidden="true">
                  ✦
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* slow light sweep — the "premium" touch */}
        <div className="strip-sheen" aria-hidden="true" />

        {/* anchored label pill — admins also see live/paused status */}
        <div className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
          {isAdmin
            ? pausedCount > 0
              ? `${tone.chip} · ${pausedCount} paused`
              : `${tone.chip} · all live`
            : tone.chip}
        </div>
      </div>
    </section>
  );
}