-- Demo / seed tooling: NEVER schedule the pg_cron job that calls this function on production.
-- See docs/agent-launch-continuity.md and AGENTS.md (Fresh As Ever continuity).

ALTER TABLE public.rescue_bags
  ADD COLUMN IF NOT EXISTS seed_demo boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.rescue_bags.seed_demo IS
  'Demo-seed marker: only these rows may be touched by refresh_demo_rescue_bag_pickup_windows(). Merchant bags must remain false in production.';


CREATE OR REPLACE FUNCTION public.refresh_demo_rescue_bag_pickup_windows()
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
DECLARE
  n integer;
BEGIN
  UPDATE public.rescue_bags rb
  SET
    pickup_start = now() - interval '1 hour',
    pickup_end = now() + interval '8 hours',
    updated_at = now()
  WHERE rb.seed_demo IS true
    AND rb.status = 'live'
    AND rb.quantity_remaining > 0
    AND rb.pickup_end < now();

  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;


COMMENT ON FUNCTION public.refresh_demo_rescue_bag_pickup_windows() IS
  'Shifts expired pickup windows for rows with seed_demo = true only. Intended for pg_cron on dev/staging Supabase projects.';

REVOKE ALL ON FUNCTION public.refresh_demo_rescue_bag_pickup_windows() FROM PUBLIC;

-- Supabase Postgres role runs pg_cron jobs
GRANT EXECUTE ON FUNCTION public.refresh_demo_rescue_bag_pickup_windows() TO postgres;


-- Known demo/seeding UUIDs used in Fresh As Ever dev data (adjust if seeds change).
UPDATE public.rescue_bags
SET seed_demo = true
WHERE id IN (
  '00000000-0000-0000-0000-000000000004'::uuid,
  '00000000-0000-0000-0000-000000000014'::uuid,
  '00000000-0000-0000-0000-000000000015'::uuid,
  '00000000-0000-0000-0000-000000000101'::uuid,
  '00000000-0000-0000-0000-000000000102'::uuid,
  '00000000-0000-0000-0000-000000000103'::uuid,
  '00000000-0000-0000-0000-000000000104'::uuid,
  '00000000-0000-0000-0000-000000000105'::uuid
);
