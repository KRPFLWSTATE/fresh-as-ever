# Agent continuity — Fresh As Ever → production & PWA / web

This file is for **coding agents** and maintainers coordinating with the product owner toward a live shipped **web app and installable PWA** (Serwist). There is **no** native app store binary in this repo.

## Environment separation (critical)

- **Production** must use its own Supabase project and `.env`: real merchants, `seed_demo = false` on all `rescue_bags`.
- **Dev / staging** may contain demo merchants and bags. Demo bags are flagged with **`rescue_bags.seed_demo = true`** (see migration).
- **Production** (hosted site and PWA installs) must point **only** at production Supabase URLs and keys. Never publish the dev Supabase anon URL in a production build or env bundle that end users receive.

### Production rule in plain English

Think of **two different databases**: your **playground** database (fake shops and test bags) and your **real customer** database.

1. **Separate Supabase project for live** — Customers’ app should only ever talk to the “real” database, not the playground one. That way nobody sees your fake listings.

2. **Do not turn on the demo cron on the live database** — The daily job that “extends fake pickup times” is only for testing. On the real database it could mess with real pickup windows if any row were ever marked as a demo by mistake.

3. **`seed_demo` stays off for real bags** — Normally new real bags are `false`. The app only auto-marks bags as demo when their outlet is listed in `demo_seed_outlets`. On a fresh production project you won’t add your real store outlets to that list, so **everything stays “not demo”** and the refresh job (if you forgot and added cron) would change nothing. Best practice is still: **no demo cron on prod.**

## Staging vs production — is two Supabase projects overkill?

**You are not designing two apps.** One repo, one set of migrations; the app just reads different env vars (`NEXT_PUBLIC_SUPABASE_URL` / keys) for “staging” vs “production.” The extra overhead is **credential and release hygiene** (two projects in the Supabase dashboard, two places to store secrets). The benefit is **risk isolation**: demo cron, destructive SQL, messy seed data, and experiments do not share a database with paying customers.

**Drift** (staging and prod behaving differently) usually comes from skipping migrations on one side or hand-editing one database — not from “having two URLs.” Mitigation: always apply the same migration history to both; name projects clearly (e.g. `Fresh As Ever — Staging`, `Fresh As Ever — Production`); optional build-time guard so **production-deployed** builds only allow the production Supabase URL pattern.

**If you want minimal moving parts early:** a **single** Supabase project is workable only while there are no real users and you accept the risk of one wrong env bundle or one bad script hitting real-looking data. Plan to add a **production** project **before** public PWA launch / real money / real pickups — that is the usual cutover, not a ground-up redesign.

## Demo pickup windows (Option B)

Problem: RPC `nearby_bags` requires `pickup_end > now()`. Seeded demo rows go stale → empty map/tests.

Mitigation shipped in-repo:

| Artifact | Purpose |
|----------|---------|
| `supabase/migrations/20260502120000_demo_seed_pickup_refresh.sql` | Adds `seed_demo`, function `refresh_demo_rescue_bag_pickup_windows()`, backfills legacy demo bag UUIDs |
| `supabase/migrations/20260503120000_demo_seed_outlets_auto_flag.sql` | Table `demo_seed_outlets` + trigger: any **new** bag (or `outlet_id` change) at a listed demo outlet gets `seed_demo` set automatically |
| `supabase/cron/demo-pickup-refresh-schedule.example.sql` | Dev/staging pg_cron example (job may already be applied on dev — see owner) |

**Operational rule:** schedule `refresh_demo_rescue_bag_pickup_windows()` only on non-production Supabase projects. If migrations run on prod, do **not** run the cron example there.

## When adding new demo bags or demo outlets

**Bags at existing demo outlets (Bakehouse `...003`, Kumbuk `...013` on current dev seed):** nothing to do — the trigger sets `seed_demo` on insert and when `outlet_id` changes.

**A new demo outlet:** after the outlet row exists, add it once:

```sql
INSERT INTO public.demo_seed_outlets (outlet_id)
VALUES ('YOUR-OUTLET-UUID'::uuid)
ON CONFLICT (outlet_id) DO NOTHING;
```

Then backfill existing bags if any: `UPDATE rescue_bags rb SET seed_demo = EXISTS (SELECT 1 FROM demo_seed_outlets d WHERE d.outlet_id = rb.outlet_id);`

**Production:** keep `demo_seed_outlets` empty (default if those fixed seed outlet UUIDs never exist in prod). Never insert your real store outlets there.

**Manual override:** you can still set `seed_demo` only via DB for edge cases; moving a bag to a non-demo outlet clears `seed_demo` on next `outlet_id` update.

## Orders, no-shows, cash at pickup, settlements

**Implemented in app + DB (see migration `20260504180000_no_show_rpc_and_cash_enforcement.sql`):**

- **Cash at pickup:** customers need **at least one prior** order with `order_status = 'collected'` before `payment_method = 'cash'` is allowed. Enforced in checkout UI and by `orders_enforce_cash_pickup_bi` on `orders` insert.
- **Merchant no-show:** staff call RPC `mark_order_no_show(p_order_id)` (not a direct `orders` update for this path). Rules: order must be `paid` / `ready_for_pickup` / `awaiting_pickup`; `now() >= rescue_bags.pickup_end + 30 minutes`; increments `profiles.no_show_count`; at **3** notifies all `profiles.role = 'admin'` (`type = no_show_alert`); at **5** sets `is_suspended`, notifies customer (`type = account_warning`). Client mirrors the 30-minute rule for button state.
- **Suspended customers:** checkout route blocked in middleware (+ client redirect); `/profile?suspended=1` shows explanation.

**Settlements / commission (future):** the Next app currently has **no** settlement generation (`platform_fee` is stored as `0`; admin settlements UI is mock data). Any future payout/job/SQL aggregation must **`EXCLUDE`** rows where `order_status = 'no_show'` — do not record or calculate merchant commission on no-shows. Prefer including only statuses like **`collected`** (and optionally other closed paid states explicitly agreed with finance).

## Go-live checklist reminders (agents)

Before **public PWA / production web** cutover, verify with the owner:

1. Dedicated production Supabase; RLS/auth reviewed; service role secrets only server-side if used. In the Supabase dashboard (and any OAuth provider consoles), **Site URL** and **redirect URLs** must list only **HTTPS** production origins and dev localhost — remove any legacy **custom URL schemes** used for native shells (e.g. `capacitor://`, app-specific `com.*://`) if they were ever added.
2. No pg_cron job on prod that mutates pickups (above).
3. PWA / web launch: prod env URLs (`NEXT_PUBLIC_*`), HTTPS, **`manifest.webmanifest`** and icons, **Serwist** service worker behaving as intended; optional web push later with explicit consent and payload review.
4. Privacy policy URLs, analytics/PII disclosures, cookie/consent banners if EU traffic matters.
5. Remove or gate any “demo merchant” demo accounts from prod org policies if applicable.

## Project reference (historic)

Development database work has used Supabase project id `odkbpeelvcdmlimdflbr` — **treat as dev unless the owner confirms it is prod**. Replace with canonical prod id when documenting final architecture.
