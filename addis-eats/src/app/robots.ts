import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  const base = SITE_URL.replace(/\/$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/orders', '/checkout', '/kitchen', '/signin', '/signup', '/favorites', '/api'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}