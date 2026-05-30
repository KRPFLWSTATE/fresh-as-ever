# Listing mode audit (merchant / customer / admin)

**Last run:** 2026-05-30  
**Source of truth:** `outletListingMode` + `merchantInventoryVisibility`

## Product rules

| Category | Mode | Merchant tabs | Must never show |
|----------|------|---------------|-----------------|
| bakery, cafe, restaurant, other | rescue_bag | Bags (4 tabs) | Shelves |
| supermarket, grocery | clearance_shelf | Shelves (4 tabs) | Bags |
| hybrid, hotel | hybrid | Bags + Shelves (5 tabs) | — |

## Root causes fixed this pass

| ID | Issue | Fix | Status |
|----|-------|-----|--------|
| RC1 | Stale `activeOutlet.category` after outlet save | `refetchMerchantContext()` mobile + web | FIXED |
| RC2 | `showShelves` gated by clearance flag for merchant | Merchant uses category only; flag for customer Discover | FIXED |
| RC3 | Post-save `navigate('MerchantShelvesList')` | `navigation.goBack()` / `router.back()`; web settings no `router.push` shelves | FIXED |
| RC4 | `goToShelves()` → MerchantBagsTab | Hybrid → MerchantShelvesTab; single shelves → inventory tab | FIXED |
| RC5 | Tab navigator not remounting | `key={outletId-category}` on MerchantTabsNav | FIXED |
| RC6 | Shelves list blocked when flag off | Banner + full shelves UI for merchants | FIXED |
| RC7 | Web sidebar `showShelves` used flag | `merchantInventoryVisibility.js` | FIXED |
| RC8 | `MerchantBagsListScreen` early return before `useFocusEffect` / memos | Hooks run unconditionally; guard UI only after all hooks | FIXED |
| RC9 | Inverted UX + crash on shelf-only tab | Crash was `MerchantBagsListScreen` mounted with `bagsAllowed=false` (skipped hooks); `pickMerchantInventoryListKind` + tab mount tests guard routing | FIXED |

## Surface matrix (merchant mobile)

| ID | Surface | Bakery | Supermarket | Hybrid | Status |
|----|---------|--------|-------------|--------|--------|
| M1 | Bottom tabs | Bags only | Shelves only | Bags+Shelves | FIXED |
| M5 | Dashboard quick actions | Bags | Shelves | Both | FIXED |
| M10 | Bag list guard | allowed | blocked | allowed | FIXED |
| M12 | Shelf editor/scan guard | blocked | allowed | allowed | FIXED |
| M14 | Outlet save | goBack + refetch | goBack + refetch | goBack + refetch | FIXED |

## Verification gates

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` (mobile) | PASS |
| Jest listing-mode suites (7 mobile + web visibility tests) | PASS (30 tests) |
| Outlet editor no `MerchantShelvesList` on save | PASS |
| Supabase Bakehouse demo data (hybrid: 3 bags, 5 shelf items today) | PASS |
| Dashboard single-mode uses `MerchantBagsTab` not stack shelves list | PASS |

## Smart-Thinking MCP

Server had no callable tools in filesystem; reasoning captured in this doc and plan Phase 0 checklists.

## Appium

Device matrix T1–T12: run manually when simulator + merchant build available (`Official Appium MCP Server`).
