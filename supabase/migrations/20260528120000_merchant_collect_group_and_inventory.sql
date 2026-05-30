-- merchant_collect_group: sync reservation_groups.order_status on collect
-- perfection_pass_inventory_v2: ensure bag quantity decrement trigger exists on orders insert

create or replace function public.decrement_bag_quantity_on_reserve()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_remaining integer;
begin
  if tg_op <> 'INSERT' then
    return new;
  end if;
  if new.bag_id is null then
    return new;
  end if;

  update public.rescue_bags
  set
    quantity_remaining = greatest(0, coalesce(quantity_remaining, 0) - coalesce(new.quantity, 1)),
    status = case
      when greatest(0, coalesce(quantity_remaining, 0) - coalesce(new.quantity, 1)) <= 0
        then 'sold_out'
      else status
    end,
    updated_at = now()
  where id = new.bag_id
    and coalesce(quantity_remaining, 0) >= coalesce(new.quantity, 1)
  returning quantity_remaining into v_remaining;

  if not found then
    raise exception 'Bag is sold out or insufficient quantity'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_decrement_bag_on_reserve on public.orders;
create trigger trg_decrement_bag_on_reserve
  after insert on public.orders
  for each row
  when (lower(coalesce(new.order_status, '')) = 'reserved')
  execute function public.decrement_bag_quantity_on_reserve();

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

  update public.reservation_groups g
  set
    order_status = 'collected',
    updated_at = now()
  where g.id = p_group_id
    and lower(trim(coalesce(g.order_status, ''))) not in ('collected', 'cancelled', 'no_show', 'refunded');

  return jsonb_build_object('ok', true, 'group_id', p_group_id);
end;
$$;

revoke all on function public.merchant_collect_group(uuid, text) from public;
grant execute on function public.merchant_collect_group(uuid, text) to authenticated;
