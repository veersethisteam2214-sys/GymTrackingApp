with checkin_requirements as (
  select
    checkin.id,
    checkin.is_rest_day,
    case
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
        'group_challenge_ab_photo'
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
