-- EXAMPLE ONLY — apply on your *development or staging* Supabase project SQL editor after:
--   1) Extensions → enable pg_cron (and pg_net if scheduling via Dashboard varies by plan)
--   2) Migration 20260502120000_demo_seed_pickup_refresh.sql has been applied
--
-- NEVER run cron.schedule on production for this job if production could ever carry rows
-- with seed_demo = true (default should be false; do not bulk-seed prod with demo bags).

SELECT cron.schedule(
  'refresh-demo-rescue-bag-windows',
  '0 18 * * *',  -- daily 18:00 UTC (deployed on dev via MCP — adjust per project)
  'SELECT public.refresh_demo_rescue_bag_pickup_windows();'
);


-- Inspect:
-- SELECT * FROM cron.job;
-- Manual test:
-- SELECT public.refresh_demo_rescue_bag_pickup_windows();


-- Tear down before cloning project to prod (or omit schedule on prod):
-- SELECT cron.unschedule('refresh-demo-rescue-bag-windows');
