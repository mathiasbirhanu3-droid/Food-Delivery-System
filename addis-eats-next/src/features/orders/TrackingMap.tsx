'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import type { LatLng } from '@/lib/tracking';

export default function TrackingMap({
  restaurant, dropoff, courier, status,
}: {
  restaurant: LatLng; dropoff: LatLng; courier: LatLng; status: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const courierRef = useRef<import('leaflet').Marker | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, { scrollWheelZoom: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const icon = (emoji: string) =>
        L.divIcon({ html: emoji, className: 'tracking-marker', iconSize: [36, 36], iconAnchor: [18, 18] });

      L.marker(restaurant, { icon: icon('🏠') }).addTo(map).bindTooltip('Addis Eats kitchen');
      L.marker(dropoff, { icon: icon('📍') }).addTo(map).bindTooltip('Delivery address');

      courierRef.current = L.marker(courier, { icon: icon('🛵'), zIndexOffset: 1000 })
        .addTo(map)
        .bindTooltip('Your courier');

      map.fitBounds(L.latLngBounds([restaurant, dropoff]).pad(0.35), { maxZoom: 16 });
      mapRef.current = map;

      // Force recalculation of container size to prevent grey box tiles on Vercel
      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    courierRef.current?.setLatLng(courier);
  }, [courier]);

  useEffect(() => {
    if (status === 'delivered') courierRef.current?.setLatLng(dropoff);
  }, [status, dropoff]);

  return (
    <div
      ref={containerRef}
      className="h-80 w-full rounded-2xl border border-ink/10 dark:border-cream/10"
      role="application"
      aria-label="Live delivery map"
    />
  );
}
