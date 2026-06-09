create table if not exists public.group_notifications (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  notification_type text not null check (notification_type in ('upload', 'recommendation')),
  title text not null,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

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

create index if not exists group_notifications_created_at_idx
on public.group_notifications (created_at desc);

create index if not exists notification_reads_profile_id_idx
on public.notification_reads (profile_id);

create index if not exists feature_announcement_views_profile_id_idx
on public.feature_announcement_views (profile_id);

alter table public.group_notifications enable row level security;
alter table public.notification_reads enable row level security;
alter table public.feature_announcements enable row level security;
alter table public.feature_announcement_views enable row level security;

insert into public.feature_announcements (id, title, body, active_on)
values (
  '2026-06-10-notifications-update',
  'What''s new',
  'We upgraded the app.

- Notifications are now available from the bell icon.
- You''ll see alerts when someone uploads proof, enters daily data, or adds a recommendation.
- The red dot means there are unread updates.
- Weight proof now needs both a scale photo and the written weight.
- The homepage now shows the group goal: reach 30/30 for full group success.
- Stats now use user colors on the weight trend graph.
- The chatbot is available on Home and Stats.
- Settings moved into the profile icon menu.

Keep pushing. Today''s proof matters.',
  date '2026-06-10'
)
on conflict (id) do update
set
  title = excluded.title,
  body = excluded.body,
  active_on = excluded.active_on;
