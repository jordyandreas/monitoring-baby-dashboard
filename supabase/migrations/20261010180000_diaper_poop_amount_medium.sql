-- Allow a middle poop amount between a little and a lot.

alter table public.diaper_logs drop constraint if exists diaper_logs_poop_amount_check;

alter table public.diaper_logs
  add constraint diaper_logs_poop_amount_check
  check (poop_amount is null or poop_amount in ('little', 'medium', 'much'));
