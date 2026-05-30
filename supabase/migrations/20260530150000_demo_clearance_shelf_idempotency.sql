-- Fix demo clearance shelf reseeding when the stable shelf UUID already exists
-- for a prior day. Keep today's shelf if it already exists; otherwise roll the
-- stable demo UUID forward by primary key.

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
      select cs.id into v_shelf_id
      from public.clearance_shelves cs
      where cs.outlet_id = p_outlet_id
        and cs.shelf_date = v_today
      order by case when cs.id = '00000000-0000-0000-0000-000000000201'::uuid then 0 else 1 end,
        cs.created_at desc
      limit 1;

      if v_shelf_id is null then
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
        on conflict (id) do update set
          outlet_id = excluded.outlet_id,
          shelf_date = excluded.shelf_date,
          status = 'published',
          pickup_start = excluded.pickup_start,
          pickup_end = excluded.pickup_end,
          notes = excluded.notes,
          seed_demo = true,
          published_at = case
            when public.clearance_shelves.shelf_date = excluded.shelf_date
              then coalesce(public.clearance_shelves.published_at, excluded.published_at)
            else excluded.published_at
          end,
          closed_at = null,
          updated_at = v_now
        returning id into v_shelf_id;
      else
        update public.clearance_shelves cs
        set
          status = 'published',
          pickup_start = v_pickup_start,
          pickup_end = v_pickup_end,
          notes = '[Demo] Today''s clearance shelf',
          seed_demo = true,
          published_at = coalesce(cs.published_at, v_now),
          closed_at = null,
          updated_at = v_now
        where cs.id = v_shelf_id;
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
        closed_at = null,
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
