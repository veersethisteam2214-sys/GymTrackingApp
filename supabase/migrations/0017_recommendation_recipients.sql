alter table public.recommendations
  add column if not exists audience_type text not null default 'everyone',
  add column if not exists target_profile_ids uuid[] not null default '{}';

alter table public.recommendations
  drop constraint if exists recommendations_audience_type_check;

alter table public.recommendations
  add constraint recommendations_audience_type_check
  check (audience_type in ('everyone', 'specific'));

create index if not exists recommendations_created_at_idx
on public.recommendations (created_at desc);

create index if not exists recommendations_target_profile_ids_idx
on public.recommendations using gin (target_profile_ids);

delete from public.recommendations
where created_at < timestamptz '2026-06-10 14:40:14+07';
