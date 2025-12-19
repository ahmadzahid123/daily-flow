-- Enable extensions needed for scheduled function calls (if available)
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Shared updated_at trigger helper
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

-- Store browser push subscriptions per user
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  endpoint text not null,
  subscription jsonb not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (user_id, endpoint)
);

create index if not exists idx_push_subscriptions_user_id on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

create policy "Users can view their own push subscriptions"
on public.push_subscriptions
for select
using (auth.uid() = user_id);

create policy "Users can create their own push subscriptions"
on public.push_subscriptions
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own push subscriptions"
on public.push_subscriptions
for update
using (auth.uid() = user_id);

create policy "Users can delete their own push subscriptions"
on public.push_subscriptions
for delete
using (auth.uid() = user_id);

drop trigger if exists update_push_subscriptions_updated_at on public.push_subscriptions;
create trigger update_push_subscriptions_updated_at
before update on public.push_subscriptions
for each row
execute function public.update_updated_at_column();