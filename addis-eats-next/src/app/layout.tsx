import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import { CartProvider } from '@/features/cart/cart-store';
import CartBar from '@/features/cart/CartBar';
import AttackBridge from '@/features/orders/AttackBridge';
import AnnouncementBar from '@/components/AnnouncementBar';

const display = Outfit({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Addis Eats — Ethiopian food, delivered in Addis Ababa',
    template: '%s — Addis Eats',
  },
  description:
    'Order doro wat, sega tibs, pizza and buna from Addis Eats. Live order tracking and delivery across Addis Ababa.',
  openGraph: { type: 'website', siteName: 'Addis Eats' },
};

const themeScript = `(function(){try{var t=localStorage.getItem('addis_eats_theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable}`}>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />

        <CartProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
          >
            Skip to content
          </a>

          <Header />
          <AnnouncementBar />

          <main id="main" className="min-h-[70vh] pb-16 sm:pb-0">
            {children}
          </main>

          <Footer />
          <BottomNav />
          <CartBar />
        </CartProvider>

        <AttackBridge />
      </body>
    </html>
  );
}