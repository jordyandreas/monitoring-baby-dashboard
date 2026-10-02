-- Child tracking: profile plus daily logs, growth, and ages 1–5.
-- Run in the Supabase SQL editor after 20260526000000_initial_schema.sql.

create table public.child_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  name text not null default '',
  gender text not null default 'not-yet'
    check (gender in ('boy', 'girl', 'not-yet')),
  birth_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger child_profiles_set_updated_at
  before update on public.child_profiles
  for each row execute function public.set_updated_at();

create table public.feed_logs (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  logged_date date not null,
  logged_time time not null,
  kind text not null check (kind in ('breast', 'bottle-breast', 'formula')),
  side text check (side is null or side in ('left', 'right', 'both')),
  duration_min int check (duration_min is null or duration_min >= 0),
  amount_ml int check (amount_ml is null or (amount_ml > 0 and amount_ml <= 2000)),
  created_at timestamptz not null default now()
);

create index feed_logs_user_date_idx on public.feed_logs (user_id, logged_date desc, logged_time desc);

create table public.diaper_logs (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  logged_date date not null,
  logged_time time not null,
  kind text not null check (kind in ('pee', 'poop', 'both')),
  poop_color text check (poop_color is null or poop_color in ('yellow', 'green', 'black', 'brown', 'other')),
  poop_texture text check (poop_texture is null or poop_texture in ('liquid', 'soft', 'solid')),
  created_at timestamptz not null default now()
);

create index diaper_logs_user_date_idx on public.diaper_logs (user_id, logged_date desc, logged_time desc);

create table public.sleep_logs (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  logged_date date not null,
  start_time time not null,
  end_time time not null,
  period text not null check (period in ('day', 'night')),
  created_at timestamptz not null default now()
);

create index sleep_logs_user_date_idx on public.sleep_logs (user_id, logged_date desc, start_time desc);

create table public.growth_logs (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  measured_on date not null,
  weight_kg numeric(5,2) check (weight_kg is null or weight_kg > 0),
  length_cm numeric(5,1) check (length_cm is null or length_cm > 0),
  head_cm numeric(5,1) check (head_cm is null or head_cm > 0),
  created_at timestamptz not null default now(),
  check (weight_kg is not null or length_cm is not null or head_cm is not null)
);

create index growth_logs_user_date_idx on public.growth_logs (user_id, measured_on desc);

create table public.solid_logs (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  logged_date date not null,
  logged_time time not null,
  name text not null,
  allergy_note text,
  created_at timestamptz not null default now()
);

create index solid_logs_user_date_idx on public.solid_logs (user_id, logged_date desc, logged_time desc);

create table public.health_logs (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  logged_date date not null,
  logged_time time not null,
  name text not null default '',
  dose text not null default '',
  temperature_c numeric(4,1),
  created_at timestamptz not null default now()
);

create index health_logs_user_date_idx on public.health_logs (user_id, logged_date desc, logged_time desc);

create table public.potty_logs (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  logged_date date not null,
  logged_time time not null,
  kind text not null check (kind in ('pee', 'poop', 'accident', 'diaper')),
  created_at timestamptz not null default now()
);

create index potty_logs_user_date_idx on public.potty_logs (user_id, logged_date desc, logged_time desc);

create table public.meal_logs (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  logged_date date not null,
  logged_time time not null,
  slot text not null check (slot in ('breakfast', 'lunch', 'snack', 'dinner')),
  note text not null default '',
  created_at timestamptz not null default now()
);

create index meal_logs_user_date_idx on public.meal_logs (user_id, logged_date desc, logged_time desc);

create table public.milestone_logs (
  user_id uuid not null references public.profiles (id) on delete cascade,
  milestone_key text not null,
  achieved_on date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, milestone_key)
);

alter table public.child_profiles enable row level security;
alter table public.feed_logs enable row level security;
alter table public.diaper_logs enable row level security;
alter table public.sleep_logs enable row level security;
alter table public.growth_logs enable row level security;
alter table public.solid_logs enable row level security;
alter table public.health_logs enable row level security;
alter table public.potty_logs enable row level security;
alter table public.meal_logs enable row level security;
alter table public.milestone_logs enable row level security;

create policy "child_profiles_all_own" on public.child_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "feed_logs_all_own" on public.feed_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "diaper_logs_all_own" on public.diaper_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sleep_logs_all_own" on public.sleep_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "growth_logs_all_own" on public.growth_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "solid_logs_all_own" on public.solid_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "health_logs_all_own" on public.health_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "potty_logs_all_own" on public.potty_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "meal_logs_all_own" on public.meal_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "milestone_logs_all_own" on public.milestone_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
