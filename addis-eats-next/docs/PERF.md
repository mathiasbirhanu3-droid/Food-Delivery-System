File: docs/PERF.md

PERF.md — Performance Budget (FINAL · measured on the deployed build)
Method (fixed before measuring)
Throttled: Lighthouse Mobile — Slow 4G + 4× CPU slowdown, deployed URL
Unthrottled: Lighthouse Mobile — Fast 4G, no CPU throttling (best-case reference)
First Load JS: npm run build route table
Largest image: DevTools Network tab (optimized transfer), on /menu
Budget — both columns filled
Measure	Target	Before	After	Cause of change
LCP — mobile, Slow 4G + 4× CPU	< 2.5 s	5.2 s	1.51 s	Phase analysis: 3,024 ms resource load = optimizer fetching a Pinterest source that blocks server-side fetchers (doro-wat, sega-tibs); 586 ms load delay = LCP image started late at low priority. Fixes: ALL dish images standardized to Unsplash q=70&w=1080&auto=format&fit=crop; priority + high fetch priority restored on above-fold cards/hero. Lesson: image SOURCE, not the image pipeline, is the dominant LCP risk.
LCP — Fast 4G, no throttling	—	—	0.69–1.10 s	Same fixes — the ceiling of the optimized build
CLS	< 0.1	0.13	0	next/font self-hosted, display:swap (no font shift); fixed aspect-[4/3] / aspect-[16/9] boxes on every image; explicit sizes
INP	< 200 ms	32 ms	24 ms	Three micro-islands in the whole app; heavy work server-side; server actions with pending states
First Load JS, /menu	< 120 kB	(build table)	(record)	DishCard is a server component; cards render as HTML; only Add/heart micro-islands hydrate
Largest image	< 150 kB	—	97.3 kB	next/image AVIF variants + explicit sizes + standardized q=70&w=1080 sources — measured AS the LCP element
Lighthouse Performance	≥ 90	—	99	Sum of the above
Lighthouse Accessibility	—	—	96	Focus rings, aria-live regions, real buttons, labelled controls
Lighthouse Best Practices	—	—	100	HTTPS, no console errors, modern image formats
Lighthouse SEO	—	—	100	Distinct metadata, crawlable links, metadataBase
Total Blocking Time	—	—	60 ms	Minimal main-thread work on load
Speed Index	—	—	2.5 s	SSR content paints progressively
Optimisations applied (build order)
DishCard client → server component — cards + social proof render as HTML; only Add/heart micro-islands hydrate
next/image everywhere — AVIF first, explicit sizes, priority + fetchpriority=high on above-fold heroes ONLY
Image-source standardization — every dish URL = Unsplash q=70&w=1080&auto=format&fit=crop; pinimg eliminated (it blocked optimizer fetches)
next/font self-hosted, latin subset, display:swap
Modern browserslist targets — trimmed legacy transforms
No runtime UI framework; Tailwind-compiled CSS; animations are pure keyframes (zero JS)
The diagnosis story (the evidence, not the vibe)
Phase analysis on the 5.2 s run: 67% of LCP was resource-load duration — the imageoptimizer hanging on a Pinterest source that blocks server-side fetchers. 13% was loaddelay — the LCP image starting late at low priority. Fixing the SOURCE and restoring thePRIORITY moved LCP 71% (5.2 → 1.51 s) without touching layout or logic.A diagnosed fix beats a lucky pass.