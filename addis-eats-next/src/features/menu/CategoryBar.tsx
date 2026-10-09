import Link from 'next/link';
import { CATEGORIES } from '@/features/menu/categories';

const chip = (active: boolean) =>
  `whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition ${
    active
      ? 'border-primary bg-primary text-white'
      : 'border-ink/15 hover:border-primary hover:text-primary dark:border-cream/20'
  }`;

export default function CategoryBar({ active, sort }: { active?: string; sort?: string }) {
  const base = active ? `/menu?category=${encodeURIComponent(active)}` : '/menu';
  const withSort = (s: string) => (active ? `${base}&sort=${s}` : `/menu?sort=${s}`);

  return (
    <div className="space-y-2">
      <nav aria-label="Menu categories" className="flex gap-2 overflow-x-auto pb-1">
        <Link href="/menu" className={chip(!active)} aria-current={!active ? 'page' : undefined}>All</Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/menu?category=${c}${sort ? `&sort=${sort}` : ''}`}
            className={chip(active === c)}
            aria-current={active === c ? 'page' : undefined}
          >
            {c}
          </Link>
        ))}
      </nav>
      <nav aria-label="Sort menu" className="flex gap-2">
        <Link href={base} className={`${chip(!sort)} text-xs`} aria-current={!sort ? 'page' : undefined}>
          Featured
        </Link>
        <Link href={withSort('loved')} className={`${chip(sort === 'loved')} text-xs`} aria-current={sort === 'loved' ? 'page' : undefined}>
          ❤ Most loved
        </Link>
        <Link href={withSort('offers')} className={`${chip(sort === 'offers')} text-xs`} aria-current={sort === 'offers' ? 'page' : undefined}>
          % Offers
        </Link>
      </nav>
    </div>
  );
}