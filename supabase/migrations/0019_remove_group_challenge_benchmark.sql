delete from public.checkin_items
where category = 'group_challenge_ab_photo';

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
      'weekly_progress_photo'
    )
  );

update public.daily_checkins as checkin
set
  overall_status = case
    when checkin.is_rest_day then 'excused'
    when coalesce(item_counts.done_count, 0) >= 4 then 'complete'
    when coalesce(item_counts.done_count, 0) > 0 then 'partial'
    else 'missing'
  end,
  updated_at = now()
from (
  select
    checkin.id,
    count(*) filter (
      where item.status in ('uploaded', 'excused')
      and item.category in (
        'progress_photo',
        'treadmill_photo',
        'weight_scale_photo',
        'protein_shake_photo'
      )
    ) as done_count
  from public.daily_checkins as checkin
  left join public.checkin_items as item
    on item.checkin_id = checkin.id
  where checkin.checkin_date in (date '2026-06-11', date '2026-06-13')
  group by checkin.id
) as item_counts
where checkin.id = item_counts.id;
