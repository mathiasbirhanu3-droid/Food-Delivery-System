import { getRestaurant } from '@/lib/db';

export default function Footer() {
  const r = getRestaurant();
  return (
    <footer className="mt-8 border-t border-ink/10 py-10 dark:border-cream/10">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-3">
        <div>
          <p className="font-display font-bold">{r.name}</p>
          <p className="mt-1 text-sm text-ink/60 dark:text-cream/60">{r.tagline}</p>
        </div>
        <div className="text-sm text-ink/60 dark:text-cream/60">
          <p className="font-semibold text-ink dark:text-cream">Visit</p>
          <p>{r.address}</p><p>{r.phone}</p><p>{r.hours}</p>
        </div>
        <div className="text-sm text-ink/60 dark:text-cream/60">
          <p className="font-semibold text-ink dark:text-cream">Delivering to</p>
          <p>{r.zones.join(' · ')}</p>
        </div>
      </div>
    </footer>
  );
}