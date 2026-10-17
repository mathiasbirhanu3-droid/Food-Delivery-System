docs/AUTH.md`

markdown
 AUTH.md — Authorization Model (FINAL)

 The session cookie
`addis_session` = base64url(payload) + "." + base64url(HMAC-SHA256(secret, payload))
Flags: HttpOnly · Secure (prod) · SameSite=Lax · Path=/ · Max-Age 7d
Signed with Web Crypto HMAC-SHA256; constant-time MAC compare.
Flags confirmed in devtools on the deployed build.

 Routes — one line per layer
| Route | Layers | Proves |
|---|---|---|
| / · /menu · /menu/[id] · /cart | none | public, indexable |
| /signin · /signup | sanitizeNext() before any redirect | no open redirect (attack 3) |
| /orders · /orders/[id] · /orders/[id]/track | middleware → cookie exists; page → requireSession(); query → getOrdersFor / getOrderFor(session.userId, id) | signed in; own records only |
| /checkout | middleware; page → requireSession(); write re-checks in placeOrder | signed in — the write re-checks the rest |
| /favorites | middleware; page → requireSession(); query → getFavoritesFor(session.userId) | signed in; own favorites only |
| /kitchen · /kitchen/menu · /kitchen/announcements · /kitchen/activity | middleware; page → requireKitchen() (404 for customers); actions → assertKitchen() / role check inside | signed in, and permitted |
| /api/orders/[id] · /api/orders/[id]/stream · /orders/export · /api/favorites/me | handler: session → 401; scoped read → 404 | handlers are their own boundary — no middleware reliance |
| /api/auth/google/start · /callback | state cookie (None·Secure·10-min·single-use); claims iss/aud/exp; email_verified; linking policy | OAuth identity becomes OUR session |

Actions — checks inside EVERY action
| Action | Checks in order | Refusing line |
|---|---|---|
| signInAction | lockout check → credentials (PBKDF2, timing-equal) → audit → cookie | rate-limit.ts + lib/auth.ts |
| signUpAction | zod → duplicate email (post-submission) → hash → insert (role FORCED customer in store) → audit → cookie | users-store.insertUser |
| placeOrder | session → zod re-validation → re-price from db.json → scoped write (userId = session.userId) | actions/orders.ts |
| cancelOrder | session → ownership via getOrderFor(session.userId, id) → state (pending only) | actions/orders.ts (marked lines) |
| advanceOrderStatus | session → role(kitchen) → state pipeline | actions/kitchen.ts (marked) |
| upsertDish / toggleDishAvailability / deleteDish | assertKitchen() → zod → store (specialOfDay invariant in store) | actions/kitchen.ts |
| announcement CRUD | assertKitchen() → sanitize href → store | actions/kitchen.ts |
| toggleFavoriteAction | session → dish exists → scoped toggle | actions/favorites.ts |

The three attacks + extensions — ALL PASS (run live on the deployed URL)
| # | Attack | Expected | Refused by | Status |
|---|---|---|---|---|
| 1 | signed out: `await cancelOrder("ord_812")` | refused, not a crash | session line — actions/orders.ts (layer 3a) | ✅ |
| 2 | Selam cancels Dawit's ord_814 | refused ON OWNERSHIP | scoped read getOrderFor(session.userId, id) → if (!order) (layer 3b) | ✅ |
| 3 | /signin?next=https://example.com | lands in-app | sanitizeNext() — lib/sanitize.ts | ✅ |
| + | URL IDOR: /orders/ord_814 as Selam | 404 | scoped page query | ✅ |
| + | unauthenticated API: GET /api/orders/ord_812 | 401 | handler session check | ✅ |
| + | customer: await advanceOrderStatus("ord_812") | refused on role | role line — actions/kitchen.ts | ✅ |
| + | Google identity → existing password account | refused, never linked | resolveGoogleUser linking policy | ✅ |

Credential system
PBKDF2-SHA256 · 100,000 iterations · 16-byte per-user random salt · 32-byte digest ·
format `pbkdf2-sha256$iter$digest` · constant-time verify · burn-cycle timing for unknown
emails (sign-in never reveals which accounts exist) · brute-force lockout 5 failures /
15 min per email · audit trail records every attempt (success / wrong-password / locked /
google) — kitchen-only view · demo passwords seeded (hashed) and documented in README only.

Notes
- AttackBridge ships to production on purpose — the sheet requires the attacks run LIVE.
  It exposes actions on window; it grants nothing — the checks live inside the actions.
- `refusedBy` labels are a teaching affordance; production would collapse them to one
  generic refusal so error text leaks nothing.
- Lesson recorded from the salt-encoding incident: the verify path is the contract —
  every password producer must be tested against the app's verifier.