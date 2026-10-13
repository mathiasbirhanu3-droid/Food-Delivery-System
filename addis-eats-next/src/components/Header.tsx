import Link from 'next/link';
import { getSession } from '@/lib/session-server';
import { getDish, getFavoritesFor } from '@/lib/db';
import { signOutAction } from '@/actions/auth';
import Logo from '@/components/Logo';
import CartBadge from '@/features/cart/CartBadge';
import ThemeToggle from '@/features/theme/ThemeToggle';
import FavoritesMenu, { type FavoriteMenuItem } from '@/features/favorites/FavoritesMenu';

export default async function Header() {
  const session = await getSession();

  // Server-rendered favorites — the panel opens with correct data, zero fetch.
  let favoriteItems: FavoriteMenuItem[] = [];
  if (session) {
    favoriteItems = getFavoritesFor(session.userId)
      .map((dishId) => {
        const dish = getDish(dishId);
        if (!dish) return null;
        return {
          id: dish.id,
          name: dish.name,
          price: dish.price,
          image: dish.image,
          favCount: 0,
          available: dish.available,
        };
      })
      .filter((item): item is FavoriteMenuItem => item !== null);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/80 backdrop-blur dark:border-cream/10 dark:bg-ink/80">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-1.5 px-3 sm:gap-3 sm:px-4">
        <Link href="/" aria-label="Addis Eats home"><Logo /></Link>

        <div className="hidden items-center gap-6 text-sm font-medium sm:flex">
          <Link href="/menu" className="hover:text-primary">Menu</Link>
          {session && <Link href="/orders" className="hover:text-primary">My orders</Link>}
          {session?.role === 'kitchen' && <Link href="/kitchen" className="hover:text-primary">Kitchen</Link>}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <ThemeToggle />
          <CartBadge />
          {session ? (
            <FavoritesMenu items={favoriteItems} count={favoriteItems.length} />
          ) : (
            <Link
              href="/signin?next=/menu"
              aria-label="Sign in to save favorites"
              className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 text-sm hover:border-accent hover:text-accent dark:border-cream/20"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 21s-7.5-4.6-10-9.3C.5 8 2.6 4.5 6.2 4.5c2 0 3.6 1.1 4.6 2.7l1.2 1.9 1.2-1.9c1-1.6 2.6-2.7 4.6-2.7 3.6 0 5.7 3.5 4.2 7.2C19.5 16.4 12 21 12 21Z"
                  stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
                />
              </svg>
            </Link>
          )}
          {session ? (
            <>
              <span className="hidden text-sm text-ink/70 sm:inline dark:text-cream/70">
                Hi, {session.name.split(' ')[0]}
              </span>
              <form action={signOutAction}>
                <button type="submit" className="rounded-full border border-ink/15 px-4 py-1.5 text-sm font-medium hover:border-accent hover:text-accent dark:border-cream/20">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link href="/signin" className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary-600">
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}