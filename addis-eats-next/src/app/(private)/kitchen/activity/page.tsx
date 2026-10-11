import type { Metadata } from 'next';
import { getLoginActivity } from '@/lib/users-store';
import KitchenNav from '@/components/KitchenNav';
import { requireKitchen } from '@/features/auth/guards';

export const metadata: Metadata = { title: 'Kitchen · Login activity', robots: { index: false } };

const OUTCOME_STYLE: Record<string, string> = {
  success: 'bg-primary/15 text-primary',
  google: 'bg-blue-500/15 text-blue-600 dark:text-blue-300',
  'wrong-password': 'bg-accent/10 text-accent',
  locked: 'bg-accent/20 text-accent font-bold',
};

export default async function LoginActivityPage() {
  await requireKitchen('/kitchen/activity');
  const activity = getLoginActivity();

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Login activity</h1>
      <KitchenNav current="/kitchen/activity" />
      <p className="mt-4 text-sm text-ink/60 dark:text-cream/60">
        Audit trail of sign-in attempts — newest first, kept for the last {activity.length} events.
      </p>

      {activity.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-ink/20 p-10 text-center text-ink/60 dark:border-cream/20 dark:text-cream/60">
          No login attempts recorded yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {activity.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border border-ink/10 bg-white p-3 text-sm dark:border-cream/10 dark:bg-white/5">
              <div className="min-w-0">
                <p className="truncate font-medium">{entry.email}</p>
                <p className="text-xs text-ink/50 dark:text-cream/50">
                  {new Date(entry.at).toLocaleString()}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${OUTCOME_STYLE[entry.outcome] ?? 'bg-ink/10 text-ink/60'}`}>
                {entry.outcome}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}