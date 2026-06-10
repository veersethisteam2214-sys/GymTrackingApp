create table if not exists public.group_notifications (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  target_profile_id uuid references public.profiles(id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.group_notifications
  add column if not exists target_profile_id uuid references public.profiles(id) on delete cascade;

alter table public.group_notifications
  drop constraint if exists group_notifications_notification_type_check;

alter table public.group_notifications
  add constraint group_notifications_notification_type_check
  check (notification_type in ('upload', 'recommendation', 'challenge', 'system'));

create table if not exists public.notification_reads (
  notification_id uuid not null references public.group_notifications(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, profile_id)
);

create table if not exists public.feature_announcements (
  id text primary key,
  title text not null,
  body text not null,
  active_on date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.feature_announcement_views (
  announcement_id text not null references public.feature_announcements(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (announcement_id, profile_id)
);

create index if not exists group_notifications_target_profile_id_idx
on public.group_notifications (target_profile_id);

create index if not exists group_notifications_created_at_idx
on public.group_notifications (created_at desc);

create index if not exists notification_reads_profile_id_idx
on public.notification_reads (profile_id);

alter table public.group_notifications enable row level security;
alter table public.notification_reads enable row level security;
alter table public.feature_announcements enable row level security;
alter table public.feature_announcement_views enable row level security;

insert into public.feature_announcements (id, title, body, active_on)
values (
  'new-user-overview-v1',
  'Welcome to LOCKED IN',
  'This app is for group discipline and accountability.

- Log in with your own profile on any device.
- Use Daily Uploads to take live proof pictures for each required benchmark.
- Gym means gym attendance proof, not a progress picture.
- Weight needs a scale photo and the written weight.
- Sundays are 5/5 because they include the weekly progress picture.
- The homepage shows everyone''s daily completion, streaks, rankings, and proof uploads.
- The bell shows uploads, challenges, reminders, and profile notices.

For more information please ask ''Veer''.',
  date '2026-06-10'
)
on conflict (id) do update
set
  title = excluded.title,
  body = excluded.body,
  active_on = excluded.active_on;

delete from public.feature_announcement_views as view
using public.profiles
where view.announcement_id = 'new-user-overview-v1'
and view.profile_id = profiles.id
and (
  lower(profiles.display_name) in ('tino', 'manavk')
  or lower(coalesce(profiles.username, '')) in ('tino', 'manavk')
);

insert into public.group_notifications (
  actor_profile_id,
  notification_type,
  title,
  body,
  metadata
)
select
  profiles.id,
  'system',
  'Welcome new user: ' || profiles.display_name,
  profiles.display_name || ' joined LOCKED IN.',
  jsonb_build_object(
    'notice_key', 'existing-user-welcome',
    'joined_profile_id', profiles.id,
    'joined_display_name', profiles.display_name
  )
from public.profiles
where (
  lower(profiles.display_name) in ('tino', 'manavk')
  or lower(coalesce(profiles.username, '')) in ('tino', 'manavk')
)
and not exists (
  select 1
  from public.group_notifications
  where metadata ->> 'notice_key' = 'existing-user-welcome'
  and metadata ->> 'joined_profile_id' = profiles.id::text
);

insert into public.notification_reads (notification_id, profile_id)
select notifications.id, notifications.actor_profile_id
from public.group_notifications as notifications
where notifications.metadata ->> 'notice_key' = 'existing-user-welcome'
and notifications.actor_profile_id is not null
on conflict (notification_id, profile_id) do nothing;
