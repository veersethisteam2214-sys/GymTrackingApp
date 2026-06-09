alter table public.checkin_items
  drop constraint if exists checkin_items_category_check;

alter table public.checkin_items
  add constraint checkin_items_category_check
  check (
    category in (
      'progress_photo',
      'treadmill_photo',
      'weight_scale_photo',
      'protein_shake_photo',
      'group_challenge_ab_photo',
      'weekly_progress_photo'
    )
  );

alter table public.group_notifications
  drop constraint if exists group_notifications_notification_type_check;

alter table public.group_notifications
  add constraint group_notifications_notification_type_check
  check (notification_type in ('upload', 'recommendation', 'challenge', 'system'));

insert into public.checkin_items (checkin_id, user_id, category)
select checkin.id, checkin.user_id, 'weekly_progress_photo'
from public.daily_checkins as checkin
where extract(dow from checkin.checkin_date) = 0
on conflict (checkin_id, category) do nothing;

with checkin_requirements as (
  select
    checkin.id,
    checkin.is_rest_day,
    case
      when extract(dow from checkin.checkin_date) = 0 then 5
      when checkin.checkin_date in (date '2026-06-11', date '2026-06-13') then 5
      else 4
    end as required_count
  from public.daily_checkins as checkin
),
upload_counts as (
  select
    item.checkin_id,
    count(*) filter (
      where item.status = 'uploaded'
      and item.category in (
        'progress_photo',
        'treadmill_photo',
        'weight_scale_photo',
        'protein_shake_photo',
        'group_challenge_ab_photo',
        'weekly_progress_photo'
      )
    ) as uploaded_count
  from public.checkin_items as item
  group by item.checkin_id
)
update public.daily_checkins as checkin
set
  overall_status = case
    when checkin_requirements.is_rest_day then 'excused'
    when coalesce(upload_counts.uploaded_count, 0) >= checkin_requirements.required_count then 'complete'
    when coalesce(upload_counts.uploaded_count, 0) > 0 then 'partial'
    else 'missing'
  end,
  updated_at = now()
from checkin_requirements
left join upload_counts
  on upload_counts.checkin_id = checkin_requirements.id
where checkin.id = checkin_requirements.id;

insert into public.group_notifications (
  actor_profile_id,
  notification_type,
  title,
  body,
  metadata
)
select
  null,
  'system',
  'Sunday progress picture added',
  'Progress pictures are now once per week. Every Sunday has 5 benchmarks: gym attendance, cardio, weight, protein, and weekly progress picture.',
  '{"announcement_id":"sunday-progress-picture-v1"}'::jsonb
where not exists (
  select 1
  from public.group_notifications
  where metadata ->> 'announcement_id' = 'sunday-progress-picture-v1'
);
