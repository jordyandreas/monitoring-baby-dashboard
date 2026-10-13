-- Food logs replace solid_logs and meal_logs in the app.
-- Health rows are either a temperature or a medicine.
-- Vaccine doses follow the milestone checklist pattern.

alter table public.child_profiles
  add column food_tracking text not null default 'auto'
    check (food_tracking in ('auto', 'on', 'off')),
  add column elimination_tracking text not null default 'auto'
    check (elimination_tracking in ('auto', 'diaper', 'potty'));

create table public.food_logs (
  id uuid primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  logged_date date not null,
  logged_time time not null,
  name text not null default '',
  slot text check (slot is null or slot in ('breakfast', 'lunch', 'snack', 'dinner')),
  allergy_note text,
  created_at timestamptz not null default now(),
  check (btrim(name) <> '' or slot is not null)
);

create index food_logs_user_date_idx on public.food_logs (user_id, logged_date desc, logged_time desc);

insert into public.food_logs (id, user_id, logged_date, logged_time, name, slot, allergy_note, created_at)
select id, user_id, logged_date, logged_time, name, null, allergy_note, created_at
from public.solid_logs
where btrim(name) <> '';

insert into public.food_logs (id, user_id, logged_date, logged_time, name, slot, allergy_note, created_at)
select
  id,
  user_id,
  logged_date,
  logged_time,
  btrim(note),
  slot,
  null,
  created_at
from public.meal_logs
where not exists (
  select 1 from public.food_logs existing where existing.id = meal_logs.id
);

alter table public.food_logs enable row level security;

create policy "food_logs_all_own" on public.food_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.health_logs add column kind text;

update public.health_logs
set kind = 'temperature'
where temperature_c is not null
  and btrim(coalesce(name, '')) = '';

insert into public.health_logs (
  id, user_id, logged_date, logged_time, name, dose, temperature_c, kind, created_at
)
select
  gen_random_uuid(),
  user_id,
  logged_date,
  logged_time,
  '',
  '',
  temperature_c,
  'temperature',
  created_at
from public.health_logs
where kind is null
  and temperature_c is not null
  and btrim(coalesce(name, '')) <> '';

update public.health_logs
set kind = 'medicine',
    temperature_c = null
where kind is null
  and btrim(coalesce(name, '')) <> '';

delete from public.health_logs
where kind is null;

alter table public.health_logs
  alter column kind set not null;

alter table public.health_logs
  add constraint health_logs_kind_check check (kind in ('temperature', 'medicine'));

alter table public.health_logs
  add constraint health_logs_payload_check check (
    (kind = 'temperature' and temperature_c is not null)
    or (kind = 'medicine' and btrim(name) <> '' and temperature_c is null)
  );

create table public.vaccine_logs (
  user_id uuid not null references public.profiles (id) on delete cascade,
  vaccine_key text not null,
  given_on date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, vaccine_key),
  check (vaccine_key in (
    'hb0', 'bcg', 'opv1', 'opv2', 'opv3', 'opv4',
    'dpt1', 'dpt2', 'dpt3', 'ipv', 'pcv1', 'pcv2', 'mr'
  ))
);

alter table public.vaccine_logs enable row level security;

create policy "vaccine_logs_all_own" on public.vaccine_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
