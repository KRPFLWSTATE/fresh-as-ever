-- Remove live demo rescue bags at clearance-shelf-only outlets (supermarket / grocery).
update public.rescue_bags rb
set status = 'removed', updated_at = now()
from public.outlets o
where rb.outlet_id = o.id
  and public.outlet_listing_mode(o.category) = 'clearance_shelf'
  and coalesce(rb.seed_demo, false) = true
  and lower(trim(coalesce(rb.status, ''))) in ('live', 'draft');
