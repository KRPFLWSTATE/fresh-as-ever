-- Clearance Shelf model: product_catalog, clearance_shelves, clearance_shelf_items, order_items, orders.shelf_id

-- ---------------------------------------------------------------------------
-- product_catalog
-- ---------------------------------------------------------------------------
create table if not exists public.product_catalog (
  id uuid primary key default gen_random_uuid(),
  barcode text not null unique,
  name text not null,
  brand text,
  category text,
  image_url text,
  allergens text[] not null default '{}',
  is_halal_hint boolean,
  ingredients_summary text,
  weight_grams numeric,
  source text not null check (source in
    ('openfoodfacts', 'openproductsfacts', 'merchant_submitted')),
  is_disabled boolean not null default false,
  submitted_by_user_id uuid references public.profiles(id),
  lookup_count int not null default 1,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_catalog_name_idx
  on public.product_catalog (lower(name));

create index if not exists product_catalog_barcode_idx
  on public.product_catalog (barcode);

-- ---------------------------------------------------------------------------
-- clearance_shelves
-- ---------------------------------------------------------------------------
create table if not exists public.clearance_shelves (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets(id) on delete cascade,
  shelf_date date not null default (timezone('utc', now()))::date,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'closed', 'archived')),
  pickup_start timestamptz not null,
  pickup_end timestamptz not null,
  notes text,
  seed_demo boolean not null default false,
  published_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (outlet_id, shelf_date),
  check (pickup_start < pickup_end)
);

create index if not exists clearance_shelves_outlet_status_idx
  on public.clearance_shelves (outlet_id, status, pickup_end);

