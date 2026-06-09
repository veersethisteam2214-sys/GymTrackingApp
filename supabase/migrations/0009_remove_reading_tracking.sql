delete from public.checkin_items
where category = 'reading_proof';

drop table if exists public.completed_books;
drop table if exists public.reading_entries;

alter table public.profiles
  drop column if exists current_book_title,
  drop column if exists current_book_total_pages;

alter table public.checkin_items
  drop constraint if exists checkin_items_category_check;

alter table public.checkin_items
  add constraint checkin_items_category_check
  check (category in ('progress_photo', 'treadmill_photo', 'weight_scale_photo', 'protein_shake_photo'));

with item_counts as (
  select
    checkin_id,
    count(*) filter (
      where status in ('uploaded', 'excused')
      and category in ('progress_photo', 'treadmill_photo', 'weight_scale_photo', 'protein_shake_photo')
    ) as done_count
  from public.checkin_items
  group by checkin_id
)
update public.daily_checkins as checkin
set
  overall_status = case
    when checkin.is_rest_day then 'excused'
    when coalesce(item_counts.done_count, 0) >= 4 then 'complete'
    when coalesce(item_counts.done_count, 0) > 0 then 'partial'
    else 'missing'
  end,
  updated_at = now()
from item_counts
where item_counts.checkin_id = checkin.id;

update public.daily_checkins as checkin
set
  overall_status = case
    when checkin.is_rest_day then 'excused'
    else 'missing'
  end,
  updated_at = now()
where not exists (
  select 1
  from public.checkin_items as item
  where item.checkin_id = checkin.id
);
