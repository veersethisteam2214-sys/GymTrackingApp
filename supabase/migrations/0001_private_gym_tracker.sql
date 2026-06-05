create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  starting_weight numeric null,
  target_weight numeric null,
  target_date date null,
  weight_unit text not null default 'kg',
  goal_mode text not null default 'cutting'
    check (goal_mode in ('cutting', 'bulking')),
  gym_routine text not null,
  cardio_routine text not null,
  current_book_title text null,
  current_book_total_pages integer null,
  avatar_url text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
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
    check (category in ('progress_photo', 'treadmill_photo', 'weight_scale_photo', 'protein_shake_photo', 'reading_proof')),
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

create table if not exists public.reading_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  checkin_id uuid not null references public.daily_checkins(id) on delete cascade,
  source_item_id uuid references public.checkin_items(id) on delete set null,
  book_title text not null,
  current_page integer not null,
  total_pages integer null,
  created_at timestamptz default now(),
  unique (user_id, checkin_id)
);

create table if not exists public.completed_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  total_pages integer null,
  completed_at timestamptz default now(),
  unique (user_id, title)
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

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text null,
  challenge_type text not null default 'consistency',
  target_value numeric null,
  target_unit text null,
  start_date date null,
  end_date date null,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  title text not null,
  note text null,
  created_at timestamptz default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_daily_checkins_updated_at on public.daily_checkins;
create trigger touch_daily_checkins_updated_at
before update on public.daily_checkins
for each row execute function public.touch_updated_at();

drop trigger if exists touch_checkin_items_updated_at on public.checkin_items;
create trigger touch_checkin_items_updated_at
before update on public.checkin_items
for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.checkin_items enable row level security;
alter table public.weight_entries enable row level security;
alter table public.cardio_entries enable row level security;
alter table public.reading_entries enable row level security;
alter table public.completed_books enable row level security;
alter table public.audit_log enable row level security;
alter table public.challenges enable row level security;
alter table public.recommendations enable row level security;

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
