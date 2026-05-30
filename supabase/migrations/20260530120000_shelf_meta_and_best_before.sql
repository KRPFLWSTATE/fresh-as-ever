-- Phase B: optional shelf item best_before + shelf marketing meta

alter table public.clearance_shelf_items
  add column if not exists best_before date;

alter table public.clearance_shelves
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists cover_image_url text;
