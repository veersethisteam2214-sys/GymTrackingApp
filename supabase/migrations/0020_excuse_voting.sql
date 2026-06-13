create table if not exists public.excuse_requests (
  id uuid primary key default gen_random_uuid(),
  requester_profile_id uuid not null references public.profiles(id) on delete cascade,
  checkin_id uuid not null references public.daily_checkins(id) on delete cascade,
  checkin_date date not null,
  request_type text not null default 'benchmark',
  category text null,
  reason text not null,
  status text not null default 'pending',
  deadline_at timestamptz not null,
  allow_votes integer not null default 0,
  deny_votes integer not null default 0,
  decided_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.excuse_requests
  drop constraint if exists excuse_requests_request_type_check;

alter table public.excuse_requests
  add constraint excuse_requests_request_type_check
  check (request_type in ('benchmark', 'sick_day'));

alter table public.excuse_requests
  drop constraint if exists excuse_requests_status_check;

alter table public.excuse_requests
  add constraint excuse_requests_status_check
  check (status in ('pending', 'approved', 'denied'));

alter table public.excuse_requests
  drop constraint if exists excuse_requests_category_check;

alter table public.excuse_requests
  add constraint excuse_requests_category_check
  check (
    category is null
    or category in (
      'progress_photo',
      'treadmill_photo',
      'weight_scale_photo',
      'protein_shake_photo',
      'weekly_progress_photo'
    )
  );

create table if not exists public.excuse_votes (
  request_id uuid not null references public.excuse_requests(id) on delete cascade,
  voter_profile_id uuid not null references public.profiles(id) on delete cascade,
  vote text not null,
  created_at timestamptz not null default now(),
  primary key (request_id, voter_profile_id)
);

alter table public.excuse_votes
  drop constraint if exists excuse_votes_vote_check;

alter table public.excuse_votes
  add constraint excuse_votes_vote_check
  check (vote in ('allow', 'deny'));

create unique index if not exists excuse_requests_pending_benchmark_idx
on public.excuse_requests (requester_profile_id, checkin_id, category)
where status = 'pending' and request_type = 'benchmark';

create unique index if not exists excuse_requests_pending_sick_day_idx
on public.excuse_requests (requester_profile_id, checkin_id)
where status = 'pending' and request_type = 'sick_day';

create index if not exists excuse_requests_status_deadline_idx
on public.excuse_requests (status, deadline_at);

create index if not exists excuse_votes_voter_idx
on public.excuse_votes (voter_profile_id);

alter table public.excuse_requests enable row level security;
alter table public.excuse_votes enable row level security;

insert into public.feature_announcements (id, title, body, active_on)
values (
  'excuse-voting-v1',
  'Excuse voting is live',
  'Excuses are now group-approved.

- If you press Excuse, you must give a reason.
- Everyone else gets a vote popup after about 10 seconds in the app.
- Voting stays open until 3am Thai time.
- If Allow votes are higher than Deny votes, that benchmark becomes excused and counts as 1 point.
- If Deny votes are equal or higher, it stays missing.
- Sick day excuse requests cover gym and cardio only. Weight and protein are still required.',
  date '2026-06-13'
)
on conflict (id) do update
set
  title = excluded.title,
  body = excluded.body,
  active_on = excluded.active_on;
