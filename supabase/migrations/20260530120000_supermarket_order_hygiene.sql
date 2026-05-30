-- Supermarket order hygiene (demo/QA seed only)
--
-- Problem: demo seed outlets (UUID prefix 00000000-0000-0000-0000-*) were given
-- supermarket category while still carrying legacy rescue_bag orders/listings.
-- Merchant UI now filters by listing mode; this migration cancels/archives only
-- identifiable demo rows — never real customer orders (non-demo UUIDs untouched).
--
-- Bakehouse Kollupitiya (00000000-0000-0000-0000-000000000003) is the known case.

-- Cancel open demo bag orders at supermarket/grocery outlets (no shelf_id).
UPDATE public.orders o
SET
  order_status = 'cancelled',
  updated_at = now()
FROM public.outlets out
WHERE o.outlet_id = out.id
  AND out.category IN ('supermarket', 'grocery', 'groceries')
  AND o.shelf_id IS NULL
  AND o.bag_id IS NOT NULL
  AND o.order_status NOT IN ('cancelled', 'collected', 'refunded')
  AND o.id::text LIKE '00000000-0000-0000-0000-%';

-- Remove demo rescue bags still live at supermarket outlets (merchant inventory hygiene).
UPDATE public.rescue_bags rb
SET
  status = 'removed',
  updated_at = now()
FROM public.outlets out
WHERE rb.outlet_id = out.id
  AND out.category IN ('supermarket', 'grocery', 'groceries')
  AND rb.status IN ('live', 'draft')
  AND rb.id::text LIKE '00000000-0000-0000-0000-%';
