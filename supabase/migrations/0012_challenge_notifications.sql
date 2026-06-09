alter table public.group_notifications
  drop constraint if exists group_notifications_notification_type_check;

alter table public.group_notifications
  add constraint group_notifications_notification_type_check
  check (notification_type in ('upload', 'recommendation', 'challenge'));
