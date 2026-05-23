-- Audit backlog: PayHere refund id + merchant complaint notes
alter table public.orders
  add column if not exists payhere_payment_id text;

alter table public.complaints
  add column if not exists merchant_notes text;

comment on column public.orders.payhere_payment_id is 'PayHere payment_id from notify webhook; used for refund API';
comment on column public.complaints.merchant_notes is 'Merchant response on dispute (escalation / refund context)';
