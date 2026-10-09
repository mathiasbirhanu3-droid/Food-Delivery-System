DATA.md — one row per query (updated: Step 1)
Query	Where	Key	Refresh rule	Reasoning (one line)
Session	server, cookie read (session-server.ts)	—	per request	identity is never cached client-side
Credential check	server, sign-in action	—	on sign-in only	secrets never cross to the client
Dishes	server (RSC)	['dishes']	build / revalidate (perf step)	public, indexable, cacheable
My orders	server (RSC), scoped	['orders', userId]	server	private; scoped to the session
One order status	server first -> client SWR poll 5s (poll step)	['order', id]	fallbackData seeded	live without a spinner on arrival
Menu search	client, debounced 300ms (poll step)	['search', q]	on pause only	triggered by typing
Cart / favorites / theme	client stores + localStorage	—	derived / persisted	never leaves the browser
Deviations from the Day 35 React brief (deliberate — Day 45 governs)
Day 35	Implemented as	Why
React Router	App Router, same URLs	Day 45 framework
/admin/*	/kitchen/*, same features	Day 45 decision table
public/menu-data.json as fake API	src/data/db.json read server-side	single data source
Context/sessionStorage sessions	flagged HttpOnly cookie	Day 45 Accounts
Orders as client store	server data scoped to session	Day 45 Ownership
One data source
src/data/db.json is the only source of truth. Writes mutate an in-memorystore seeded from it — on serverless, mutations reset on cold start(acceptable for this build; documented, not hidden).

| Order status | client SWR → GET /api/orders/[id] | /api/orders/${id} | refreshInterval 5000; fallbackData = server-rendered order | seeded → data on first paint, no spinner; endpoint re-checks session + ownership itself || Menu search | client SWR → GET /api/dishes/search?q= | ['search', q, category] as URL key | debounce 300 ms; null key when empty (zero requests); keepPreviousData | triggered by typing — one request per pause, proven in the network tab || Category filter | server (RSC) via ?category= in the URL | — | on navigation | shareable, survives refresh  |