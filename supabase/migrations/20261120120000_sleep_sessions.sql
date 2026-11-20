-- Sleep becomes a session: log "asleep" now, "awake" later. ended_at is null while the baby is still asleep.
-- logged_date stays the local calendar day the sleep started, so daily filters do not depend on UTC.
alter table public.sleep_logs
  add column started_at timestamptz,
  add column ended_at timestamptz;

update public.sleep_logs s
set
  started_at = (s.logged_date + s.start_time) at time zone p.timezone,
  ended_at = (
    s.logged_date
    + case when s.end_time <= s.start_time then 1 else 0 end
    + s.end_time
  ) at time zone p.timezone
from public.profiles p
where p.id = s.user_id;

alter table public.sleep_logs
  alter column started_at set not null,
  drop column start_time,
  drop column end_time,
  add constraint sleep_logs_end_after_start check (ended_at is null or ended_at > started_at);

create index sleep_logs_user_date_idx on public.sleep_logs (user_id, logged_date desc, started_at desc);

create unique index sleep_logs_one_active_idx on public.sleep_logs (user_id) where ended_at is null;
