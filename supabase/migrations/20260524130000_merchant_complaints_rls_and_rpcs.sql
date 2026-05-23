-- Merchant complaint updates (escalate + notes) and dashboard/admin RPCs

drop policy if exists "Merchants update outlet complaints" on public.complaints;
create policy "Merchants update outlet complaints"
  on public.complaints
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.orders o
      join public.outlets ou on ou.id = o.outlet_id
      join public.merchant_staff ms on ms.merchant_id = ou.merchant_id
      where o.id = complaints.order_id
        and ms.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.orders o
      join public.outlets ou on ou.id = o.outlet_id
      join public.merchant_staff ms on ms.merchant_id = ou.merchant_id
      where o.id = complaints.order_id
        and ms.user_id = auth.uid()
    )
  );

create or replace function public.merchant_rescue_counts(p_merchant_ids uuid[])
returns table (merchant_id uuid, rescue_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select ou.merchant_id, count(*)::bigint
  from public.orders o
  join public.outlets ou on ou.id = o.outlet_id
  where ou.merchant_id = any (p_merchant_ids)
    and o.order_status in ('collected', 'completed')
  group by ou.merchant_id;
$$;

revoke all on function public.merchant_rescue_counts(uuid[]) from public;
grant execute on function public.merchant_rescue_counts(uuid[]) to authenticated;

create or replace function public.merchant_popular_bags(p_outlet_ids uuid[], p_limit int default 3)
returns table (
  bag_id uuid,
  title text,
  image_url text,
  order_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    rb.id as bag_id,
    rb.title,
    rb.image_url,
    count(o.id)::bigint as order_count
  from public.rescue_bags rb
  left join public.orders o on o.bag_id = rb.id
    and o.order_status in ('collected', 'completed', 'paid', 'ready_for_pickup')
  where rb.outlet_id = any (p_outlet_ids)
    and rb.status = 'live'
  group by rb.id, rb.title, rb.image_url
  order by order_count desc, rb.title asc
  limit greatest(p_limit, 1);
$$;

revoke all on function public.merchant_popular_bags(uuid[], int) from public;
grant execute on function public.merchant_popular_bags(uuid[], int) to authenticated;
