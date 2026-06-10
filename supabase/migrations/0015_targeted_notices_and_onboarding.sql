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
- Use Today to take live proof pictures for each required benchmark.
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

insert into public.feature_announcement_views (announcement_id, profile_id)
select 'new-user-overview-v1', profiles.id
from public.profiles
on conflict (announcement_id, profile_id) do nothing;

insert into public.group_notifications (
  actor_profile_id,
  target_profile_id,
  notification_type,
  title,
  body,
  metadata
)
select
  null,
  profiles.id,
  'system',
  'Add your profile picture',
  'Your profile does not have a photo yet. Open your profile settings and add one.',
  '{"notice_key":"profile-photo-reminder-v1"}'::jsonb
from public.profiles
where profiles.avatar_url is null
and not exists (
  select 1
  from public.group_notifications
  where group_notifications.target_profile_id = profiles.id
  and group_notifications.metadata ->> 'notice_key' = 'profile-photo-reminder-v1'
);
