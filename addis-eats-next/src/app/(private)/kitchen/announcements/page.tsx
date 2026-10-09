import type { Metadata } from 'next';
import Link from 'next/link';
import { listAllAnnouncements } from '@/lib/announcements-store';
import { createAnnouncement, deleteAnnouncement, toggleAnnouncement } from '@/actions/kitchen';
import ConfirmSubmit from '@/features/kitchen/ConfirmSubmit';
import KitchenNav from '@/components/KitchenNav';
import { requireKitchen } from '@/features/auth/guards';

export const metadata: Metadata = { title: 'Kitchen · Announcements', robots: { index: false } };

const input = 'w-full rounded-xl border border-ink/15 px-3 py-2 text-sm dark:border-cream/20 dark:bg-white/5';

export default async function KitchenAnnouncementsPage() {
  await requireKitchen('/kitchen/announcements');
  const announcements = listAllAnnouncements();

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Announcements</h1>
      <KitchenNav current="/kitchen/announcements" />
      <p className="mt-4 text-sm text-ink/60 dark:text-cream/60">
        These scroll in the marketing strip under the header. Pause to hide one without deleting it — the strip updates instantly.
      </p>

      <form action={createAnnouncement} className="mt-6 space-y-3 rounded-2xl border border-ink/10 p-4 dark:border-cream/10">
        <label className="block text-sm font-medium">
          Message <span className="font-normal text-ink/40">(≤ 140 chars)</span>
          <input
            name="message" required maxLength={140}
            placeholder="Timket week — free buna with every platter 🎉"
            className={`mt-1 ${input}`}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Tone
            <select name="tone" className={`mt-1 ${input}`} defaultValue="festival">
              <option value="festival">festival</option>
              <option value="deal">deal</option>
              <option value="info">info</option>
            </select>
          </label>
          <label className="block text-sm font-medium">
            Link <span className="font-normal text-ink/40">(internal, optional)</span>
            <input name="href" placeholder="/menu?category=Ethiopian" className={`mt-1 ${input}`} />
          </label>
        </div>
        <button type="submit" className="rounded-full bg-primary px-5 py-2 font-semibold text-white">
          Announce
        </button>
      </form>

      <ul className="mt-8 space-y-3">
        {announcements.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white p-4 dark:border-cream/10 dark:bg-white/5"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold">{a.message}</p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    a.active
                      ? 'bg-primary/15 text-primary'
                      : 'bg-ink/10 text-ink/50 dark:bg-cream/10 dark:text-cream/50'
                  }`}
                >
                  {a.active ? '● live' : '⏸ paused'}
                </span>
              </div>
              <p className="text-xs text-ink/50 dark:text-cream/50">
                {a.tone}
                {a.href ? <> · <Link href={a.href} className="underline">{a.href}</Link></> : null}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <form action={toggleAnnouncement}>
                <input type="hidden" name="id" value={a.id} />
                <button
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold text-white ${
                    a.active ? 'bg-ink/60 hover:bg-ink' : 'bg-primary hover:bg-primary-600'
                  }`}
                >
                  {a.active ? 'Hide' : 'Activate'}
                </button>
              </form>
              <form action={deleteAnnouncement}>
                <input type="hidden" name="id" value={a.id} />
                <ConfirmSubmit label="Delete" message={`Delete “${a.message}”?`} />
              </form>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}