import { ImageResponse } from 'next/og';
import { getSpecialOfDay, getRestaurant } from '@/lib/db';
import { priceOf } from '@/lib/pricing';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Addis Eats — Special of the Day';

// Revalidate with the home page: when the kitchen changes the special
// (revalidatePath('/')), the cached OG image regenerates too — otherwise
// social platforms would see a stale ad for days.
export const revalidate = 60;

/**
 * The home-page share card — the social-media ADVERT:
 * if a Special of the Day is set, it renders a TODAY-ONLY ad (dish photo,
 * name, price, discount); otherwise the branded default card.
 */
export default async function OpenGraphImage() {
  const special = getSpecialOfDay();
  const restaurant = getRestaurant();

  const fallbackImage =
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=70&w=1080&auto=format&fit=crop';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex',
          background: 'linear-gradient(135deg, #0C7A4D 0%, #052E1E 100%)',
          color: '#FBF7F0',
        }}
      >
        {/* left: photo (special's image, or brand fallback) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={special?.image ?? fallbackImage}
          alt=""
          width={630}
          height={630}
          style={{ width: 630, height: 630, objectFit: 'cover', display: 'flex' }}
        />

        {/* right: the advert copy */}
        <div
          style={{
            display: 'flex', flex: 1, flexDirection: 'column',
            justifyContent: 'center', padding: '0 56px',
          }}
        >
          {special ? (
            <>
              <div
                style={{
                  display: 'flex', alignSelf: 'flex-start',
                  background: '#E4572E', color: '#fff',
                  padding: '8px 22px', borderRadius: 999,
                  fontSize: 26, fontWeight: 700, letterSpacing: 2,
                }}
              >
                🔥 TODAY ONLY
              </div>
              <div style={{ display: 'flex', fontSize: 62, fontWeight: 700, marginTop: 24 }}>
                {special.name}
              </div>
              {special.marketingLine && (
                <div style={{ display: 'flex', fontSize: 30, color: '#E9B44C', marginTop: 12 }}>
                  ✦ {special.marketingLine}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 28 }}>
                {priceOf(special).discountPercent > 0 && (
                  <div style={{
                    display: 'flex', fontSize: 34, color: 'rgba(251,247,240,0.55)',
                    textDecoration: 'line-through',
                  }}>
                    {formatPrice(priceOf(special).original)}
                  </div>
                )}
                <div style={{ display: 'flex', fontSize: 64, fontWeight: 700, color: '#E9B44C' }}>
                  {formatPrice(priceOf(special).final)}
                </div>
                {priceOf(special).savings > 0 && (
                  <div style={{
                    display: 'flex', background: '#E4572E', color: '#fff',
                    padding: '6px 18px', borderRadius: 999, fontSize: 26, fontWeight: 700,
                  }}>
                    save {formatPrice(priceOf(special).savings)}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', fontSize: 28, opacity: 0.75, marginTop: 30 }}>
                {restaurant.name} · {restaurant.address}
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
                <div style={{
                  width: 96, height: 96, borderRadius: 999, background: '#E9B44C',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 999, background: '#E4572E' }} />
                </div>
                <div style={{ display: 'flex', fontSize: 88, fontWeight: 700 }}>
                  {restaurant.name}
                </div>
              </div>
              <div style={{ display: 'flex', fontSize: 36, opacity: 0.85, marginTop: 28 }}>
                {restaurant.tagline}
              </div>
            </>
          )}
        </div>
      </div>
    ),
    size,
  );
}

// tiny local price formatter — lib/format imports nothing edge-unsafe, but
// the OG route renders per-request, so we keep it self-contained here
function formatPrice(amount: number): string {
  return `ETB ${amount.toLocaleString('en-US')}`;
}