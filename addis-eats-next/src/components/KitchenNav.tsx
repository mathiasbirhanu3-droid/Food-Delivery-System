import Link from 'next/link';

const items: { href: string; label: string; exact: boolean }[] = [
  { href: '/kitchen', label: 'Orders', exact: true },
  { href: '/kitchen/menu', label: 'Menu manager', exact: false },
  { href: '/kitchen/announcements', label: 'Announcements', exact: false },
];

export default function KitchenNav({ current }: { current: string }) {
  return (
    <nav
      aria-label="Kitchen"
      className="mt-4 flex flex-wrap gap-2 border-b border-ink/10 pb-4 dark:border-cream/10"
    >
      {items.map(({ href, label, exact }) => {
        const active = exact ? current === href : current.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              active
                ? 'border-primary bg-primary text-white'
                : 'border-ink/15 hover:border-primary hover:text-primary dark:border-cream/20'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}