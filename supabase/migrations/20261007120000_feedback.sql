-- User-submitted feedback from the account menu.

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  email text not null,
  whatsapp text not null,
  message text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index feedback_user_created_idx
  on public.feedback (user_id, created_at desc);

create trigger feedback_set_updated_at
  before update on public.feedback
  for each row execute function public.set_updated_at();

alter table public.feedback enable row level security;

create policy "feedback_all_own"
  on public.feedback
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
