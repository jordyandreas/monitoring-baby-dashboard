-- Visual next-time cards for milk and pumping. Not a push notification.

create table public.schedule_reminders (
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('feed', 'pump')),
  enabled boolean not null default false,
  interval_minutes integer not null default 120
    check (interval_minutes > 0 and interval_minutes <= 24 * 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, kind)
);

create trigger schedule_reminders_set_updated_at
  before update on public.schedule_reminders
  for each row execute function public.set_updated_at();

alter table public.schedule_reminders enable row level security;

create policy "schedule_reminders_all_own"
  on public.schedule_reminders
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
