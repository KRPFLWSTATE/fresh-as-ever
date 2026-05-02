# Agent continuity — Fresh As Ever → production & App Store

This file is for **coding agents** and maintainers coordinating with the product owner toward a live shipped app.

## Environment separation (critical)

- **Production** must use its own Supabase project and `.env`: real merchants, `seed_demo = false` on all `rescue_bags`.
- **Dev / staging** may contain demo merchants and bags. Demo bags are flagged with **`rescue_bags.seed_demo = true`** (see migration).
- Live App Store builds must point **only** at production URLs and keys. Never ship the dev Supabase anon URL in a store binary.

### Production rule in plain English

Think of **two different databases**: your **playground** database (fake shops and test bags) and your **real customer** database.

1. **Separate Supabase project for live** — Customers’ app should only ever talk to the “real” database, not the playground one. That way nobody sees your fake listings.

2. **Do not turn on the demo cron on the live database** — The daily job that “extends fake pickup times” is only for testing. On the real database it could mess with real pickup windows if any row were ever marked as a demo by mistake.

3. **`seed_demo` stays off for real bags** — Normally new real bags are `false`. The app only auto-marks bags as demo when their outlet is listed in `demo_seed_outlets`. On a fresh production project you won’t add your real store outlets to that list, so **everything stays “not demo”** and the refresh job (if you forgot and added cron) would change nothing. Best practice is still: **no demo cron on prod.**

## Staging vs production — is two Supabase projects overkill?

**You are not designing two apps.** One repo, one set of migrations; the app just reads different env vars (`NEXT_PUBLIC_SUPABASE_URL` / keys) for “staging” vs “production.” The extra overhead is **credential and release hygiene** (two projects in the Supabase dashboard, two places to store secrets). The benefit is **risk isolation**: demo cron, destructive SQL, messy seed data, and experiments do not share a database with paying customers.

**Drift** (staging and prod behaving differently) usually comes from skipping migrations on one side or hand-editing one database — not from “having two URLs.” Mitigation: always apply the same migration history to both; name projects clearly (e.g. `Fresh As Ever — Staging`, `Fresh As Ever — Production`); optional build-time guard so store/release builds only allow the production URL pattern.

**If you want minimal moving parts early:** a **single** Supabase project is workable only while there are no real users and you accept the risk of one wrong env bundle or one bad script hitting real-looking data. Plan to add a **production** project **before** App Store / real money / real pickups — that is the usual cutover, not a ground-up redesign.

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

Before App Store submission and prod cutover, verify with the owner:

1. Dedicated production Supabase; RLS/auth reviewed; service role secrets only server-side if used.
2. No pg_cron job on prod that mutates pickups (above).
3. Store listing: privacy policy URLs, analytics/PII disclosures, IAP if any (N/A unless added).
4. Capacitor / native: capacitor config reflects prod API URLs; push credentials if implemented.
5. Remove or gate any “demo merchant” demo accounts from prod org policies if applicable.

## Project reference (historic)

Development database work has used Supabase project id `odkbpeelvcdmlimdflbr` — **treat as dev unless the owner confirms it is prod**. Replace with canonical prod id when documenting final architecture.

## Capacitor remote shell (Android-first, same codebase)

The native app is a **thin WebView shell** that loads the **same** Next.js app from a remote URL (`server.url` in Capacitor). Content and `NEXT_PUBLIC_*` keys come from whatever host you point at (LAN dev server or Vercel deployment)—align that host’s env with **dev vs staging vs prod** rules in §Environment above.

**Repo files:** `capacitor.config.js` (loads `.env.local` / `.env` for `CAPACITOR_*` only), `android/`, placeholder `www/index.html`, scripts `npm run cap:*`.

**Env (see `env.capacitor.example`):**

