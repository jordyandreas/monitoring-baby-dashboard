-- Sleep becomes two independent events, like feeds and diapers: one row when the baby falls asleep, one when they wake.
-- Either can be logged without the other. Durations are derived by pairing a wake with the sleep before it.
-- Existing sessions are discarded on purpose; tracking starts fresh.
drop table if exists public.sleep_logs;

create table public.sleep_logs (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  logged_date date not null,
  logged_time time not null,
  kind text not null check (kind in ('sleep', 'wake')),
  created_at timestamptz not null default now()
);

create index sleep_logs_user_date_idx on public.sleep_logs (user_id, logged_date desc, logged_time desc);

alter table public.sleep_logs enable row level security;

create policy "sleep_logs_all_own" on public.sleep_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
