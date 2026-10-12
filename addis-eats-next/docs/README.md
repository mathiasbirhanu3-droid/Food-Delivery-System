Addis Eats — Week 9 Next.js Advanced Project
Ethiopian food ordering in Addis Ababa. Next.js App Router · one JSON datasource · three-layer protection · live order status · full metadata.

Deployed URL: add after the first deploy — required deliverable

Quick start (fresh clone)
cp .env.example .env.local        # then: openssl rand -base64 32 -> SESSION_SECRETnpm installnpm run dev                       # http://localhost:3000
Demo accounts
Email
Password
Role
selam@demo.et	demo1234	customer (orders ord_812, ord_809, ord_815)
dawit@demo.et	demo1234	customer (orders ord_814, ord_813, …)
kitchen@demo.et	kitchen1234	kitchen (sees all orders)

Verify (tools, not opinions)
Cookie flags: devtools → Application → Cookies → addis_session
Open-redirect: visit /signin?next=https://example.com → lands in-app
Ownership: as Selam, open /orders/ord_814 → 404 (scoped query)
Live data & performance checks: see docs/AUTH.md · DATA.md · PERF.md
Docs
docs/PROJECT.md (consolidated SRS + design) · docs/AUTH.md · docs/DATA.md · docs/PERF.md

text


## B9 · Run it & verify step 1
```bash
cp .env.example .env.local
openssl rand -base64 32          # paste into SESSION_SECRET
npm install && npm run dev
Cookie flags — sign in as Selam, devtools → Application → Cookies: addis_session shows HttpOnly ✓, SameSite=Lax ✓ (Secure appears on the deployed HTTPS build — deploy today, per the sheet).
Layer 1 — signed out, visit /orders → bounced to /signin?next=/orders.
Layer 2 + ownership — as Selam open /orders (only ord_812/809/815) then /orders/ord_814 → 404.
Attack 3 — /signin?next=https://example.com → lands on /menu, never off-site; the refusing line is sanitizeNext in src/lib/sanitize.ts.
Kitchen demo — sign in as kitchen@demo.et → /kitchen shows the queue; as Selam, /kitchen → 404.
Next step (step 2→3 of the build order): the cart store + checkout form (zod, derived fee/ETA), then placeOrder and cancelOrder server actions with the full three layers — which unlocks attacks 1 and 2 and the live recording into AUTH.md. Say the word and I'll build it.