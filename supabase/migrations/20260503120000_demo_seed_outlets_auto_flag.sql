-- Auto-mark bags as seed_demo when they belong to known demo outlets (dev/staging).
-- On production, if these outlet UUIDs do not exist, demo_seed_outlets stays empty and this is a no-op.

CREATE TABLE IF NOT EXISTS public.demo_seed_outlets (
  outlet_id uuid PRIMARY KEY REFERENCES public.outlets (id) ON DELETE CASCADE
);

COMMENT ON TABLE public.demo_seed_outlets IS
  'QA/demo pickup outlets. New or moved rescue_bags here get seed_demo synced for cron refresh. Add rows only for dev seed outlets; production DBs without these outlets get zero rows.';

REVOKE ALL ON TABLE public.demo_seed_outlets FROM PUBLIC;


INSERT INTO public.demo_seed_outlets (outlet_id)
SELECT o.id
FROM public.outlets o
WHERE o.id IN (
  '00000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000013'::uuid
)
ON CONFLICT (outlet_id) DO NOTHING;


CREATE OR REPLACE FUNCTION public.rescue_bags_sync_seed_demo_from_outlet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.seed_demo := EXISTS (
    SELECT 1
    FROM public.demo_seed_outlets d
    WHERE d.outlet_id = NEW.outlet_id
  );
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.rescue_bags_sync_seed_demo_from_outlet() IS
  'Keeps rescue_bags.seed_demo in sync with demo_seed_outlets (insert + outlet_id changes only).';


DROP TRIGGER IF EXISTS rescue_bags_sync_seed_demo_bi ON public.rescue_bags;

CREATE TRIGGER rescue_bags_sync_seed_demo_bi
  BEFORE INSERT OR UPDATE OF outlet_id ON public.rescue_bags
  FOR EACH ROW
  EXECUTE FUNCTION public.rescue_bags_sync_seed_demo_from_outlet();


UPDATE public.rescue_bags rb
SET seed_demo = EXISTS (
    SELECT 1 FROM public.demo_seed_outlets d WHERE d.outlet_id = rb.outlet_id
);

REVOKE ALL ON FUNCTION public.rescue_bags_sync_seed_demo_from_outlet() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rescue_bags_sync_seed_demo_from_outlet() TO postgres;
