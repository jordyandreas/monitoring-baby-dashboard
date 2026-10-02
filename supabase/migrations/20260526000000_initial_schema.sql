-- Baby Monitor — initial Supabase schema
-- Run via Supabase Dashboard SQL editor or: supabase db push

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  locale text not null default 'en' check (locale in ('en', 'id')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile on sign-up (anonymous or email)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.user_settings (user_id) values (new.id);
  insert into public.notification_preferences (user_id, preferences)
    values (new.id, '{}'::jsonb);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Baby profile
-- ---------------------------------------------------------------------------
create table public.baby_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  name text not null default '',
  gender text not null default 'not-yet'
    check (gender in ('boy', 'girl', 'not-yet')),
  lmp_date date,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger baby_profiles_set_updated_at
  before update on public.baby_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Baby Plus program state
-- ---------------------------------------------------------------------------
create table public.baby_plus_programs (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  start_date date,
  daily_time time,
  completions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger baby_plus_programs_set_updated_at
  before update on public.baby_plus_programs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Vitamins
-- ---------------------------------------------------------------------------
create table public.vitamin_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vitamin_items_user_id_idx on public.vitamin_items (user_id);

create trigger vitamin_items_set_updated_at
  before update on public.vitamin_items
  for each row execute function public.set_updated_at();

-- One row per calendar day; completions mirrors VitaminDayRecord.completed
create table public.vitamin_day_logs (
  user_id uuid not null references public.profiles (id) on delete cascade,
  log_date date not null,
  completions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, log_date)
);

create index vitamin_day_logs_user_date_idx
  on public.vitamin_day_logs (user_id, log_date desc);

create trigger vitamin_day_logs_set_updated_at
  before update on public.vitamin_day_logs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Kick logs
-- ---------------------------------------------------------------------------
create table public.kick_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  logged_date date not null,
  logged_time time not null,
  created_at timestamptz not null default now()
);

create index kick_logs_user_date_idx
  on public.kick_logs (user_id, logged_date desc, logged_time desc);

-- ---------------------------------------------------------------------------
-- Water intake
-- ---------------------------------------------------------------------------
create table public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  logged_date date not null,
  logged_time time not null,
  amount_ml int not null check (amount_ml > 0 and amount_ml <= 2000),
  created_at timestamptz not null default now()
);

create index water_logs_user_date_idx
  on public.water_logs (user_id, logged_date desc, logged_time desc);

create table public.user_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  glass_size_ml int not null default 250
    check (glass_size_ml >= 100 and glass_size_ml <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Notification / reminder preferences (app-level config)
-- ---------------------------------------------------------------------------
create table public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- Client-side dedupe keys (today's fired reminders). Server jobs can use this later.
create table public.reminder_fired_events (
  user_id uuid not null references public.profiles (id) on delete cascade,
  dedupe_key text not null,
  fired_on date not null default (current_date),
  created_at timestamptz not null default now(),
  primary key (user_id, dedupe_key)
);

create index reminder_fired_events_user_fired_on_idx
  on public.reminder_fired_events (user_id, fired_on desc);

-- Tracks one-time localStorage → Supabase migration per device/user
create table public.sync_metadata (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  local_storage_version int not null default 1,
  migrated_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger sync_metadata_set_updated_at
  before update on public.sync_metadata
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Future: server-scheduled notifications (not used by MVP client yet)
-- ---------------------------------------------------------------------------
create table public.scheduled_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  enabled boolean not null default true,
  schedule_type text not null default 'daily'
    check (schedule_type in ('once', 'daily', 'interval', 'cron')),
  schedule_config jsonb not null default '{}'::jsonb,
  next_run_at timestamptz,
  last_run_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index scheduled_notifications_next_run_idx
  on public.scheduled_notifications (next_run_at)
  where enabled = true and next_run_at is not null;

create trigger scheduled_notifications_set_updated_at
  before update on public.scheduled_notifications
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.baby_profiles enable row level security;
alter table public.baby_plus_programs enable row level security;
alter table public.vitamin_items enable row level security;
alter table public.vitamin_day_logs enable row level security;
alter table public.kick_logs enable row level security;
alter table public.water_logs enable row level security;
alter table public.user_settings enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.reminder_fired_events enable row level security;
alter table public.sync_metadata enable row level security;
alter table public.scheduled_notifications enable row level security;

-- profiles
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- baby_profiles
create policy "baby_profiles_all_own" on public.baby_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- baby_plus_programs
create policy "baby_plus_all_own" on public.baby_plus_programs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- vitamin_items
create policy "vitamin_items_all_own" on public.vitamin_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- vitamin_day_logs
create policy "vitamin_day_logs_all_own" on public.vitamin_day_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- kick_logs
create policy "kick_logs_all_own" on public.kick_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- water_logs
create policy "water_logs_all_own" on public.water_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- user_settings
create policy "user_settings_all_own" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- notification_preferences
create policy "notification_preferences_all_own" on public.notification_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- reminder_fired_events
create policy "reminder_fired_all_own" on public.reminder_fired_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- sync_metadata
create policy "sync_metadata_all_own" on public.sync_metadata
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- scheduled_notifications (future)
create policy "scheduled_notifications_all_own" on public.scheduled_notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
