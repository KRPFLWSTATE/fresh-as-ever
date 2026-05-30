# Shelving Quality Rollout — Plan Code Quality Audit

**Date:** 2026-05-30  
**Plan:** `shelving_quality_rollout_01c1d63e.plan.md`  
**Baseline:** `fresh-as-ever/docs/AUDIT_SHELVING_QUALITY.md`  
**Method:** Static analysis, logic tracing, targeted Jest/`tsc`/`node --test`, grep gates (no Appium this pass)

## Executive summary

| Metric | Result |
|--------|--------|
| **Overall grade** | **A-** (production-ready mobile + web; minor residual risks) |
| **Typecheck** | PASS (`fresh-as-ever-mobile`) |
| **Shelf-related unit tests** | PASS (37 targeted mobile + 13 web lib) |
| **Full mobile Jest** | 164/164 pass; `App.test.tsx` fails pre-existing Sentry ESM (unchanged) |
| **P0/P1 fixes this session** | 2 web parity bugs fixed (basket scoping + review sold-out) |
| **7.8 push notifications** | Safely cancelled — no half-implemented send path |

---

## Verification commands (this audit)

| Command | Result |
|---------|--------|
| `cd fresh-as-ever-mobile && npm run typecheck` | PASS |
| `npm test -- --testPathPattern="shelf\|discoverFeed\|linking\|clearance\|merchantShelf"` | 37/37 PASS |
| `npm test -- --passWithNoTests` | 164 pass, 1 suite fail (`App.test` / Sentry ESM) |
| `cd fresh-as-ever && node --test src/lib/__tests__/shelfDisplay.test.js …` | PASS |
| `node --test src/lib/__tests__/discoverFeed.test.js` | PASS |
| Grep `TODO\|FIXME` in shelf-related paths | None |

---

## Severity table

| ID | Sev | Area | Finding | Status |
|----|-----|------|---------|--------|
| CQ-1 | **P1** | Web basket | `useClearanceBasket` on web did not scope lines to current shelf; stale basket from shelf A inflated `lineCount`/CTA on shelf B | **FIXED** |
| CQ-2 | **P1** | Web review | `shelves/[id]/review` did not drop sold-out / zero-stock lines (mobile already did) | **FIXED** |
| CQ-3 | **P2** | Web discover | `fetchPublishedShelves` omitted `retail_price`, `name_snapshot`, `brand_snapshot`, `product_id` → savings/preview drift vs mobile | **FIXED** |
| CQ-4 | P2 | Merchant / favourites | `shelf_date === today` uses `toISOString().slice(0,10)` (UTC), not Asia/Colombo local calendar day | Documented |
| CQ-5 | P2 | Analytics | `useShelfItemPerformance` aggregates all `order_items` for shelf orders without `order_status` filter | Documented |
| CQ-6 | P3 | Mobile display | `formatUnitLabel` passes `weight_grams: null` on shelf rows (catalog weight not surfaced) | Documented |
| CQ-7 | P3 | CI | `App.test.tsx` / `@sentry/react-native` ESM parse in full Jest run | Pre-existing |
| CQ-8 | P3 | Out of plan | `SearchResultsScreen` remains bag-only | Noted |
| CQ-9 | — | 7.8 notify | Cancelled; no `expo-notifications` shelf publish worker | **PASS** (safe) |

---

## Code fixes applied (this session)

1. **`fresh-as-ever/src/hooks/useClearanceBasket.js`** — export `scopeBasketToShelf` (mobile parity).
2. **`fresh-as-ever/src/app/(customer)/shelves/[id]/page.js`** — scope basket to `shelfId`; derive `lineCount` from scoped qty only.
3. **`fresh-as-ever/src/app/(customer)/shelves/[id]/review/page.js`** — scope basket; filter sold-out lines; cap qty to `quantity_remaining`.
4. **`fresh-as-ever/src/lib/discoverFeed.js`** — extend published-shelf item select fields for card savings/preview parity.

---

## File / feature verdicts

### Shared libs

| File | Verdict | Notes |
|------|---------|-------|
| `fresh-as-ever-mobile/src/lib/shelfDisplay.ts` | **PASS** | Savings, low-stock, pickup, best-before; mirrors web |
| `fresh-as-ever/src/lib/shelfDisplay.js` | **PASS** | Parity with mobile; 5/5 `node --test` |
| `__tests__/shelfDisplay.test.ts` (mobile) | **PASS** | |
| `fresh-as-ever-mobile/src/lib/shelfBrowse.ts` | **PASS** | Search, sort, category groups, bulk %, publish checklist |
| `__tests__/shelfBrowse.test.ts` | **PASS** | |
| `fresh-as-ever-mobile/src/lib/shelfShare.ts` | **PASS** | Deep link + WhatsApp URL encoding |
| `__tests__/shelfShare.test.ts` | **PASS** | |
| `fresh-as-ever-mobile/src/lib/merchantShelfValidation.ts` | **PASS** | LKR bands + peak hour helper |
| `__tests__/merchantShelfValidation.test.ts` | **PASS** | |

### Customer mobile

