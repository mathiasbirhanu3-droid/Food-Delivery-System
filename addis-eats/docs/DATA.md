File: docs/DATA.md

DATA.md — Every Query (FINAL)
Query	Where	Key / endpoint	Refresh rule	Reasoning
Session	server, cookie read (session-server.ts)	—	per request	identity never cached client-side
Dishes (menu/cards/home)	server RSC	db.json → dishes-store	revalidatePath on kitchen writes	public, indexable, cacheable
Dish search	client SWR → GET /api/dishes/search	URL key (q, category)	debounce 300 ms; null key when empty; keepPreviousData	triggered by typing — one request per pause
My orders	server RSC, scoped	getOrdersFor(session.userId)	revalidatePath on writes	private; scoped by construction
Order status	client SWR → GET /api/orders/[id]	['order', id]	5 s poll; fallbackData seeded	live without a spinner on arrival
Order tracking	client EventSource → /api/orders/[id]/stream	SSE	snapshot + 2.5 s ticks; ~50 s then auto-reconnect	seeded by server render; courier position DERIVED (lerp on deliveringAt), never stored
Favorites (mine)	client SWR → GET /api/favorites/me	['favorites-me']	optimistic toggle + reconcile	per-account; one shared key syncs all hearts + header badge
Favorites page	server RSC scoped	getFavoritesFor(session.userId)	on render	private; availability resolved server-side
CSV export	server route	getOrdersFor(session.userId)	on request	two sections (orders + line items); RFC 4180 + BOM + injection guard
Kitchen analytics	server RSC	computed from orders store	revalidatePath	server-computed numbers can't be faked
Special of the Day	store invariant	getSpecialOfDay()	revalidatePath('/') on save	≤1 dish (store-enforced); home hero + OG advert
Dish writes	dishes-store	—	persistDbDev (dev) + /tmp (prod); revalidatePath /menu,/	availability/marketing propagate everywhere
Cart / theme / hearts UX	client stores + localStorage	—	derived / persisted	cart never leaves the browser; badge derived
Users + login activity	users-store	—	persistDbDev + /tmp	sign-up persists (dev fully; prod per warm instance)
One data source + persistence model
src/data/db.json is the single source of truth.

Development: every mutation writes back into db.json (read-merge-write per key) —create → save → read verified across restarts.
Production: in-memory stores + /tmp/addis-eats-state.json warm-cache; storesrehydrate on cold start. Cold start / deploy resets to the committed seed — documentedtradeoff. The store interfaces are the database-swap contract for Module 4–5.
Boundary note
Middleware deliberately does NOT cover /api/* — every route handler performs its ownsession + scoping checks (401/404). Middleware is a UX fast-fail, never the authorizationboundary.

Deliberate deviations from the Day 35 React brief (Day 45 governs)
Day 35 said	Implemented as	Why
React Router	App Router, same URLs	framework ruling
/admin/*	/kitchen/*	Day 45 decision table
public/menu-data.json fake API	db.json read server-side	single data source
Context/sessionStorage sessions	flagged HttpOnly cookie	Day 45 Accounts
localStorage favorites	server store, per-account + public counts	per-account + popularity requirements
Orders as client store	server, scoped to session	Day 45 Ownership
Placement recap
Copy
Goes to
1	addis-eats-next/README.md
2	addis-eats-next/docs/AUTH.md
3	addis-eats-next/docs/PERF.md
4	addis-eats-next/docs/DATA.md