import type { MetadataRoute } from 'next';
import { getDishes } from '@/lib/db';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

  return [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/menu`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/cart`, changeFrequency: 'monthly', priority: 0.3 },
    ...getDishes().map((dish) => ({
      url: `${base}/menu/${dish.id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
  // deliberately absent: /orders, /checkout, /kitchen, /signin, /favorites, /api — AUTH.md
}