alter table public.profiles
  add column if not exists username text null,
  add column if not exists password_hash text null,
  add column if not exists password_salt text null,
  add column if not exists login_updated_at timestamptz null;

create unique index if not exists profiles_username_lower_idx
on public.profiles (lower(username))
where username is not null;
