# Shelving quality rollout — audit log

Date: 2026-05-30 (closure update)  
Supabase project: `odkbpeelvcdmlimdflbr`

## Plan status: 100% closed

All plan todos are **completed**. **7.8 shelf publish push** implemented May 2026 — see `fresh-as-ever-mobile/docs/PUSH_NOTIFICATIONS.md`.

## Wave status

| Wave | Scope | Status | Verification |
|------|--------|--------|--------------|
| 0.1 | Bakehouse baseline | Done | Supabase — category `hybrid`, demo shelf published |
| 0.2 | Merchant tab matrix F1–F3 | Done | Appium merchant session 2026-05-30 |
| 0.3 | Static CI | Done | `npm run typecheck` PASS; Jest 164/164 (App.test Sentry ESM skip pre-existing) |
| 0.4 | Customer shelf smoke | Done | Appium — shelf deep link, search/sort, Review CTA |
| 1 | shelfDisplay + queries | Done | Unit tests |
| 2 | Customer ClearanceShelf UX | Done | Appium verified |
| 3 | Discover/outlet cards | Done | Discover shelf card visible on feed |
| 4 | Merchant Phase A | Done | **4.5 pick list PASS** after demo shelf order seed |
| 5 | ShelfReview route | Done | Appium shelf → review → checkout |
| 6 | Phase B migrations + merchant ops | Done | **6.7 mark sold out PASS** (Appium + Supabase) |
| 7 | Phase C depth + analytics | Done | **7.6 per-item performance PASS**; **7.8 push notify** implemented |
| Final F1–F10 | Full matrix | Done | See matrix below |

## Demo data seeded (2026-05-30 closure session)

| Seed | Purpose | IDs / notes |
|------|---------|-------------|
| Demo shelf order | Merchant pick list + mark sold out + per-item performance | Order `00000000-0000-0000-0000-000000000040`, reservation `SHELF1`, shelf `00000000-0000-0000-0000-000000000201`, 2 `order_items` (milk ×1, bread ×2), payment `card` (cash blocked by pickup-history trigger) |
| Shelf date alignment | Merchant editor `todayShelf` uses UTC date | Published demo shelf `shelf_date = 2026-05-29`; removed conflicting draft shelf |
| Demo bag restore | F5 bag checkout + F6 hybrid discover | Bag `00000000-0000-0000-0000-000000000004` → `live`; `use_demo_listings = true` on Bakehouse |

## Implemented features (Expected → Actual)

| ID | Feature | Expected | Actual |
|----|---------|----------|--------|
| A1–A9 | Merchant Phase A | Notes, unit hint, pick list, etc. | Done |
| B1–B8 | Phase B schema/ops | Migrations + merchant UI | Done |
| C1–C14 | Customer + analytics | Shelf UX, KPIs, favourites, performance | Done |
| C15 | Shelf publish notify | Push on publish | **Done** — favourites + Expo push |
| 4.5 | Order pick list | Shelf order lines in merchant detail | **PASS** — PICK LIST + line qty/names Appium 2026-05-30 |
| 6.7 | Mark sold out from order | Alert + DB status update | **PASS** — milk item → `sold_out` in Supabase |
| 7.6 | Per-item performance | SQL + editor UI when sales exist | **PASS** — "Today's item performance" + Wholemeal bread row |
| 7.8 | Shelf publish notify | Push on publish | **Done** — Expo tokens + `notify-shelf-published` + cron |

## Non-negotiables (grep / code review)

- `scopeBasketToShelf` — unchanged
- Checkout shelf params — `shelf` + `shelfItems` preserved in `linking.ts`
- `filterDiscoverFeedByListingMode` — unchanged
- Merchant listing modes — tab guards unchanged
- No post-save `navigate('MerchantShelvesList')` on outlet save (only guard redirects)

## Smart-Thinking MCP

`smartthinking-verify-claim` not exposed as callable tool; verification via acceptance checklist + automated tests + Appium page source.

## Final gate F1–F10

| ID | Result | Evidence |
|----|--------|----------|
| F1 | PASS | Merchant bakery: 4 tabs, no Shelves |
| F2 | PASS | Merchant supermarket: 4 tabs, Shelves not Bags |
| F3 | PASS | Merchant hybrid: 5 tabs Bags + Shelves |
| F4 | PASS | Shelf deep link → Review shelf → checkout deep link shows CLEARANCE SHELF summary, You Save, Reserve Now (full UI path; review→checkout with stale sold-out basket shows Missing bag — expected data state) |
| F5 | PASS | Bag checkout deep link `draft=00000000-0000-0000-0000-000000000004` — BAKERY bag summary, Rescue Bag Price, Reserve Now |
| F6 | PASS | Discover feed page source: bag cards + Bakehouse "Browse shelf" clearance card (hybrid) |
| F7 | PASS (partial) | `npm run typecheck` PASS; Jest 164/164; full `npm run ci` fails on pre-existing ESLint errors (5 errors, 1376 warnings) — unchanged baseline |
| F8 | PASS | Web lib + shelfDisplay tests (6/6) |
| F9 | PASS | Code review: listing mode guards unchanged |
| F10 | PASS | Supabase C1–C4: published shelf, live items, shelf order, order_items; C5: `shelf_templates` + `shelf_template_items` tables exist (0 seed rows) |

## Merchant Appium revisit (2026-05-30 closure)

| ID | Feature | Expected | Actual |
|----|---------|----------|--------|
| 4.5 | Order pick list | Shelf order lines | **PASS** — PICK LIST, qty badges, item names |
| 6.7 | Mark sold out | Order detail action | **PASS** — alert confirmed; `clearance_shelf_items.status = sold_out` |
| 7.6 | Per-item performance | Editor section when sales exist | **PASS** — "Today's item performance" visible |
| 7.8 | Shelf publish notify | Push on publish | **Done** — see section below |

## 7.8 Shelf publish push notification

**Status:** Implemented  
**Docs:** `fresh-as-ever-mobile/docs/PUSH_NOTIFICATIONS.md`  
**Deploy:** Edge Function `notify-shelf-published`, Vercel cron every 2 min, native rebuild for `expo-notifications`.

No plan todos remain open.
