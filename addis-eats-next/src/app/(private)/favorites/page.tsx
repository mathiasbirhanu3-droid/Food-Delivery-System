import type { Metadata } from 'next';
import { getDish, getFavoriteCounts, getFavoritesFor } from '@/lib/db';
import { requireSession } from '@/features/auth/guards';
import FavoritesViewList from '@/features/favorites/FavoritesViewList';

export const metadata: Metadata = {
  title: 'Favorites',
  description: 'Your saved Addis Eats dishes — one tap to add them back to the cart.',
  robots: { index: false },
};

export default async function FavoritesPage() {
  // Layer 2 — favorites are per-account, so the page is private.
  const session = await requireSession('/favorites');

  const items = getFavoritesFor(session.userId)
    .map((dishId) => {
      const dish = getDish(dishId);
      if (!dish) return null;
      return {
        id: dish.id,
        name: dish.name,
        price: priceResolved(dish),
        image: dish.image,
        description: dish.description,
        favCount: getFavoriteCounts()[dish.id] ?? 0,
        available: dish.available,
      };
    })
    .filter((item) => item !== null);

  function priceResolved(dish: NonNullable<ReturnType<typeof getDish>>) {
    return dish.price; // list price for the wishlist display; AddToCart passes it to the cart
  }

  return <FavoritesViewList items={items} />;
}