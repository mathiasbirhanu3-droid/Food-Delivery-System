File: README.md (project root — beside package.json)

Addis Eats — Food Ordering for Addis Ababa
A full-stack food-ordering platform built with Next.js 15 (App Router): live menu,cash-on-delivery checkout, real-time courier tracking on a map, a role-guarded kitchenconsole, and full SEO/social discovery. Deployed, authenticated, measured.

Live URL: https://food-delivery-system-sigma-pink.vercel.appRepository: github.com/mathiasbirhanu3-droid/Food-Delivery-System (project in addis-eats-next/)

Quick start (fresh clone)
git clone https://github.com/mathiasbirhanu3-droid/Food-Delivery-System.gitcd Food-Delivery-System/addis-eats-nextnpm installcp .env.example .env.local        # fill the values belownpm run seed:hash                 # hash seeded passwords (removes plaintext)npm run dev                       # http://localhost:3000
Environment variables (.env.local locally — Vercel dashboard in production)
Key	Purpose
SESSION_SECRET	HMAC-SHA256 signing key for the session cookie — REQUIRED in production. Generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
NEXT_PUBLIC_SITE_URL	Deployment URL — drives metadataBase, og:image, sitemap. (Build-time inlined: after changing it, REDEPLOY.) A hardcoded fallback chain exists in src/lib/site-url.ts
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET	Google sign-in (optional — the button hides without them). Redirect URIs: <site-url>/api/auth/google/callback for localhost AND production
Demo accounts (assessor reference — never shown in the UI)
Email	Password	Role	Owns
selam@demo.et	demo1234	customer	ord_812 (pending), ord_809, ord_815
dawit@demo.et	demo1234	customer	ord_814 (pending — attack target), ord_813
kitchen@demo.et	kitchen1234	kitchen	sees ALL orders, status pipeline, menu manager, announcements, audit trail
Each account has its own private orders and favorites — the ownership guarantee.

Verify with tools (not opinions)
Attacks (browser console on the deployed URL):await cancelOrder("ord_812")   // signed out        → { refusedBy: 'session' }await cancelOrder("ord_814")   // as selam@demo.et  → { refusedBy: 'ownership' }  (Dawit's order)/signin?next=https://example.com                   → lands in-app (open redirect refused)# API discipline (terminal):curl -i https://food-delivery-system-sigma-pink.vercel.app/api/orders/ord_812   # 401 signed out# Discovery:/sitemap.xml → real dishes, no private routes  ·  /robots.txt → private routes disallowedShare a dish URL in Telegram/WhatsApp → card with image + price# Search (Network tab): one request per pause, zero when empty# Tracking: two tabs — kitchen advances an order, customer's map moves live
Performance (measured on the deployed build — full detail in docs/PERF.md)
LCP 5.2 s → 1.51 s (Slow 4G + 4× CPU) · 0.69–1.10 s (Fast 4G, unthrottled) ·CLS 0.13 → 0 · INP 24 ms · Largest image 97.3 kB ·Lighthouse 99 Performance / 96 Accessibility / 100 Best Practices / 100 SEO ·Total Blocking Time 60 ms · Speed Index 2.5 s

Tech
Next.js 15 (App Router, RSC, server actions, middleware, SSE) · TypeScript strict ·Tailwind CSS 3 · Zod · SWR · Leaflet · Web Crypto (HMAC sessions, PBKDF2 passwords) ·Google OAuth 2.0 · one JSON data source (src/data/db.json).

Documents
docs/AUTH.md — every private route/action, its layers, the three attacks
docs/DATA.md — every query: server/client, key, refresh rule, reasoning
docs/PERF.md — the budget, both columns, causes of every change
docs/FUTURE.md — what was cut and why; the roadmap
docs/PROJECT.md — consolidated SRS + architecture