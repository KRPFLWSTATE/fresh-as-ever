-- Demo pickup window refresh for clearance shelves (mirrors rescue_bags demo cron pattern).

create or replace function public.refresh_demo_clearance_shelf_pickup_windows()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
  update public.clearance_shelves
  set
    pickup_start = v_now + interval '30 minutes',
    pickup_end = v_now + interval '4 hours',
    updated_at = v_now
  where seed_demo = true
    and status in ('draft', 'published');
end;
$$;

comment on function public.refresh_demo_clearance_shelf_pickup_windows() is
  'Slides demo clearance shelf pickup windows forward; only rows with seed_demo=true.';
