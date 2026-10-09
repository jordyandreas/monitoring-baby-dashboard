-- How much poop was in the diaper, only when the log is poop or both.

alter table public.diaper_logs
  add column if not exists poop_amount text
  check (poop_amount is null or poop_amount in ('little', 'much'));