| File | Verdict | Notes |
|------|---------|-------|
| `ClearanceShelfScreen.tsx` | **PASS** | Search/sort/sections, sold-out UI, Review CTA gated, `scopeBasketToShelf`, preview mode |
| `ShelfReviewScreen.tsx` | **PASS** | Scoped basket, sold-out filter, checkout payload, back header |
| `CheckoutScreen.tsx` | **PASS** | `isShelfCheckout` hydrates synthetic bag + `retail_value_estimate`; no early `null` when shelf valid |
| `DiscoverScreen.tsx` | **PASS** | `DiscoverShelfCard` enrichment, `shelfMatchesChip` |
| `OutletDetailScreen.tsx` | **PASS** | Listing-mode guards for shelf section |
| `useClearanceBasket.ts` | **PASS** | Cross-shelf reset on `setQuantity`; persistence key `fae.clearanceBasket.v1` |
| `useShelfDetail.ts` | **PASS** | Outlet pickup/halal fields; merchant preview status filter |
| `discoverFeed.ts` | **PASS** | `filterDiscoverFeedByListingMode` intact |
| `useFavourites.ts` | **PASS** | Shelf-aware availability for supermarket/hybrid |
| `navigation/types.ts` | **PASS** | `ClearanceShelf`, `ShelfReview`, `Checkout.shelf` + `shelfItems` |
| `navigation/linking.ts` | **PASS** | `shelves/:id`, `shelves/:shelfId/review`, checkout parse |
| `RootNavigator.tsx` | **PASS** | Routes registered; tab guards via `merchantInventoryVisibility` |
| `__tests__/normalizeIncomingLinkPath.test.ts` | **PASS** | Includes `shelves/abc/review` |
| `__tests__/discoverFeedListingFilter.test.ts` | **PASS** | |
| `__tests__/useClearanceBasket.test.ts` | **PASS** | |

### Merchant mobile

| File | Verdict | Notes |
|------|---------|-------|
| `MerchantShelfEditorScreen.tsx` | **PASS** | Notes, meta, checklist, bulk %, draft preview nav, halal warning |
| `MerchantShelfItemEditorScreen.tsx` | **PASS** | LKR validation, unit hint |
| `MerchantShelvesListScreen.tsx` | **PASS** | Clone yesterday, templates RPC |
| `MerchantOrderDetailScreen.tsx` | **PASS** | Pick list + mark sold out per line |
| `MerchantDashboardScreen.tsx` | **PASS** | Shelf KPIs behind `showShelves` |
| `useMerchantShelves.ts` | **PASS** | Upsert + clone RPC |
| `useMerchantRecentShelfItems.ts` | **PASS** | Deduped quick-add query |
| `useShelfItemPerformance.ts` | **ISSUE** (P2) | No cancelled-order filter — see CQ-5 |
| `useMerchantDashboard.ts` | **PASS** | Shelf metrics queries |
| `useMerchantContext.ts` | **PASS** | Outlet category drives visibility |
| `useMerchantClearanceShelfGuard.ts` | **PASS** | Redirect when shelves disallowed |

### Web parity

| File | Verdict | Notes |
|------|---------|-------|
| `shelves/[id]/page.js` | **FIXED** | Was ISSUE (CQ-1); now scoped basket |
| `shelves/[id]/review/page.js` | **FIXED** | Was ISSUE (CQ-2) |
| `DiscoverShelfCard.js` | **PASS** | Uses feed enrichment fields |
| `discoverFeed.js` | **FIXED** | Query fields aligned with mobile |
| `useClearanceBasket.js` | **FIXED** | `scopeBasketToShelf` exported |
| `useMerchantShelves.js` | **PASS** | Mirrors mobile hook |

### Supabase migrations

| Migration | Verdict | Notes |
|-----------|---------|-------|
| `20260529120000_clearance_shelves.sql` | **PASS** | Tables, `orders.shelf_id`, `create_clearance_reservation`, `clone_shelf_to_today`, RLS |
| `20260530120000_shelf_meta_and_best_before.sql` | **PASS** | `title`, `description`, `cover_image_url`, `best_before` |
| `20260530150000_demo_clearance_shelf_idempotency.sql` | **PASS** | Demo shelf seed idempotent |
| `20260530160000_shelf_templates.sql` | **PASS** | Templates + `clone_template_to_today` |

---

## Non-negotiable regression checks

| Check | Result |
|-------|--------|
| `scopeBasketToShelf` on mobile customer shelf + review | **PASS** |
| Web customer shelf + review scoping (after fix) | **PASS** |
| Checkout params `shelf` + `shelfItems` / web `items` JSON | **PASS** |
| `filterDiscoverFeedByListingMode` unchanged | **PASS** |
| `merchantInventoryVisibility` / tab guards | **PASS** |
| No post-save `navigate('MerchantShelvesList')` on outlet save | **PASS** (only guard redirects) |
| 7.8 half-implemented push | **PASS** — cancelled, no send on publish |

---

## Residual risks & manual re-test

After rebuild, manually verify:

1. **Web:** Open shelf A → add items → open shelf B → sticky footer shows **0 items** (not stale count).
2. **Web:** Review with sold-out line in localStorage → line omitted; checkout succeeds with live lines only.
3. **Mobile:** Shelf → Review → Checkout deep link (`freshasever://checkout?shelf=…&shelfItems=…`) still shows savings.
4. **Merchant:** Bakery 4 tabs / supermarket shelves-only / hybrid 5 tabs (Appium matrix F1–F3).
5. **UTC shelf_date:** Near local midnight, confirm “today’s shelf” in merchant editor matches business expectation.

---

## References

- Prior Appium: `docs/verification/shelving-customer-e2e/`, `docs/verification/shelving-merchant-matrix/`, `docs/verification/merchant-comprehensive-audit/`
- Plan closure log: `fresh-as-ever/docs/AUDIT_SHELVING_QUALITY.md`
