import Link from 'next/link';
import { CATEGORIES } from '@/features/menu/categories';

/**
 * Menu categories — rendered as a LEFT COLUMN on desktop (sticky, with live
 * dish counts) and as horizontal scroll chips on mobile (thumb-friendly).
 * The sort controls live under a divider at the bottom of the same nav.
 * All state stays in the URL (?category= & ?sort=) — shareable, refresh-safe.
 */
export default function CategoryBar({
  active,
  sort,
  counts,
}: {
  active?: string;
  sort?: string;
  counts: Record<string, number>;
}) {
  const item = (isActive: boolean) =>
    `flex items-center justify-between gap-2 whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-medium transition ${
      isActive
        ? 'border-primary bg-primary text-white'
        : 'border-ink/15 hover:border-primary hover:text-primary dark:border-cream/20'
    }`;

  const countBadge = (isActive: boolean, n: number) => (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
        isActive ? 'bg-white/20 text-white' : 'bg-ink/5 text-ink/50 dark:bg-cream/10 dark:text-cream/50'
      }`}
    >
      {n}
    </span>
  );

  const hrefFor = (category?: string) =>
    category
      ? `/menu?category=${encodeURIComponent(category)}${sort ? `&sort=${sort}` : ''}`
      : '/menu';

  return (
    <nav
      aria-label="Menu categories"
      className="flex gap-2 overflow-x-auto pb-1 sm:flex-col sm:overflow-visible sm:pb-0"
    >
      <Link href={hrefFor()} className={item(!active)} aria-current={!active ? 'page' : undefined}>
        <span>All dishes</span>
        {countBadge(!active, counts.all ?? 0)}
      </Link>

      {CATEGORIES.map((c) => (
        <Link
          key={c}
          href={hrefFor(c)}
          className={item(active === c)}
          aria-current={active === c ? 'page' : undefined}
        >
          <span>{c}</span>
          {countBadge(active === c, counts[c] ?? 0)}
        </Link>
      ))}

      {/* sort controls — same axis family, separated by a divider */}
      <div className="mt-2 hidden gap-2 border-t border-ink/10 pt-3 sm:flex sm:flex-col dark:border-cream/10">
        <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-ink/40 dark:text-cream/40">
          Sort by
        </p>
        <Link
          href={active ? `/menu?category=${encodeURIComponent(active)}` : '/menu'}
          className={`rounded-xl px-4 py-1.5 text-sm font-medium transition ${
            !sort ? 'bg-ink/5 font-semibold text-ink dark:bg-cream/10 dark:text-cream' : 'text-ink/60 hover:text-primary dark:text-cream/60'
          }`}
          aria-current={!sort ? 'page' : undefined}
        >
          ★ Featured
        </Link>
        <Link
          href={active ? `/menu?category=${encodeURIComponent(active)}&sort=loved` : '/menu?sort=loved'}
          className={`rounded-xl px-4 py-1.5 text-sm font-medium transition ${
            sort === 'loved' ? 'bg-ink/5 font-semibold text-ink dark:bg-cream/10 dark:text-cream' : 'text-ink/60 hover:text-primary dark:text-cream/60'
          }`}
          aria-current={sort === 'loved' ? 'page' : undefined}
        >
          ❤ Most loved
        </Link>
        <Link
          href={active ? `/menu?category=${encodeURIComponent(active)}&sort=offers` : '/menu?sort=offers'}
          className={`rounded-xl px-4 py-1.5 text-sm font-medium transition ${
            sort === 'offers' ? 'bg-ink/5 font-semibold text-ink dark:bg-cream/10 dark:text-cream' : 'text-ink/60 hover:text-primary dark:text-cream/60'
          }`}
          aria-current={sort === 'offers' ? 'page' : undefined}
        >
          % Offers
        </Link>
      </div>
    </nav>
  );
}