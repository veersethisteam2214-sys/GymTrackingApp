alter table public.profiles
  add column if not exists goal_mode text not null default 'cutting',
  add column if not exists current_book_title text null,
  add column if not exists current_book_total_pages integer null;

alter table public.profiles
  drop constraint if exists profiles_goal_mode_check;

alter table public.profiles
  add constraint profiles_goal_mode_check
  check (goal_mode in ('cutting', 'bulking'));

alter table public.checkin_items
  drop constraint if exists checkin_items_category_check;

alter table public.checkin_items
  add constraint checkin_items_category_check
  check (category in ('progress_photo', 'treadmill_photo', 'weight_scale_photo', 'protein_shake_photo', 'reading_proof'));

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

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  title text not null,
  note text null,
  created_at timestamptz default now()
);

alter table public.reading_entries enable row level security;
alter table public.completed_books enable row level security;
alter table public.recommendations enable row level security;
