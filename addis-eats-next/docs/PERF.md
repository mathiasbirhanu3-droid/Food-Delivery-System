PERF.md — the budget, both columns (baseline due at step 5)
Measure	Target	Before	After	Cause of change
LCP, throttled	< 2.5s	—	—	— 0.88 s
CLS	< 0.1	—	—	— 0
First Load JS, /menu	< 120 kB	—	—	—
Largest image	< 150 kB	—	—	—
Lighthouse performance	>= 90	—	—	—
Known tradeoff (written now, by design): the header reads the session cookie,so routes render dynamically rather than statically. Server rendering andindexability are unaffected; if the First Load JS or LCP numbers demand it,the production upgrade path is PPR / splitting the session boundary — to bedecided with the step-5 numbers, not vibes.