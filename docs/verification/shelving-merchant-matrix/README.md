# Merchant shelving Appium matrix (2026-05-30)

Merchant session on iPhone 17 Pro simulator. Outlet: Bakehouse Kollupitiya (`00000000-0000-0000-0000-000000000003`).

| Scenario | Category (Supabase) | Expected tabs | Result | Evidence |
|----------|---------------------|---------------|--------|----------|
| F1 Bakery | `bakery` | Home, Orders, Bags, Settings (4) | PASS | `F1-bakery-4tabs-no-shelves.png` |
| F2 Supermarket | `supermarket` | Home, Orders, Shelves, Settings (4) | PASS | `F2-supermarket-4tabs-shelves-no-bags.png` |
| F3 Hybrid | `hybrid` | Home, Orders, Bags, Shelves, Settings (5) | PASS | `F3-hybrid-5tabs.png` |

Category changes applied via Supabase; app terminate + activate to refetch `useMerchantContext`.

## Merchant feature smoke (supermarket session)

| ID | Feature | Result | Notes |
|----|---------|--------|-------|
| 4.1 | Shelf notes | PASS | Editor field visible |
| 4.4 | Recent items | PASS | Quick-add list + add milk |
| 4.9 | Clone yesterday | PASS | Shelves list CTA |
| 6.4 | Publish checklist | PASS | Modal with 4 checklist rows |
| 6.5 | Draft preview | PASS | Gated on save draft (alert) |
| 6.6 | Bulk discount | PASS | % off + Apply in editor |
| 6.8 | Templates | PASS | Section + save template CTA |
| 7.5 | Dashboard KPIs | PASS | SHELF ITEMS, PENDING PICK-UPS, TODAY'S SHELF on Home |
| 4.5 | Order pick list | Blocked | No `shelf_id` orders for demo outlet |
| 6.7 | Mark sold out | Blocked | Same — UI gated on shelf orders |
| 7.6 | Item performance | Partial | Hook wired; UI when `perfRows.length > 0` |

Outlet restored to `hybrid` after matrix run.
