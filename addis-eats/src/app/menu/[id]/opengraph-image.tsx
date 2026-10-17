import { ImageResponse } from 'next/og';
import { getDish } from '@/lib/db';
import { priceOf } from '@/lib/pricing';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Dish from Addis Eats — price in ETB';

export const revalidate = 60;

const OG_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=70&w=630&auto=format&fit=crop';

function safeImage(src?: string): string {
  if (!src) return OG_FALLBACK_IMAGE;
  if (src.includes('pinimg.com')) return OG_FALLBACK_IMAGE;
  return src;
}

function formatPrice(amount: number): string {
  return `ETB ${amount.toLocaleString('en-US')}`;
}

export default async function DishOpenGraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dish = getDish(id);
  const isSpecial = Boolean(dish?.specialOfDay);
  const photo = safeImage(dish?.image);

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: 'linear-gradient(135deg, #0C7A4D 0%, #052E1E 100%)', color: '#FBF7F0' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt="" width={630} height={630} style={{ width: 630, height: 630, objectFit: 'cover', display: 'flex' }} />
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', padding: '0 56px' }}>
          {isSpecial && (
            <div style={{ display: 'flex', alignSelf: 'flex-start', background: '#E4572E', color: '#fff', padding: '6px 20px', borderRadius: 999, fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
              🔥 TODAY ONLY
            </div>
          )}
          <div style={{ display: 'flex', fontSize: 26, opacity: 0.8 }}>Addis Eats</div>
          <div style={{ display: 'flex', fontSize: 60, fontWeight: 700, marginTop: 10 }}>{dish?.name ?? 'Addis Eats'}</div>
          <div style={{ display: 'flex', fontSize: 44, fontWeight: 700, color: '#E9B44C', marginTop: 18 }}>
            {dish ? formatPrice(priceOf(dish).final) : 'Ethiopian food, delivered'}
          </div>
        </div>
      </div>
    ),
    size,
  );
}