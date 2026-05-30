# Clearance Shelf — Phase 0 baseline snapshot

Captured before `20260529120000_clearance_shelves.sql`.

## Migrations (last applied before clearance)

- `20260528120000_merchant_collect_group_and_inventory.sql`
- `20260527120000_reservation_groups.sql`
- `20260526120000_outlet_trust_score.sql`
- `20260525120000_rescue_bags_estimated_weight_kg.sql`

## Core tables at baseline

- `outlets`, `rescue_bags`, `orders`, `reservation_groups`, `profiles`, `complaints`, `promo_codes`, `merchant_staff`

## Feature flags at baseline

- `NEXT_PUBLIC_GROUP_RESERVATIONS_ENABLED` (web)
- `EXPO_PUBLIC_GROUP_RESERVATIONS_ENABLED` (mobile)

## Rollback anchor

Record production deployment id from Vercel before enabling `NEXT_PUBLIC_CLEARANCE_SHELVES_ENABLED`.
