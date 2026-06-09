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

alter table public.challenges
  add column if not exists description text null,
  add column if not exists challenge_type text not null default 'consistency',
  add column if not exists target_value numeric null,
  add column if not exists target_unit text null,
  add column if not exists start_date date null,
  add column if not exists end_date date null,
  add column if not exists created_by_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists created_at timestamptz default now();

alter table public.challenges enable row level security;

create index if not exists challenges_created_at_idx
on public.challenges (created_at desc);
