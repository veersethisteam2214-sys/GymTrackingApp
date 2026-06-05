alter table public.profiles
add column if not exists target_weight numeric null,
add column if not exists target_date date null;

