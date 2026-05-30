-- Per-mode demo listings: hybrid category, use_demo_listings, ensure RPC, Bakehouse seeds.
-- Hygiene migration (20260530120000) stays one-time; this restores demos and scopes future cancels.

-- ---------------------------------------------------------------------------
-- outlets: hybrid category + demo visibility flag
-- ---------------------------------------------------------------------------
alter table public.outlets drop constraint if exists outlets_category_check;

alter table public.outlets
  add constraint outlets_category_check check (
    category = any (
      array[
        'bakery'::text,
        'cafe'::text,
        'restaurant'::text,
        'supermarket'::text,
        'hybrid'::text,
        'hotel'::text,
        'other'::text
      ]
    )
  );

alter table public.outlets
  add column if not exists use_demo_listings boolean not null default true;

comment on column public.outlets.use_demo_listings is
  'When true, demo seed bags/shelves stay visible until the merchant publishes a non-demo listing for that mode.';

-- Demo seed outlets default to showing demos.
update public.outlets o
set use_demo_listings = true
where exists (
  select 1 from public.demo_seed_outlets d where d.outlet_id = o.id
);

-- ---------------------------------------------------------------------------
-- Auto-hide demos after first real listing per mode
-- ---------------------------------------------------------------------------
create or replace function public.sync_outlet_use_demo_listings_from_bag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.seed_demo, false) = false
    and lower(trim(coalesce(new.status, ''))) in ('live', 'draft') then
    update public.outlets
    set use_demo_listings = false, updated_at = now()
    where id = new.outlet_id;
  end if;
  return new;
end;
$$;

drop trigger if exists rescue_bags_sync_use_demo_listings on public.rescue_bags;
create trigger rescue_bags_sync_use_demo_listings
  after insert or update of status, seed_demo on public.rescue_bags
  for each row
  execute function public.sync_outlet_use_demo_listings_from_bag();

create or replace function public.sync_outlet_use_demo_listings_from_shelf()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.seed_demo, false) = false
    and lower(trim(coalesce(new.status, ''))) in ('draft', 'published') then
    update public.outlets
    set use_demo_listings = false, updated_at = now()
    where id = new.outlet_id;
  end if;
  return new;
end;
$$;

drop trigger if exists clearance_shelves_sync_use_demo_listings on public.clearance_shelves;
create trigger clearance_shelves_sync_use_demo_listings
  after insert or update of status, seed_demo on public.clearance_shelves
  for each row
  execute function public.sync_outlet_use_demo_listings_from_shelf();

-- ---------------------------------------------------------------------------
-- Listing mode helpers (SQL mirrors outletListingMode.ts)
-- ---------------------------------------------------------------------------
create or replace function public.outlet_listing_mode(p_category text)
returns text
language sql
immutable
as $$
  select case
    when lower(trim(coalesce(p_category, ''))) in ('supermarket', 'grocery', 'groceries')
      then 'clearance_shelf'
    when lower(trim(coalesce(p_category, ''))) in ('hybrid', 'hotel')
      then 'hybrid'
    else 'rescue_bag'
  end;
$$;

create or replace function public.outlet_can_publish_rescue_bags(p_category text)
returns boolean
language sql
immutable
as $$
  select public.outlet_listing_mode(p_category) in ('rescue_bag', 'hybrid');
$$;

create or replace function public.outlet_can_publish_clearance_shelves(p_category text)
returns boolean
language sql
immutable
as $$
  select public.outlet_listing_mode(p_category) in ('clearance_shelf', 'hybrid');
$$;

