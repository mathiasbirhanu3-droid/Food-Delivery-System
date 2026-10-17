import type { MetadataRoute } from 'next';
import { getDishes } from '@/lib/db';
import { SITE_URL } from '@/lib/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL.replace(/\/$/, '');

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