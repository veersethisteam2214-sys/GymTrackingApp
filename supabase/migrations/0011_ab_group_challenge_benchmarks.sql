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
      'group_challenge_ab_photo'
    )
  );

with challenge_dates(checkin_date) as (
  values
    (date '2026-06-11'),
    (date '2026-06-13')
),
target_checkins as (
  select daily_checkins.id, daily_checkins.user_id
  from public.daily_checkins
  join challenge_dates
    on challenge_dates.checkin_date = daily_checkins.checkin_date
)
insert into public.checkin_items (checkin_id, user_id, category)
select id, user_id, 'group_challenge_ab_photo'
from target_checkins
on conflict (checkin_id, category) do nothing;

with challenge_dates(checkin_date) as (
  values
    (date '2026-06-11'),
    (date '2026-06-13')
),
item_counts as (
  select
    checkin_id,
    count(*) filter (
      where status in ('uploaded', 'excused')
      and category in (
        'progress_photo',
        'treadmill_photo',
        'weight_scale_photo',
        'protein_shake_photo',
        'group_challenge_ab_photo'
      )
    ) as done_count
  from public.checkin_items
  group by checkin_id
),
target_status as (
  select
    checkin.id,
    checkin.is_rest_day,
    coalesce(item_counts.done_count, 0) as done_count
  from public.daily_checkins as checkin
  join challenge_dates
    on challenge_dates.checkin_date = checkin.checkin_date
  left join item_counts
    on item_counts.checkin_id = checkin.id
)
update public.daily_checkins as checkin
set
  overall_status = case
    when target_status.is_rest_day then 'excused'
    when target_status.done_count >= 5 then 'complete'
    when target_status.done_count > 0 then 'partial'
    else 'missing'
  end,
  updated_at = now()
from target_status
where checkin.id = target_status.id;
