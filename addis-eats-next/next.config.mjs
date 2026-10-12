console.log('[addis-eats] next.config loaded');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pinimg.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2678400,
  },
};

export default nextConfig;