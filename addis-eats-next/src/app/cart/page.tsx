import type { Metadata } from 'next';
import CartView from '@/features/cart/CartView';

export const metadata: Metadata = {
  title: 'Cart',
  description: 'Your Addis Eats cart — review your dishes and totals before checkout.',
};

export default function CartPage() {
  return <CartView />;
}