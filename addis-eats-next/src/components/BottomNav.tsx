'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/features/cart/cart-store';

const items = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/menu', label: 'Menu', icon: 'menu' },
  { href: '/favorites', label: 'Saved', icon: 'heart' },
  { href: '/cart', label: 'Cart', icon: 'cart' },
  { href: '/orders', label: 'Orders', icon: 'orders' },
] as const;

function Icon({ name, className }: { name: string; className?: string }) {
  const common = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true, className };
  switch (name) {
    case 'home':
      return <svg {...common}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
    case 'menu':
      return <svg {...common}><path d="M7 3v7M4 3v4.5a3 3 0 0 0 6 0V3M7 10v11M17.5 3c-1.9 0-3.5 2.2-3.5 5.5s1.6 5.5 3.5 5.5S21 11.8 21 8.5 19.4 3 17.5 3Zm0 11V21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case 'heart':
      return <svg {...common}><path d="M12 21s-7.5-4.6-10-9.3C.5 8 2.6 4.5 6.2 4.5c2 0 3.6 1.1 4.6 2.7l1.2 1.9 1.2-1.9c1-1.6 2.6-2.7 4.6-2.7 3.6 0 5.7 3.5 4.2 7.2C19.5 16.4 12 21 12 21Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
    case 'cart':
      return <svg {...common}><path d="M6 6h15l-1.5 9h-12L6 6Zm0 0L5 3H2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9" cy="20" r="1.5" fill="currentColor" /><circle cx="18" cy="20" r="1.5" fill="currentColor" /></svg>;
    default:
      return <svg {...common}><path d="M6 3h12v18l-2.4-1.8L13.2 21l-2.4-1.8L8.4 21 6 19.2V3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M9 8h6M9 12h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
  }
}

/** Mobile primary nav: 5 icon tabs, safe-area padding, derived cart badge.
 *  Hidden on the kitchen console and on sm+ screens. */
export default function BottomNav() {
  const pathname = usePathname();
  const { count, hydrated } = useCart();

  if (pathname.startsWith('/kitchen')) return null;

  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-cream/95 pb-safe backdrop-blur sm:hidden dark:border-cream/10 dark:bg-ink/95"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map(({ href, label, icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                aria-label={href === '/cart' && hydrated ? `Cart, ${count} item${count === 1 ? '' : 's'}` : label}
                className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition active:scale-95 ${
                  active ? 'text-primary' : 'text-ink/55 dark:text-cream/55'
                }`}
              >
                <Icon name={icon} />
                {label}
                {href === '/cart' && hydrated && count > 0 && (
                  <span className="absolute right-3 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-white">
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}