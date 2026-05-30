-- Group reservations: up to 5 bags, one shared code, card-only when bag_count > 1

create table if not exists public.reservation_groups (
  id uuid primary key default gen_random_uuid(),
  reservation_code varchar(6) not null,
  customer_id uuid not null references public.profiles(id),
  outlet_id uuid not null references public.outlets(id),
  bag_count smallint not null check (bag_count >= 1 and bag_count <= 5),
  subtotal numeric(10, 2) not null,
  discount_amount numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  payment_method text not null check (payment_method in ('cash', 'card')),
  payment_status text not null default 'pending',
  order_status text not null default 'reserved',
  payhere_payment_id text,
  promo_code_id uuid references public.promo_codes(id),
  pickup_start timestamptz not null,
  pickup_end timestamptz not null,
  pickup_reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists reservation_groups_code_unique
  on public.reservation_groups (reservation_code)
  where reservation_code is not null;

create index if not exists reservation_groups_customer_id_idx
  on public.reservation_groups (customer_id);

create index if not exists reservation_groups_outlet_id_idx
  on public.reservation_groups (outlet_id);

alter table public.orders
  add column if not exists group_id uuid references public.reservation_groups(id);

create index if not exists orders_group_id_idx
  on public.orders (group_id)
  where group_id is not null;

-- Relax per-order code uniqueness: code lives on reservation_groups for groups
drop index if exists public.orders_reservation_code_unique;
create unique index if not exists orders_reservation_code_unique
  on public.orders (reservation_code)
  where reservation_code is not null and group_id is null;

create or replace function public.reservation_groups_enforce_card_only()
returns trigger
language plpgsql
as $$
begin
  if new.bag_count > 1 and lower(trim(new.payment_method)) = 'cash' then
    raise exception 'group_reservation_requires_card'
      using message = 'Group reservations require card payment.',
            hint = 'Select card to reserve more than one bag.';
  end if;
  return new;
end;
$$;

drop trigger if exists reservation_groups_card_only_bi on public.reservation_groups;
create trigger reservation_groups_card_only_bi
  before insert or update of payment_method, bag_count on public.reservation_groups
  for each row
  execute function public.reservation_groups_enforce_card_only();

create or replace function public.generate_reservation_code(p_len int default 6)
returns varchar
language plpgsql
as $$
declare
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_result varchar := '';
  i int;
begin
  for i in 1..greatest(p_len, 4) loop
    v_result := v_result || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
  end loop;
  return v_result;
end;
$$;

create or replace function public.create_group_reservation(
  p_bag_ids uuid[],
  p_payment_method text,
  p_promo_code text default null
)
returns table (
  group_id uuid,
  reservation_code varchar(6),
  total numeric
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_customer uuid;
  v_bag_count int;
  v_outlet_id uuid;
  v_pickup_start timestamptz;
  v_pickup_end timestamptz;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_total numeric := 0;
  v_code varchar(6);
  v_group_id uuid;
  v_promo_id uuid;
  v_promo_dtype text;
  v_promo_dval numeric;
  v_bag record;
  v_per_discount numeric;
  v_attempt int;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  v_customer := auth.uid();
  v_bag_count := coalesce(array_length(p_bag_ids, 1), 0);

  if v_bag_count < 1 or v_bag_count > 5 then
    raise exception 'invalid_bag_count'
      using message = 'Select between 1 and 5 bags.';
  end if;

  if lower(trim(coalesce(p_payment_method, ''))) not in ('cash', 'card') then
    raise exception 'invalid_payment_method';
  end if;

  if v_bag_count > 1 and lower(trim(p_payment_method)) = 'cash' then
    raise exception 'group_reservation_requires_card';
  end if;

  for v_bag in
    select rb.*
    from public.rescue_bags rb
    where rb.id = any (p_bag_ids)
    for update
  loop
    if v_outlet_id is null then
      v_outlet_id := v_bag.outlet_id;
      v_pickup_start := v_bag.pickup_start;
      v_pickup_end := v_bag.pickup_end;
    elsif v_outlet_id is distinct from v_bag.outlet_id then
      raise exception 'outlet_mismatch'
        using message = 'All bags must be from the same outlet.';
    end if;

    if lower(trim(coalesce(v_bag.status, ''))) not in ('live', 'draft') then
      raise exception 'bag_not_available';
    end if;

    if coalesce(v_bag.quantity_remaining, 0) < 1 then
      raise exception 'bag_sold_out';
    end if;

    v_subtotal := v_subtotal + coalesce(v_bag.rescue_price, 0);

    if v_pickup_start is null or (v_bag.pickup_start is not null and v_bag.pickup_start > v_pickup_start) then
      v_pickup_start := v_bag.pickup_start;
    end if;
    if v_pickup_end is null or (v_bag.pickup_end is not null and v_bag.pickup_end < v_pickup_end) then
      v_pickup_end := v_bag.pickup_end;
    end if;
  end loop;

  if v_outlet_id is null then
    raise exception 'bags_not_found';
  end if;

  if (
    select count(distinct rb.id)::int
    from public.rescue_bags rb
    where rb.id = any (p_bag_ids)
  ) <> v_bag_count then
    raise exception 'bags_not_found';
  end if;

  if v_pickup_start is not null and v_pickup_end is not null and v_pickup_start > v_pickup_end then
    raise exception 'pickup_windows_incompatible';
  end if;

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
      insert into public.reservation_groups (
        reservation_code,
        customer_id,
        outlet_id,
        bag_count,
        subtotal,
        discount_amount,
        total,
        payment_method,
        payment_status,
        order_status,
        promo_code_id,
        pickup_start,
        pickup_end
      )
      values (
        v_code,
        v_customer,
        v_outlet_id,
        v_bag_count::smallint,
        v_subtotal,
        v_discount,
        v_total,
        lower(trim(p_payment_method)),
        'pending',
        'reserved',
        v_promo_id,
        coalesce(v_pickup_start, now()),
        coalesce(v_pickup_end, now() + interval '2 hours')
      )
      returning id into v_group_id;
      exit;
    exception
      when unique_violation then
        if v_attempt >= 6 then
          raise;
        end if;
    end;
  end loop;

  v_per_discount := case
    when v_bag_count > 0 then round(v_discount / v_bag_count, 2)
    else 0
  end;

  for v_bag in
    select rb.*
    from public.rescue_bags rb
    where rb.id = any (p_bag_ids)
  loop
    insert into public.orders (
      bag_id,
      customer_id,
      outlet_id,
      group_id,
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
      v_bag.id,
      v_customer,
      v_outlet_id,
      v_group_id,
      1,
      v_bag.rescue_price,
      v_bag.rescue_price,
      0,
      greatest(0, coalesce(v_bag.rescue_price, 0) - v_per_discount),
      lower(trim(p_payment_method)),
      'pending',
      'reserved',
      null,
      v_per_discount,
      v_promo_id
    );
  end loop;

  group_id := v_group_id;
  reservation_code := v_code;
  total := v_total;
  return next;
end;
$$;

revoke all on function public.create_group_reservation(uuid[], text, text) from public;
grant execute on function public.create_group_reservation(uuid[], text, text) to authenticated;

create or replace function public.merchant_collect_group(
  p_group_id uuid,
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
  v_payment text;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  select g.outlet_id, g.reservation_code, g.order_status, g.payment_status
  into v_outlet, v_code, v_status, v_payment
  from public.reservation_groups g
  where g.id = p_group_id;

  if not found then
    raise exception 'group_not_found';
  end if;

  if not public.is_merchant_staff_for_outlet(v_outlet) then
    raise exception 'forbidden';
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
  where o.group_id = p_group_id
    and lower(trim(o.order_status)) not in ('collected', 'cancelled', 'no_show', 'refunded');

  return jsonb_build_object('ok', true, 'group_id', p_group_id);
end;
$$;

revoke all on function public.merchant_collect_group(uuid, text) from public;
grant execute on function public.merchant_collect_group(uuid, text) to authenticated;

-- RLS for reservation_groups
alter table public.reservation_groups enable row level security;

drop policy if exists "Customers read own reservation groups" on public.reservation_groups;
create policy "Customers read own reservation groups"
  on public.reservation_groups
  for select
  to authenticated
  using (customer_id = auth.uid());

drop policy if exists "Merchants read outlet reservation groups" on public.reservation_groups;
create policy "Merchants read outlet reservation groups"
  on public.reservation_groups
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.merchant_staff ms
      join public.outlets ou on ou.merchant_id = ms.merchant_id
      where ou.id = reservation_groups.outlet_id
        and ms.user_id = auth.uid()
    )
  );