-- ---------------------------------------------------------------------------
-- clearance_shelf_items
-- ---------------------------------------------------------------------------
create table if not exists public.clearance_shelf_items (
  id uuid primary key default gen_random_uuid(),
  shelf_id uuid not null references public.clearance_shelves(id) on delete cascade,
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
  quantity_remaining int not null check (quantity_remaining >= 0),
  status text not null default 'live'
    check (status in ('live', 'sold_out', 'removed')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (quantity_remaining <= quantity_total)
);

create index if not exists clearance_shelf_items_shelf_idx
  on public.clearance_shelf_items (shelf_id, status);

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  shelf_item_id uuid references public.clearance_shelf_items(id),
  product_id uuid references public.product_catalog(id),
  name_snapshot text not null,
  image_url_snapshot text,
  allergens_snapshot text[] not null default '{}',
  unit_price numeric(10, 2) not null,
  quantity int not null check (quantity > 0),
  line_total numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx
  on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- orders.shelf_id
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists shelf_id uuid references public.clearance_shelves(id);

create index if not exists orders_shelf_id_idx
  on public.orders (shelf_id)
  where shelf_id is not null;

-- Shelf orders use reservation_code on orders (like single bag), not group_id
alter table public.orders drop constraint if exists orders_bag_or_shelf_chk;
alter table public.orders add constraint orders_bag_or_shelf_chk check (
  (bag_id is not null and shelf_id is null)
  or (bag_id is null and shelf_id is not null)
  or (bag_id is null and shelf_id is null)
);

-- ---------------------------------------------------------------------------
-- Inventory trigger (order_items insert)
-- ---------------------------------------------------------------------------
create or replace function public.decrement_clearance_item_on_reserve()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_remaining int;
begin
  if tg_op <> 'INSERT' then
    return new;
  end if;
  if new.shelf_item_id is null then
    return new;
  end if;

  update public.clearance_shelf_items csi
  set
    quantity_remaining = csi.quantity_remaining - new.quantity,
    status = case
      when csi.quantity_remaining - new.quantity <= 0 then 'sold_out'
      else csi.status
    end,
    updated_at = now()
  where csi.id = new.shelf_item_id
    and csi.quantity_remaining >= new.quantity
    and csi.status = 'live'
  returning csi.quantity_remaining into v_remaining;

  if not found then
    raise exception 'clearance_item_sold_out' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_decrement_clearance_item_on_reserve on public.order_items;
create trigger trg_decrement_clearance_item_on_reserve
  after insert on public.order_items
  for each row
  execute function public.decrement_clearance_item_on_reserve();

-- ---------------------------------------------------------------------------
-- Auto-archive published shelves past pickup_end
-- ---------------------------------------------------------------------------
create or replace function public.auto_archive_clearance_shelves()
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  update public.clearance_shelves
  set
    status = 'archived',
    closed_at = coalesce(closed_at, now()),
    updated_at = now()
  where status = 'published'
    and pickup_end < now();
end;
$$;

-- ---------------------------------------------------------------------------
-- submit_product_to_catalog
-- ---------------------------------------------------------------------------
create or replace function public.submit_product_to_catalog(
  p_barcode text,
  p_name text,
  p_brand text default null,
  p_category text default null,
  p_allergens text[] default '{}',
  p_is_halal_hint boolean default null,
  p_image_url text default null
)
returns public.product_catalog
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_row public.product_catalog;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'authentication_required';
  end if;

  if not exists (
    select 1 from public.merchant_staff ms where ms.user_id = v_uid
  ) then
    raise exception 'not_a_merchant';
  end if;

  if p_barcode is null or p_barcode !~ '^[0-9]{8,14}$' then
    raise exception 'invalid_barcode';
  end if;

  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'empty_name';
  end if;

  insert into public.product_catalog (
    barcode,
    name,
    brand,
    category,
    allergens,
    is_halal_hint,
    image_url,
    source,
    submitted_by_user_id,
    lookup_count,
    last_seen_at
  )
  values (
    trim(p_barcode),
    trim(p_name),
    nullif(trim(coalesce(p_brand, '')), ''),
    nullif(trim(coalesce(p_category, '')), ''),
    coalesce(p_allergens, '{}'),
    p_is_halal_hint,
    nullif(trim(coalesce(p_image_url, '')), ''),
    'merchant_submitted',
    v_uid,
    1,
    now()
  )
  on conflict (barcode) do update set
    name = excluded.name,
    brand = coalesce(excluded.brand, product_catalog.brand),
    category = coalesce(excluded.category, product_catalog.category),
    allergens = case
      when cardinality(excluded.allergens) > 0 then excluded.allergens
      else product_catalog.allergens
    end,
    is_halal_hint = coalesce(excluded.is_halal_hint, product_catalog.is_halal_hint),
    image_url = coalesce(excluded.image_url, product_catalog.image_url),
    source = 'merchant_submitted',
    submitted_by_user_id = coalesce(product_catalog.submitted_by_user_id, excluded.submitted_by_user_id),
    lookup_count = product_catalog.lookup_count + 1,
    last_seen_at = now(),
    updated_at = now(),
    is_disabled = false
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.submit_product_to_catalog(text, text, text, text, text[], boolean, text) from public;
grant execute on function public.submit_product_to_catalog(text, text, text, text, text[], boolean, text) to authenticated;

-- ---------------------------------------------------------------------------
-- clone_shelf_to_today
-- ---------------------------------------------------------------------------
create or replace function public.clone_shelf_to_today(p_source_shelf_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_uid uuid := auth.uid();
  v_src public.clearance_shelves;
  v_new_id uuid;
  v_today date := (timezone('utc', now()))::date;
begin
  if v_uid is null then
    raise exception 'authentication_required';
  end if;

  select * into v_src
  from public.clearance_shelves
  where id = p_source_shelf_id;

  if not found then
    raise exception 'source_shelf_not_found';
  end if;

  if not public.is_merchant_staff_for_outlet(v_src.outlet_id) then
    raise exception 'forbidden';
  end if;

  if exists (
    select 1 from public.clearance_shelves cs
    where cs.outlet_id = v_src.outlet_id and cs.shelf_date = v_today
  ) then
    raise exception 'today_shelf_exists';
  end if;

  insert into public.clearance_shelves (
    outlet_id,
    shelf_date,
    status,
    pickup_start,
    pickup_end,
    notes
  )
  values (
    v_src.outlet_id,
    v_today,
    'draft',
    v_src.pickup_start + (v_today - v_src.shelf_date),
    v_src.pickup_end + (v_today - v_src.shelf_date),
    v_src.notes
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
  from public.clearance_shelf_items
  where shelf_id = p_source_shelf_id
    and status <> 'removed';

  return v_new_id;
end;
$$;

revoke all on function public.clone_shelf_to_today(uuid) from public;
grant execute on function public.clone_shelf_to_today(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- create_clearance_reservation
-- ---------------------------------------------------------------------------
create or replace function public.create_clearance_reservation(
  p_shelf_id uuid,
  p_items jsonb,
  p_payment_method text,
  p_promo_code text default null
)
returns table (
  order_id uuid,
  reservation_code varchar(6),
  total numeric
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_customer uuid;
  v_shelf public.clearance_shelves;
  v_outlet_id uuid;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_total numeric := 0;
  v_code varchar(6);
  v_order_id uuid;
  v_promo_id uuid;
  v_promo_dtype text;
  v_promo_dval numeric;
  v_attempt int;
  v_item jsonb;
  v_shelf_item_id uuid;
  v_qty int;
  v_unit numeric;
  v_line numeric;
  v_si record;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  v_customer := auth.uid();

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 then
    raise exception 'invalid_items_payload';
  end if;

  if lower(trim(coalesce(p_payment_method, ''))) not in ('cash', 'card') then
    raise exception 'invalid_payment_method';
  end if;

  select * into v_shelf
  from public.clearance_shelves
  where id = p_shelf_id
  for update;

  if not found then
    raise exception 'shelf_not_found';
  end if;

  if lower(trim(v_shelf.status)) <> 'published' then
    raise exception 'shelf_not_published';
  end if;

  if v_shelf.pickup_end < now() then
    raise exception 'shelf_pickup_ended';
  end if;

  v_outlet_id := v_shelf.outlet_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_shelf_item_id := (v_item->>'shelf_item_id')::uuid;
    v_qty := coalesce((v_item->>'quantity')::int, 0);

    if v_shelf_item_id is null or v_qty < 1 then
      raise exception 'invalid_items_payload';
    end if;

    select * into v_si
    from public.clearance_shelf_items csi
    where csi.id = v_shelf_item_id
      and csi.shelf_id = p_shelf_id
    for update;

    if not found then
      raise exception 'invalid_items_payload';
    end if;

    if v_si.status <> 'live' or v_si.quantity_remaining < v_qty then
      raise exception 'clearance_item_sold_out';
    end if;

    v_unit := coalesce(v_si.rescue_price, 0);
    v_line := v_unit * v_qty;
    v_subtotal := v_subtotal + v_line;
  end loop;

  if p_promo_code is not null and length(trim(p_promo_code)) > 0 then
    select pc.id, pc.discount_type, pc.discount_value
    into v_promo_id, v_promo_dtype, v_promo_dval
    from public.promo_codes pc
    where upper(trim(pc.code)) = upper(trim(p_promo_code))
      and pc.is_active = true
      and (pc.valid_from is null or pc.valid_from <= now())
      and (pc.valid_until is null or pc.valid_until >= now())
      and (pc.max_uses is null or coalesce(pc.used_count, 0) < pc.max_uses)
    limit 1;

    if v_promo_id is not null then
      if lower(trim(coalesce(v_promo_dtype, ''))) = 'fixed' then
        v_discount := least(v_promo_dval, v_subtotal);
      else
        v_discount := round((v_subtotal * coalesce(v_promo_dval, 0)) / 100);
      end if;
      v_discount := greatest(0, least(v_discount, v_subtotal));
    end if;
  end if;

  v_total := greatest(0, v_subtotal - v_discount);

  for v_attempt in 1..6 loop
    v_code := public.generate_reservation_code(6);
    begin
      insert into public.orders (
        shelf_id,
        customer_id,
        outlet_id,
        quantity,
        unit_price,
        subtotal,
        platform_fee,
        total,
        payment_method,
        payment_status,
        order_status,
        reservation_code,
        discount_amount,
        promo_code_id
      )
      values (
        p_shelf_id,
        v_customer,
        v_outlet_id,
        1,
        v_subtotal,
        v_subtotal,
        0,
        v_total,
        lower(trim(p_payment_method)),
        'pending',
        'reserved',
        v_code,
        v_discount,
        v_promo_id
      )
      returning id into v_order_id;
      exit;
    exception
      when unique_violation then
        if v_attempt >= 6 then
          raise;
        end if;
    end;
  end loop;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_shelf_item_id := (v_item->>'shelf_item_id')::uuid;
    v_qty := (v_item->>'quantity')::int;

    select * into v_si
    from public.clearance_shelf_items csi
    where csi.id = v_shelf_item_id;

    v_unit := coalesce(v_si.rescue_price, 0);
    v_line := v_unit * v_qty;

    insert into public.order_items (
      order_id,
      shelf_item_id,
      product_id,
      name_snapshot,
      image_url_snapshot,
      allergens_snapshot,
      unit_price,
      quantity,
      line_total
    )
    values (
      v_order_id,
      v_shelf_item_id,
      v_si.product_id,
      v_si.name_snapshot,
      v_si.image_url_snapshot,
      coalesce(v_si.allergens_snapshot, '{}'),
      v_unit,
      v_qty,
      v_line
    );
  end loop;

  order_id := v_order_id;
  reservation_code := v_code;
  total := v_total;
  return next;
end;
$$;

revoke all on function public.create_clearance_reservation(uuid, jsonb, text, text) from public;
grant execute on function public.create_clearance_reservation(uuid, jsonb, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- merchant_collect_clearance_order
-- ---------------------------------------------------------------------------
create or replace function public.merchant_collect_clearance_order(
  p_order_id uuid,
  p_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_outlet uuid;
  v_code varchar;
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  select o.outlet_id, o.reservation_code, o.order_status
  into v_outlet, v_code, v_status
  from public.orders o
  where o.id = p_order_id
    and o.shelf_id is not null;

  if not found then
    raise exception 'order_not_found';
  end if;

  if not public.is_merchant_staff_for_outlet(v_outlet) then
    raise exception 'forbidden';
  end if;

  if lower(trim(coalesce(v_status, ''))) = 'collected' then
    raise exception 'already_collected';
  end if;

  if p_code is not null and length(trim(p_code)) > 0 then
    if upper(replace(trim(p_code), ' ', '')) <> upper(replace(trim(v_code::text), ' ', '')) then
      raise exception 'code_mismatch';
    end if;
  end if;

  update public.orders o
  set
    order_status = 'collected',
    collected_at = now(),
    updated_at = now(),
    customer_arrived_at = null
  where o.id = p_order_id
    and o.shelf_id is not null
    and lower(trim(o.order_status)) not in ('collected', 'cancelled', 'no_show', 'refunded');

  return jsonb_build_object('ok', true, 'order_id', p_order_id);
end;
$$;

revoke all on function public.merchant_collect_clearance_order(uuid, text) from public;
grant execute on function public.merchant_collect_clearance_order(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.product_catalog enable row level security;

drop policy if exists "Authenticated read product catalog" on public.product_catalog;
create policy "Authenticated read product catalog"
  on public.product_catalog
  for select
  to authenticated
  using (is_disabled = false);

alter table public.clearance_shelves enable row level security;

drop policy if exists "Customers read published clearance shelves" on public.clearance_shelves;
create policy "Customers read published clearance shelves"
  on public.clearance_shelves
  for select
  to authenticated
  using (status = 'published' and pickup_end > now());

drop policy if exists "Merchants manage clearance shelves" on public.clearance_shelves;
create policy "Merchants manage clearance shelves"
  on public.clearance_shelves
  for all
  to authenticated
  using (public.is_merchant_staff_for_outlet(outlet_id))
  with check (public.is_merchant_staff_for_outlet(outlet_id));

alter table public.clearance_shelf_items enable row level security;

drop policy if exists "Customers read live shelf items" on public.clearance_shelf_items;
create policy "Customers read live shelf items"
  on public.clearance_shelf_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.clearance_shelves cs
      where cs.id = clearance_shelf_items.shelf_id
        and cs.status = 'published'
        and cs.pickup_end > now()
    )
    and status in ('live', 'sold_out')
  );

drop policy if exists "Merchants manage shelf items" on public.clearance_shelf_items;
create policy "Merchants manage shelf items"
  on public.clearance_shelf_items
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.clearance_shelves cs
      where cs.id = clearance_shelf_items.shelf_id
        and public.is_merchant_staff_for_outlet(cs.outlet_id)
    )
  )
  with check (
    exists (
      select 1
      from public.clearance_shelves cs
      where cs.id = clearance_shelf_items.shelf_id
        and public.is_merchant_staff_for_outlet(cs.outlet_id)
    )
  );

alter table public.order_items enable row level security;

drop policy if exists "Customers read own order items" on public.order_items;
create policy "Customers read own order items"
  on public.order_items
  for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.customer_id = auth.uid()
    )
  );

drop policy if exists "Merchants read outlet order items" on public.order_items;
create policy "Merchants read outlet order items"
  on public.order_items
  for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and public.is_merchant_staff_for_outlet(o.outlet_id)
    )
  );

-- Service role / edge function uses service role for catalog writes from lookup-product-barcode
