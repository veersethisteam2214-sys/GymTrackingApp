create table if not exists public.app_feedback_prompts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  prompt_text text not null,
  response_text text null,
  prompted_at timestamptz not null default now(),
  responded_at timestamptz null
);

create index if not exists app_feedback_prompts_profile_prompted_idx
on public.app_feedback_prompts (profile_id, prompted_at desc);

create index if not exists app_feedback_prompts_responded_idx
on public.app_feedback_prompts (responded_at desc)
where responded_at is not null;

alter table public.app_feedback_prompts enable row level security;
