-- Mom's pumping sessions. Separate from feed_logs, which record what the baby drank.

create table public.pump_logs (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  logged_date date not null,
  logged_time time not null,
  amount_ml int not null check (amount_ml >= 0 and amount_ml <= 2000),
  created_at timestamptz not null default now()
);

create index pump_logs_user_date_idx on public.pump_logs (user_id, logged_date desc, logged_time desc);

alter table public.pump_logs enable row level security;

create policy "pump_logs_all_own" on public.pump_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
