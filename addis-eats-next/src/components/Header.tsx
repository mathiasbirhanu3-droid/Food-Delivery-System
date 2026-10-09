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

  let favoriteItems: FavoriteMenuItem[] = [];
  if (session) {
    favoriteItems = getFavoritesFor(session.userId)
      .map((dishId) => {
        const dish = getDish(dishId);
        if (!dish) return null;
        return { id: dish.id, name: dish.name, price: dish.price, image: dish.image, favCount: 0 };
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
          {session && <FavoritesMenu items={favoriteItems} count={favoriteItems.length} />}
          {session ? (
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-medium transition hover:border-accent hover:text-accent active:scale-95 sm:px-4 sm:text-sm dark:border-cream/20"
              >
                Sign out
              </button>
            </form>
          ) : (
            <Link
              href="/signin"
              className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-600 active:scale-95 sm:px-4 sm:text-sm"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}