-- ---------------------------------------------------------------------------
-- _ensure_outlet_demo_listings_core — idempotent (no auth; migration + RPC)
-- ---------------------------------------------------------------------------
create or replace function public._ensure_outlet_demo_listings_core(p_outlet_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_outlet public.outlets;
  v_mode text;
  v_now timestamptz := now();
  v_pickup_start timestamptz := v_now + interval '30 minutes';
  v_pickup_end timestamptz := v_now + interval '4 hours';
  v_bag_pickup_start timestamptz := v_now - interval '1 hour';
  v_bag_pickup_end timestamptz := v_now + interval '8 hours';
  v_shelf_id uuid;
  v_today date := (timezone('utc', v_now))::date;
  v_show_demos boolean;
  v_has_real_bags boolean;
  v_has_real_shelves boolean;
begin
  select * into v_outlet from public.outlets where id = p_outlet_id;
  if not found then
    raise exception 'outlet_not_found';
  end if;

  v_mode := public.outlet_listing_mode(v_outlet.category);

  select exists (
    select 1 from public.rescue_bags rb
    where rb.outlet_id = p_outlet_id
      and coalesce(rb.seed_demo, false) = false
      and rb.status in ('live', 'draft')
  ) into v_has_real_bags;

  select exists (
    select 1 from public.clearance_shelves cs
    where cs.outlet_id = p_outlet_id
      and coalesce(cs.seed_demo, false) = false
      and cs.status in ('draft', 'published')
  ) into v_has_real_shelves;

  v_show_demos := coalesce(v_outlet.use_demo_listings, true);

  -- Rescue bags for bag + hybrid modes
  if v_show_demos
    and not v_has_real_bags
    and public.outlet_can_publish_rescue_bags(v_outlet.category) then
    -- Bakehouse / known demo outlet bag UUIDs (stable UUIDs only; no broad re-live)
    if p_outlet_id = '00000000-0000-0000-0000-000000000003'::uuid then
      insert into public.rescue_bags (
        id,
        outlet_id,
        title,
        category,
        retail_value_estimate,
        rescue_price,
        quantity_total,
        quantity_remaining,
        pickup_start,
        pickup_end,
        notes,
        allergens,
        image_url,
        status,
        seed_demo,
        estimated_weight_kg
      )
      values
        (
          '00000000-0000-0000-0000-000000000004'::uuid,
          p_outlet_id,
          '[Demo] Surprise Pastries Bag',
          'bakery',
          1800,
          650,
          12,
          4,
          v_bag_pickup_start,
          v_bag_pickup_end,
          'Mixed pastries and breads',
          array['Gluten', 'Dairy']::text[],
          'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800',
          'live',
          true,
          1.0
        ),
        (
          '00000000-0000-0000-0000-000000000014'::uuid,
          p_outlet_id,
          '[Demo] Evening Bread Rescue',
          'bakery',
          2200,
          750,
          8,
          3,
          v_bag_pickup_start,
          v_bag_pickup_end,
          'End-of-day breads',
          array['Gluten']::text[],
          'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
          'live',
          true,
          1.2
        ),
        (
          '00000000-0000-0000-0000-000000000101'::uuid,
          p_outlet_id,
          '[Demo] Bakery Croissant Box',
          'bakery',
          1600,
          600,
          10,
          5,
          v_bag_pickup_start,
          v_bag_pickup_end,
          'Assorted croissants',
          array['Gluten', 'Dairy', 'Eggs']::text[],
          'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800',
          'live',
          true,
          0.8
        )
      on conflict (id) do update set
        outlet_id = excluded.outlet_id,
        title = excluded.title,
        status = 'live',
        seed_demo = true,
        pickup_start = excluded.pickup_start,
        pickup_end = excluded.pickup_end,
        quantity_remaining = greatest(public.rescue_bags.quantity_remaining, 1),
        updated_at = v_now;

      update public.rescue_bags rb
      set status = 'removed', updated_at = v_now
      where rb.outlet_id = p_outlet_id
        and rb.id = '00000000-0000-0000-0000-000000000104'::uuid
        and public.outlet_listing_mode(v_outlet.category) = 'rescue_bag';
    end if;
  elsif public.outlet_listing_mode(v_outlet.category) = 'clearance_shelf' then
    update public.rescue_bags
    set status = 'removed', updated_at = v_now
    where outlet_id = p_outlet_id
      and seed_demo = true
      and status = 'live';
  end if;

  -- Clearance shelves for shelf + hybrid modes
  if v_show_demos
    and not v_has_real_shelves
    and public.outlet_can_publish_clearance_shelves(v_outlet.category) then
    if p_outlet_id = '00000000-0000-0000-0000-000000000003'::uuid then
      insert into public.clearance_shelves (
        id,
        outlet_id,
        shelf_date,
        status,
        pickup_start,
        pickup_end,
        notes,
        seed_demo,
        published_at
      )
      values (
        '00000000-0000-0000-0000-000000000201'::uuid,
        p_outlet_id,
        v_today,
        'published',
        v_pickup_start,
        v_pickup_end,
        '[Demo] Today''s clearance shelf',
        true,
        v_now
      )
      on conflict (outlet_id, shelf_date) do update set
        status = 'published',
        seed_demo = true,
        pickup_start = excluded.pickup_start,
        pickup_end = excluded.pickup_end,
        published_at = coalesce(public.clearance_shelves.published_at, excluded.published_at),
        updated_at = v_now
      returning id into v_shelf_id;

      if v_shelf_id is null then
        select id into v_shelf_id
        from public.clearance_shelves
        where outlet_id = p_outlet_id and shelf_date = v_today;
      end if;

      insert into public.clearance_shelf_items (
        id,
        shelf_id,
        name_snapshot,
        brand_snapshot,
        rescue_price,
        retail_price,
        quantity_total,
        quantity_remaining,
        sort_order,
        status
      )
      values
        (
          '00000000-0000-0000-0000-000000000211'::uuid,
          v_shelf_id,
          '[Demo] Fresh milk 1L',
          'Highland',
          180,
          320,
          6,
          6,
          0,
          'live'
        ),
        (
          '00000000-0000-0000-0000-000000000212'::uuid,
          v_shelf_id,
          '[Demo] Wholemeal bread',
          'Bakehouse',
          120,
          220,
          8,
          8,
          1,
          'live'
        ),
        (
          '00000000-0000-0000-0000-000000000213'::uuid,
          v_shelf_id,
          '[Demo] Natural yogurt 500g',
          'Kotmale',
          150,
          280,
          5,
          5,
          2,
          'live'
        ),
        (
          '00000000-0000-0000-0000-000000000214'::uuid,
          v_shelf_id,
          '[Demo] Free-range eggs (6)',
          'Local',
          200,
          360,
          4,
          4,
          3,
          'live'
        ),
        (
          '00000000-0000-0000-0000-000000000215'::uuid,
          v_shelf_id,
          '[Demo] Ripe bananas bunch',
          'Fresh',
          90,
          160,
          10,
          10,
          4,
          'live'
        )
      on conflict (id) do update set
        shelf_id = excluded.shelf_id,
        name_snapshot = excluded.name_snapshot,
        rescue_price = excluded.rescue_price,
        quantity_remaining = excluded.quantity_total,
        status = 'live',
        updated_at = v_now;
    else
      update public.clearance_shelves cs
      set
        status = 'published',
        pickup_start = v_pickup_start,
        pickup_end = v_pickup_end,
        seed_demo = true,
        published_at = coalesce(cs.published_at, v_now),
        updated_at = v_now
      where cs.outlet_id = p_outlet_id
        and cs.seed_demo = true
        and cs.status in ('draft', 'published', 'closed');
    end if;
  end if;

  perform public.refresh_demo_rescue_bag_pickup_windows();
  perform public.refresh_demo_clearance_shelf_pickup_windows();
end;
$$;

create or replace function public.ensure_outlet_demo_listings(p_outlet_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
    and not public.is_merchant_staff_for_outlet(p_outlet_id) then
    raise exception 'forbidden';
  end if;
  perform public._ensure_outlet_demo_listings_core(p_outlet_id);
end;
$$;

comment on function public.ensure_outlet_demo_listings(uuid) is
  'Ensures demo rescue bags and/or clearance shelves exist for the outlet''s current listing mode; respects use_demo_listings and real listings.';

revoke all on function public.ensure_outlet_demo_listings(uuid) from public;
grant execute on function public.ensure_outlet_demo_listings(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Backfill Bakehouse (demo outlet ...003) for current category
-- ---------------------------------------------------------------------------
select public._ensure_outlet_demo_listings_core('00000000-0000-0000-0000-000000000003'::uuid);
