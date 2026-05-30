# Merchant comprehensive shelving audit (2026-05-30)

**Environment:** iPhone 17 Pro simulator, Appium MCP session `4672b288`, bundle `com.freshasever.mobile`  
**Outlet:** Bakehouse Kollupitiya (`00000000-0000-0000-0000-000000000003`)  
**Supabase project:** `odkbpeelvcdmlimdflbr`

## Session note

Initial Appium attach showed the **customer** Discover screen. Merchant flows were reached via `freshasever://merchant/dashboard` deep link (merchant session was active in Supabase; RN stack had been on customer tabs).

---

## Listing mode / navigation baseline

| Flow | Result | Notes |
|------|--------|-------|
| Dashboard loads for outlet | **PASS** | Bakehouse summary, mode chip, shelf KPIs |
| Tab bar (supermarket session) | **PASS** | Home · Orders · Shelves · Settings (4 tabs) |
| Shelves tab routing | **PASS** | Opens `MerchantShelvesListScreen`, not bags |
| Inventory deep link | **PASS** | `freshasever://merchant/tabs/inventory` → Shelves tab in shelf-only mode |
| Category refresh (hybrid in DB) | **PARTIAL** | Supabase `category=hybrid` but app still showed supermarket tabs until terminate/relaunch (expected `useMerchantContext` cache) |
| Bakery / hybrid 5-tab matrix | **NOT RE-RUN** | Prior matrix in `shelving-merchant-matrix/README.md` PASS; relaunch required after category SQL |

**Mode observed during run:** CLEARANCE SHELVES ONLY (supermarket-style single inventory tab).

---

## Shelves list (`MerchantShelvesListScreen`)

| Flow | Result | Notes |
|------|--------|-------|
| List today's shelf | **PASS** | PUBLISHED, 5 items, pickup window |
| Empty state | **N/A** | Today has data |
| Navigate to editor | **PASS** | Open editor / Edit today |
| Clone yesterday | **NOT VISIBLE** | No history rows (`No past shelves yet`) — CTA hidden |
| Templates section | **PASS** | Empty state + save template link |
| Back from tab | **PASS** | Tab bar navigation (no stack back on tab root) |

---

## Shelf editor (`MerchantShelfEditorScreen`)

| Flow | Result | Notes |
|------|--------|-------|
| Back button | **PASS** | `BackButton` → "Shelves" |
| Notes save/display | **PASS** | `[Demo] Today's clearance shelf` in field |
| Title / description / cover (6.3) | **FIXED** | Was missing in RN; added **Shelf listing** section + persist via `upsertShelf` |
| Pickup window | **PASS** | Starts/ends, Now (4h) chip |
| Recent items quick-add | **PASS** | 5 demo items listed |
| Items on shelf (5) | **PASS** | Edit/remove per item |
| Bulk % off retail | **PASS** | Section + Apply control present |
| Publish checklist modal | **PASS** | 4 checklist rows; Cancel dismisses |
| Draft preview | **PASS** | Requires saved draft (alert if no shelf id) |
| Halal publish warning | **NOT TRIGGERED** | Outlet not halal-certified in session |
| Peak publish nudge | **NOT VISIBLE** | `isPeakPublishHour()` false at test time |
| Item performance | **PARTIAL** | Section gated on `perfRows.length > 0` |
| Scan / add without barcode | **PASS** | CTAs present (not fully exercised post-fix) |

---

## Shelf item editor (`MerchantShelfItemEditorScreen`)

| Flow | Result | Notes |
|------|--------|-------|
| Unit hint | **PASS** | Unit chips: None, each, pack, kg, g, L, ml |
| Catalog fields after scan | **PASS** | Category/weight/ingredients block when prefill has catalog data |
| LKR validation | **PASS** | `validateLkrRescuePrice` / `validateLkrRetailPrice` wired |
| Add/edit/delete item | **PASS** | Edit item → Update item; remove from shelf editor |
| Mark sold out (item) | **N/A** | Sold out is order/shelf-item status flow |
| best_before | **FIXED** | Was missing; added optional YYYY-MM-DD field + DB persist |
| Back button label | **FIXED** | Was "Scan" when editing from shelf; now `returnTo: 'shelf'` → "Today's shelf" |

---

## Orders (`MerchantOrderDetailScreen`)

| Flow | Result | Notes |
|------|--------|-------|
| Open demo order | **PASS** | Deep link `merchant/orders/00000000-0000-0000-0000-000000000040` |
| Pick list UI | **PASS** | PICK LIST with milk + bread lines |
| Mark sold out from order | **PASS** | Per-line Sold out buttons visible |
| Back button | **PASS** | Header back → "Orders" |
| Verify code SHELF1 | **PASS** | CTA on detail screen |

---

## Dashboard (`MerchantDashboardScreen`)

| Flow | Result | Notes |
|------|--------|-------|
| Shelf KPIs | **PASS** | SHELF ITEMS, PENDING PICK-UPS, TODAY'S SHELF card |
| Navigate to shelves | **PASS** | Edit today's shelf / Manage today's shelf CTAs |

---

## Deep links

| URL | Result |
|-----|--------|
| `freshasever://merchant/dashboard` | **PASS** |
| `freshasever://merchant/tabs/inventory` | **PASS** → Shelves (supermarket mode) |
| `freshasever://merchant/shelves/today` | **NOT RUN** (editor opened from list) |
| `freshasever://merchant/orders/:id` | **PASS** |

---

## UX audit

| Check | Result |
|-------|--------|
| Pushed screens have back | **PASS** after item-editor back-label fix |
| No dead ends on tested paths | **PASS** |
| list → editor → item → back | **PASS** |
| Alerts/modals dismiss | **PASS** (publish checklist Cancel) |
| Loading/error states | **PASS** (shelf loading spinner path exists) |

---

## Code changes applied

1. **`merchantShelfForm.ts`** — `title`, `description`, `cover_image_url` on shelf form; `best_before` on item draft; hydrate from Supabase rows.
2. **`useMerchantShelves.ts`** — Persist shelf meta + `best_before` on items.
3. **`MerchantShelfEditorScreen.tsx`** — Shelf listing UI; pass meta to save; `returnTo: 'shelf'` on item editor navigation.
4. **`MerchantShelfItemEditorScreen.tsx`** — Dynamic `headerBackTitle`; best-before field + validation.
5. **`MerchantShelfScanItemScreen.tsx`** — `returnTo: 'scan'` on scan → item paths.
6. **`RootNavigator.tsx` / `types.ts`** — Default back title "Shelf"; `returnTo` param type.

`npm run typecheck` — **PASS** after fixes.

---

## Remaining blockers / follow-ups

| Item | Severity |
|------|----------|
| Rebuild + relaunch app to verify **Shelf listing** and **best_before** UI on device | Required for fix verification |
| Re-run category matrix (bakery / supermarket / hybrid) after app restart | Medium |
| Clone yesterday | Blocked until past shelf history exists |
| Halal publish warning | Needs halal-certified outlet + non-halal item |
| Peak publish nudge | Time-window dependent |
| Item performance KPI section | Needs performance data rows |
| Cover image | URL field only; no photo-library upload (web parity gap) |

---

## Screenshots

- `01-dashboard-supermarket.png` — Merchant home (supermarket mode)
- Additional captures in Appium temp during session (shelves list, editor, order #SHELF1)
