<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Fresh As Ever — agent continuity (read before prod / PWA rollout)

Shipping target is **web + installable PWA** (Serwist), not wrapped native shells. Long-running context lives in **`docs/agent-launch-continuity.md`** (env separation, demo data, go-live reminders).

**Quick rules for agents**

- **Supabase:** Assume separate **dev** vs **production** projects. Never enable the **demo pickup refresh cron** on production (`supabase/cron/demo-pickup-refresh-schedule.example.sql` is dev/staging only).
- **Demo bags:** `rescue_bags.seed_demo` + `refresh_demo_rescue_bag_pickup_windows()` (see migrations). New bags at demo outlets get `seed_demo` via trigger + `demo_seed_outlets` table; only those rows are extended by cron. Real prod outlets must **not** be listed in `demo_seed_outlets`.
- **Apply migrations** via Supabase CLI (`supabase db push`) or SQL Editor on the target project; then schedule cron manually on **non-prod** per the example file.
- **New demo seed rows:** Set `seed_demo = true` on insert, or extend the UUID list in a follow-up migration.
- **No-shows / cash:** See `docs/agent-launch-continuity.md` — `mark_order_no_show` RPC, cash-first-pickup DB trigger, and **future settlements must exclude `order_status = 'no_show'`**.

If something in this section conflicts with the owner’s latest decision, follow the owner and **update** `docs/agent-launch-continuity.md` so the next session stays aligned.
