alter table public.recommendations
  add column if not exists category text null,
  add column if not exists link_url text null,
  add column if not exists storage_path text null;
