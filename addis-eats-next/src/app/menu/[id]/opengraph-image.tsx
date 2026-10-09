import { ImageResponse } from 'next/og';
import { getDish } from '@/lib/db';
import { formatETB } from '@/lib/format-etb';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Dish from Addis Eats — price in ETB';

export default async function DishOpenGraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dish = getDish(id);

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: 'linear-gradient(135deg, #0C7A4D 0%, #052E1E 100%)', color: '#FBF7F0' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dish?.image ?? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=630&auto=format&fit=crop'}
          alt="" width={630} height={630}
          style={{ width: 630, height: 630, objectFit: 'cover', display: 'flex' }}
        />
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', padding: '0 56px' }}>
          <div style={{ display: 'flex', fontSize: 26, opacity: 0.8 }}>Addis Eats</div>
          <div style={{ display: 'flex', fontSize: 60, fontWeight: 700, marginTop: 10 }}>
            {dish?.name ?? 'Addis Eats'}
          </div>
          <div style={{ display: 'flex', fontSize: 44, fontWeight: 700, color: '#E9B44C', marginTop: 18 }}>
            {dish ? formatETB(dish.price) : 'Ethiopian food, delivered'}
          </div>
        </div>
      </div>
    ),
    size,
  );
}