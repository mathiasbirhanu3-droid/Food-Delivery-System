import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Addis Eats — Ethiopian food, delivered in Addis Ababa';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #0C7A4D 0%, #052E1E 100%)', color: '#FBF7F0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div style={{ width: 96, height: 96, borderRadius: 999, background: '#E9B44C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 999, background: '#E4572E' }} />
          </div>
          <div style={{ fontSize: 88, fontWeight: 700 }}>Addis Eats</div>
        </div>
        <div style={{ marginTop: 28, fontSize: 36, opacity: 0.85 }}>
          Ethiopian food, delivered in Addis Ababa
        </div>
      </div>
    ),
    size,
  );
}