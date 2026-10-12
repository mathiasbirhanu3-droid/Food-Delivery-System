'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  ['/', 'Home'], ['/menu', 'Menu'], ['/cart', 'Cart'], ['/orders', 'Orders'],
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith('/kitchen')) return null;

  return (
    <nav aria-label="Primary mobile" className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-cream/95 backdrop-blur sm:hidden dark:border-cream/10 dark:bg-ink/95">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {items.map(([href, label]) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? 'page' : undefined}
                className={`block py-2.5 text-center text-xs font-semibold ${active ? 'text-primary' : 'text-ink/60 dark:text-cream/60'}`}>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}