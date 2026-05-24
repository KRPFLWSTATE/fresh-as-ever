-- Idempotency for scheduled pickup reminder SMS (Vercel cron / pg_cron).
alter table public.orders
  add column if not exists pickup_reminder_sent_at timestamptz;

comment on column public.orders.pickup_reminder_sent_at is
  'Set when pickup_reminder transactional SMS was sent (~30–60 min before bag pickup_start).';

create index if not exists orders_pickup_reminder_pending_idx
  on public.orders (pickup_reminder_sent_at)
  where pickup_reminder_sent_at is null;
