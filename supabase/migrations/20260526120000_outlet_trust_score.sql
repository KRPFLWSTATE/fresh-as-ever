-- Outlet Trust Score: denormalized metrics on outlets + recompute function + triggers

alter table public.outlets
  add column if not exists trust_score numeric(3, 2),
  add column if not exists collection_rate_pct numeric(5, 2),
  add column if not exists no_show_rate_pct numeric(5, 2),
  add column if not exists complaint_rate_pct numeric(5, 2),
  add column if not exists trust_orders_window int,
  add column if not exists trust_recomputed_at timestamptz;

comment on column public.outlets.trust_score is
  'Composite 0-5 trust score (rating-heavy blend of stars + ops rates). NULL when insufficient order history.';
comment on column public.outlets.collection_rate_pct is 'Collected / terminal orders in 90d window, 0-100.';
comment on column public.outlets.no_show_rate_pct is 'No-show / (collected+no_show) in 90d, 0-100.';
comment on column public.outlets.complaint_rate_pct is 'Complaints per collected order in 90d, 0-100.';

create or replace function public.recompute_outlet_trust(p_outlet_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_star numeric;
  v_collected int := 0;
  v_no_show int := 0;
  v_merchant_cancelled int := 0;
  v_complaints int := 0;
  v_terminal int := 0;
  v_window int := 0;
  v_c_rate numeric;
  v_cmp_rate numeric;
  v_ns_rate numeric;
  v_trust numeric;
  v_cutoff timestamptz := now() - interval '90 days';
begin
  if p_outlet_id is null then
    return;
  end if;

  select o.average_rating
  into v_star
  from public.outlets o
  where o.id = p_outlet_id;

  select
    count(*) filter (where lower(trim(o.order_status)) = 'collected')::int,
    count(*) filter (where lower(trim(o.order_status)) = 'no_show')::int,
    count(*) filter (
      where lower(trim(o.order_status)) = 'cancelled'
        and lower(trim(coalesce(o.cancelled_by, ''))) in ('merchant', 'admin')
    )::int,
    count(*)::int
  into v_collected, v_no_show, v_merchant_cancelled, v_window
  from public.orders o
  where o.outlet_id = p_outlet_id
    and o.created_at >= v_cutoff
    and lower(trim(o.order_status)) in (
      'collected', 'completed', 'no_show', 'cancelled'
    );

  select count(*)::int
  into v_complaints
  from public.complaints c
  join public.orders o on o.id = c.order_id
  where o.outlet_id = p_outlet_id
    and o.created_at >= v_cutoff
    and lower(trim(coalesce(c.status, ''))) not in ('dismissed', 'closed');

  v_terminal := v_collected + v_no_show + v_merchant_cancelled;

  if v_window < 5 then
    update public.outlets
    set
      trust_score = null,
      collection_rate_pct = null,
      no_show_rate_pct = null,
      complaint_rate_pct = null,
      trust_orders_window = v_window,
      trust_recomputed_at = now()
    where id = p_outlet_id;
    return;
  end if;

  v_c_rate := case
    when v_terminal > 0 then (v_collected::numeric / v_terminal::numeric)
    else 0
  end;

  v_cmp_rate := case
    when v_collected > 0 then greatest(0, 1 - least(1, v_complaints::numeric / v_collected::numeric))
    else 1
  end;

  v_ns_rate := case
    when (v_collected + v_no_show) > 0 then
      greatest(0, 1 - least(1, v_no_show::numeric / (v_collected + v_no_show)::numeric))
    else 1
  end;

  v_trust := round(
    0.60 * coalesce(v_star, 3.5)
    + 0.20 * (v_c_rate * 5)
    + 0.10 * (v_cmp_rate * 5)
    + 0.10 * (v_ns_rate * 5),
    2
  );

  v_trust := greatest(0, least(5, v_trust));

  update public.outlets
  set
    trust_score = v_trust,
    collection_rate_pct = round(v_c_rate * 100, 2),
    no_show_rate_pct = case
      when (v_collected + v_no_show) > 0
        then round((v_no_show::numeric / (v_collected + v_no_show)::numeric) * 100, 2)
      else 0
    end,
    complaint_rate_pct = case
      when v_collected > 0
        then round(least(100, (v_complaints::numeric / v_collected::numeric) * 100), 2)
      else 0
    end,
    trust_orders_window = v_window,
    trust_recomputed_at = now()
  where id = p_outlet_id;
end;
$$;

comment on function public.recompute_outlet_trust(uuid) is
  'Recomputes denormalized trust metrics for one outlet (90d window, min 5 orders).';

revoke all on function public.recompute_outlet_trust(uuid) from public;
grant execute on function public.recompute_outlet_trust(uuid) to authenticated;
grant execute on function public.recompute_outlet_trust(uuid) to anon;

create or replace function public.trg_recompute_outlet_trust_from_order()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if tg_op = 'UPDATE'
     and lower(trim(coalesce(new.order_status, ''))) is distinct from lower(trim(coalesce(old.order_status, '')))
     and lower(trim(coalesce(new.order_status, ''))) in ('collected', 'no_show', 'cancelled', 'completed') then
    perform public.recompute_outlet_trust(new.outlet_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_recompute_outlet_trust_order on public.orders;
create trigger trg_recompute_outlet_trust_order
  after update of order_status on public.orders
  for each row
  execute function public.trg_recompute_outlet_trust_from_order();

create or replace function public.trg_recompute_outlet_trust_from_complaint()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_outlet uuid;
begin
  select o.outlet_id into v_outlet
  from public.orders o
  where o.id = coalesce(new.order_id, old.order_id);

  if v_outlet is not null then
    perform public.recompute_outlet_trust(v_outlet);
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_recompute_outlet_trust_complaint on public.complaints;
create trigger trg_recompute_outlet_trust_complaint
  after insert or update of status on public.complaints
  for each row
  execute function public.trg_recompute_outlet_trust_from_complaint();

create or replace function public.trg_recompute_outlet_trust_from_review()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if coalesce(new.outlet_id, old.outlet_id) is not null then
    perform public.recompute_outlet_trust(coalesce(new.outlet_id, old.outlet_id));
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_recompute_outlet_trust_review on public.reviews;
create trigger trg_recompute_outlet_trust_review
  after insert or update or delete on public.reviews
  for each row
  execute function public.trg_recompute_outlet_trust_from_review();

-- Backfill all outlets
do $$
declare
  r record;
begin
  for r in select id from public.outlets loop
    perform public.recompute_outlet_trust(r.id);
  end loop;
end;
$$;
