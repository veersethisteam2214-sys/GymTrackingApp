create extension if not exists "pgcrypto";

create table if not exists public.allowed_emails (
  email text primary key,
  created_at timestamptz default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text not null,
  avatar_url text null,
  created_at timestamptz default now()
);

create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  checkin_date date not null,
  overall_status text not null default 'missing'
    check (overall_status in ('missing', 'partial', 'complete', 'excused')),
  is_rest_day boolean default false,
  rest_day_reason text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, checkin_date)
);

create table if not exists public.checkin_items (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.daily_checkins(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null
    check (category in ('progress_photo', 'treadmill_photo', 'weight_scale_photo', 'protein_shake_photo')),
  status text not null default 'missing'
    check (status in ('missing', 'uploaded', 'excused')),
  storage_path text null,
  original_filename text null,
  mime_type text null,
  file_size_bytes integer null,
  uploaded_at timestamptz null,
  note text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (checkin_id, category)
);

create table if not exists public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  checkin_id uuid not null references public.daily_checkins(id) on delete cascade,
  weight_value numeric not null,
  weight_unit text not null default 'kg',
  source_item_id uuid references public.checkin_items(id) on delete set null,
  measured_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (user_id, checkin_id)
);

create table if not exists public.cardio_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  checkin_id uuid not null references public.daily_checkins(id) on delete cascade,
  source_item_id uuid references public.checkin_items(id) on delete set null,
  treadmill_minutes numeric null,
  treadmill_distance numeric null,
  distance_unit text default 'km',
  calories numeric null,
  created_at timestamptz default now(),
  unique (user_id, checkin_id)
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid null,
  metadata jsonb null,
  created_at timestamptz default now()
);

create or replace function public.is_allowed_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.allowed_emails
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_daily_checkins_updated_at on public.daily_checkins;
create trigger touch_daily_checkins_updated_at
before update on public.daily_checkins
for each row execute function public.touch_updated_at();

drop trigger if exists touch_checkin_items_updated_at on public.checkin_items;
create trigger touch_checkin_items_updated_at
before update on public.checkin_items
for each row execute function public.touch_updated_at();

alter table public.allowed_emails enable row level security;
alter table public.profiles enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.checkin_items enable row level security;
alter table public.weight_entries enable row level security;
alter table public.cardio_entries enable row level security;
alter table public.audit_log enable row level security;

create policy "allowed users can read allowlist"
on public.allowed_emails for select
to authenticated
using (public.is_allowed_user());

create policy "allowed users can read profiles"
on public.profiles for select
to authenticated
using (public.is_allowed_user());

create policy "allowed user can create own profile"
on public.profiles for insert
to authenticated
with check (
  id = auth.uid()
  and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  and public.is_allowed_user()
);

create policy "users update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid() and public.is_allowed_user())
with check (id = auth.uid() and public.is_allowed_user());

create policy "allowed users read daily checkins"
on public.daily_checkins for select
to authenticated
using (public.is_allowed_user());

create policy "users create own daily checkins"
on public.daily_checkins for insert
to authenticated
with check (user_id = auth.uid() and public.is_allowed_user());

create policy "users update own daily checkins"
on public.daily_checkins for update
to authenticated
using (user_id = auth.uid() and public.is_allowed_user())
with check (user_id = auth.uid() and public.is_allowed_user());

create policy "users delete own daily checkins"
on public.daily_checkins for delete
to authenticated
using (user_id = auth.uid() and public.is_allowed_user());

create policy "allowed users read checkin items"
on public.checkin_items for select
to authenticated
using (public.is_allowed_user());

create policy "users create own checkin items"
on public.checkin_items for insert
to authenticated
with check (user_id = auth.uid() and public.is_allowed_user());

create policy "users update own checkin items"
on public.checkin_items for update
to authenticated
using (user_id = auth.uid() and public.is_allowed_user())
with check (user_id = auth.uid() and public.is_allowed_user());

create policy "users delete own checkin items"
on public.checkin_items for delete
to authenticated
using (user_id = auth.uid() and public.is_allowed_user());

create policy "allowed users read weight entries"
on public.weight_entries for select
to authenticated
using (public.is_allowed_user());

create policy "users manage own weight entries"
on public.weight_entries for all
to authenticated
using (user_id = auth.uid() and public.is_allowed_user())
with check (user_id = auth.uid() and public.is_allowed_user());

create policy "allowed users read cardio entries"
on public.cardio_entries for select
to authenticated
using (public.is_allowed_user());

create policy "users manage own cardio entries"
on public.cardio_entries for all
to authenticated
using (user_id = auth.uid() and public.is_allowed_user())
with check (user_id = auth.uid() and public.is_allowed_user());

create policy "allowed users read audit log"
on public.audit_log for select
to authenticated
using (public.is_allowed_user());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'checkin-uploads',
  'checkin-uploads',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

create policy "allowed users can view private upload objects"
on storage.objects for select
to authenticated
using (bucket_id = 'checkin-uploads' and public.is_allowed_user());

create policy "users upload to own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'checkin-uploads'
  and public.is_allowed_user()
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users update own upload objects"
on storage.objects for update
to authenticated
using (
  bucket_id = 'checkin-uploads'
  and public.is_allowed_user()
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'checkin-uploads'
  and public.is_allowed_user()
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "users delete own upload objects"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'checkin-uploads'
  and public.is_allowed_user()
  and (storage.foldername(name))[1] = auth.uid()::text
);