- `CAPACITOR_SERVER_URL` — e.g. `http://192.168.x.x:3000` for LAN or `https://…vercel.app` for preview/prod.
- `CAPACITOR_ANDROID_CLEARTEXT=true` — **dev/LAN HTTP only**; remove for HTTPS store builds.
- `CAPACITOR_EXTRA_ALLOW_NAVIGATION` — optional comma-separated hosts to append to `server.allowNavigation` if WebView blocks a new iframe or redirect (check `chrome://inspect`).

**Dev workflow:** run Next with `npm run dev:lan` so the device can reach your machine; set `CAPACITOR_SERVER_URL` in `.env.local`; run `npm run cap:sync` then `npm run cap:open:android` or `npm run cap:run:android`.

**Never** ship a Play build with cleartext enabled or with `CAPACITOR_SERVER_URL` pointing at a non-production Supabase-backed deployment unless that is intentional for a closed test track.

**Serwist:** on native WebView, service worker registrations are **unregistered** on launch (`CapacitorNativeShell`) so the shell always loads fresh HTML/JS from the remote server (avoids stale offline shell).

**Payhere:** checkout loads `https://www.payhere.lk/lib/payhere.js` via `next/script`; keep PayHere domains in `allowNavigation` (already in `capacitor.config.js`).

**Maps:** Leaflet uses HTTPS Carto Voyager tiles (`src/lib/leaflet/cartoTiles.js`); no mixed-content downgrades for map layers.

## WebView QA gates (after Milestone 1 shell is green)

**Documentation preflight (mandatory):** before signing off Milestone 1 or Phase 6 aggregate gates, re-read **this file** and `AGENTS.md` in the same session.

**Route inventory:** `npm run cap:list-routes` — every listed `page.*` should have a row in your QA spreadsheet before wide release.

**Four-eyes:** the engineer who merged native/WebView fixes should not be the only person running cold-install smoke (login → discover → checkout abandon → merchant orders).

**Staging-only DB checks:** no-show RPC timing, cash-first-pickup enforcement, and suspension side effects — exercise only on **non-production** Supabase (see §Orders).

**Doc drift (merge rule):** PRs that change middleware auth, checkout payment rules, no-show behavior, demo seeding, or Capacitor URL/env wiring must **update this doc** (or include an explicit PR comment explaining why no doc change is needed).

**WiFi → cellular:** run at least one checkout session handoff on a physical device before store.

## iOS (Month 2 — deferred)

When a Mac is available: `npx cap add ios`, Xcode signing, ATS / `WKAppBoundDomains` checklist, then repeat condensed customer + merchant WebView smokes. No App Store submission in the current phase.

## GitHub → Vercel → Android WebView (intended release loop)

1. **GitHub** hosts this repo; every **push to the branch Vercel watches** (usually `main`) triggers a Vercel **production** deploy (or PR previews if you enable them).
2. **Vercel** builds and serves the Next.js app at a stable HTTPS URL (e.g. `https://your-app.vercel.app` or your custom domain).
3. The **Android Capacitor shell** uses `CAPACITOR_SERVER_URL` pointing at that **same** HTTPS URL (set before `npm run cap:sync` / building the APK). The WebView loads that site live: **most UI, API routes, and content updates ship as soon as Vercel finishes the deploy** — no new Play upload for typical web-only changes.

**When you still need a new APK or `cap sync`:** native dependency or permission changes, new third-party domains for `allowNavigation`, changing the canonical app URL, or Android/WebView-specific fixes.

**Preview vs production:** Pointing the store APK at **production** keeps behavior predictable. Use **preview URLs** only for internal test builds (each preview hostname may need `CAPACITOR_EXTRA_ALLOW_NAVIGATION` if it is not already covered).

## Vercel URL swap (owner go-ahead only)

Point `CAPACITOR_SERVER_URL` at the HTTPS deployment; **unset** `CAPACITOR_ANDROID_CLEARTEXT`; run `npm run cap:sync`; rebuild the APK/AAB; re-verify PayHere, Supabase session, maps tiles, and middleware redirects on that host.

### WebView console allowlist (append-only)

When a warning is benign and unavoidable, add a **dated one-line** entry here so gate sign-off can reference it:

- _(none yet)_
