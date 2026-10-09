import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session-server';
import { getUserById, getZones } from '@/lib/db';
import CheckoutForm from '@/features/checkout/CheckoutForm';
import { requireSession } from '@/features/auth/guards';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Place your Addis Eats order — delivery area, contact details, and a live total.',
  robots: { index: false },
};

export default async function CheckoutPage() {
  // Layer 2 — middleware proved a cookie exists; the session is verified here.
  const session = await requireSession('/checkout');
  //const session = await getSession();
  //if (!session) redirect('/signin?next=/checkout');

  const user = getUserById(session.userId);
  const zones = getZones();

  return (
    <CheckoutForm
      zones={zones}
      defaults={{
        name: user?.name ?? '',
        phone: user?.phone ?? '',
        zone: user?.defaultZone ?? zones[0]?.name ?? '',
      }}
    />
  );
}