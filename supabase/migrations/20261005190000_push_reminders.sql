-- Replace the unused client reminder tables with Web Push storage.
-- scheduled_notifications stays and becomes the send queue.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$;

drop table if exists public.reminder_fired_events;
drop table if exists public.notification_preferences;

alter table public.profiles
  add column if not exists timezone text not null default 'Asia/Jakarta';

create table public.push_reminder_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger push_reminder_preferences_set_updated_at
  before update on public.push_reminder_preferences
  for each row execute function public.set_updated_at();

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

delete from public.scheduled_notifications
where id in (
  select id from (
    select
      id,
      row_number() over (partition by user_id, kind order by updated_at desc, id desc) as rn
    from public.scheduled_notifications
  ) ranked
  where rn > 1
);

create unique index if not exists scheduled_notifications_user_kind_idx
  on public.scheduled_notifications (user_id, kind);

alter table public.push_reminder_preferences enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "push_reminder_preferences_all_own"
  on public.push_reminder_preferences
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "push_subscriptions_all_own"
  on public.push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Marks one due slot as sent so two overlapping jobs cannot both deliver it.
create or replace function public.claim_push_slot(row_id uuid, pending text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.scheduled_notifications
  set
    payload = jsonb_set(coalesce(payload, '{}'::jsonb), '{sentKey}', to_jsonb(pending), true),
    last_run_at = now()
  where id = row_id
    and payload->>'pendingKey' = pending
    and coalesce(payload->>'sentKey', '') is distinct from pending;
  return found;
end;
$$;

revoke all on function public.claim_push_slot(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_push_slot(uuid, text) to service_role;

-- Cron calls the Edge Function once a minute.
-- Before it can deliver anything, add two Vault secrets:
--   push_function_url  = https://<project-ref>.supabase.co/functions/v1/send-due-reminders
--   push_cron_secret   = the service role key
-- And set function secrets VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and
-- VAPID_SUBJECT (mailto:you@example.com).
do $$
begin
  begin
    create extension if not exists pg_cron;
    create extension if not exists pg_net;
  exception when others then
    raise notice 'push cron extensions unavailable: %', sqlerrm;
    return;
  end;

  begin
    perform cron.unschedule('send-due-push-reminders');
  exception when others then
    null;
  end;

  perform cron.schedule(
    'send-due-push-reminders',
    '* * * * *',
    $job$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'push_function_url'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'push_cron_secret')
      ),
      body := '{"source":"cron"}'::jsonb
    )
    where exists (
      select 1 from vault.decrypted_secrets where name = 'push_function_url'
    )
      and exists (
        select 1 from vault.decrypted_secrets where name = 'push_cron_secret'
      );
    $job$
  );
exception when others then
  raise notice 'push cron was not scheduled: %', sqlerrm;
end $$;
