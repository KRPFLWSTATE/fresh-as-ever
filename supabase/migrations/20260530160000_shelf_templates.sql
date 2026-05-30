-- Shelf templates: reusable item sets separate from clone_shelf_to_today (yesterday copy).

create table if not exists public.shelf_templates (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  name text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shelf_templates_outlet_idx
  on public.shelf_templates (outlet_id, updated_at desc);

create table if not exists public.shelf_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.shelf_templates(id) on delete cascade,
  product_id uuid references public.product_catalog(id),
  barcode text,
  name_snapshot text not null,
  brand_snapshot text,
  image_url_snapshot text,
  allergens_snapshot text[] not null default '{}',
  is_halal boolean,
  retail_price numeric(10, 2),
  rescue_price numeric(10, 2) not null check (rescue_price >= 0),
  quantity_total int not null check (quantity_total > 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists shelf_template_items_template_idx
  on public.shelf_template_items (template_id, sort_order);

alter table public.shelf_templates enable row level security;
alter table public.shelf_template_items enable row level security;

create policy shelf_templates_merchant_rw on public.shelf_templates
  for all to authenticated
  using (public.is_merchant_staff_for_outlet(outlet_id))
  with check (public.is_merchant_staff_for_outlet(outlet_id));

create policy shelf_template_items_merchant_rw on public.shelf_template_items
  for all to authenticated
  using (
    exists (
      select 1 from public.shelf_templates st
      where st.id = template_id
        and public.is_merchant_staff_for_outlet(st.outlet_id)
    )
  )
  with check (
    exists (
      select 1 from public.shelf_templates st
      where st.id = template_id
        and public.is_merchant_staff_for_outlet(st.outlet_id)
    )
  );

-- Clone a saved template into today's draft shelf (distinct from clone_shelf_to_today).
create or replace function public.clone_template_to_today(p_template_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_uid uuid := auth.uid();
  v_tpl public.shelf_templates;
  v_new_id uuid;
  v_today date := (timezone('utc', now()))::date;
  v_pickup_start timestamptz;
  v_pickup_end timestamptz;
begin
  if v_uid is null then
    raise exception 'authentication_required';
  end if;

  select * into v_tpl from public.shelf_templates where id = p_template_id;
  if not found then
    raise exception 'template_not_found';
  end if;

  if not public.is_merchant_staff_for_outlet(v_tpl.outlet_id) then
    raise exception 'forbidden';
  end if;

  if exists (
    select 1 from public.clearance_shelves cs
    where cs.outlet_id = v_tpl.outlet_id and cs.shelf_date = v_today
  ) then
    raise exception 'today_shelf_exists';
  end if;

  v_pickup_start := timezone('utc', now()) + interval '30 minutes';
  v_pickup_end := v_pickup_start + interval '4 hours';

  insert into public.clearance_shelves (
    outlet_id,
    shelf_date,
    status,
    pickup_start,
    pickup_end,
    notes
  )
  values (
    v_tpl.outlet_id,
    v_today,
    'draft',
    v_pickup_start,
    v_pickup_end,
    v_tpl.notes
  )
  returning id into v_new_id;

  insert into public.clearance_shelf_items (
    shelf_id,
    product_id,
    barcode,
    name_snapshot,
    brand_snapshot,
    image_url_snapshot,
    allergens_snapshot,
    is_halal,
    retail_price,
    rescue_price,
    quantity_total,
    quantity_remaining,
    status,
    sort_order
  )
  select
    v_new_id,
    product_id,
    barcode,
    name_snapshot,
    brand_snapshot,
    image_url_snapshot,
    allergens_snapshot,
    is_halal,
    retail_price,
    rescue_price,
    quantity_total,
    quantity_total,
    'live',
    sort_order
  from public.shelf_template_items
  where template_id = p_template_id;

  return v_new_id;
end;
$$;

revoke all on function public.clone_template_to_today(uuid) from public;
grant execute on function public.clone_template_to_today(uuid) to authenticated;
