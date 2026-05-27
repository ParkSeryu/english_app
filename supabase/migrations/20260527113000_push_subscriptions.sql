-- Store opt-in browser push subscriptions for review reminders.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  enabled boolean not null default true,
  disabled_at timestamptz,
  last_notified_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists push_subscriptions_enabled_user_idx
  on public.push_subscriptions (enabled, user_id)
  where enabled = true;

create index if not exists push_subscriptions_last_notified_idx
  on public.push_subscriptions (last_notified_at)
  where enabled = true;

alter table public.push_subscriptions enable row level security;

do $$
begin
  drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
  drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
  drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
  drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
end;
$$;

create policy "push_subscriptions_select_own" on public.push_subscriptions
for select
to authenticated
using (user_id = auth.uid());

create policy "push_subscriptions_insert_own" on public.push_subscriptions
for insert
to authenticated
with check (user_id = auth.uid());

create policy "push_subscriptions_update_own" on public.push_subscriptions
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "push_subscriptions_delete_own" on public.push_subscriptions
for delete
to authenticated
using (user_id = auth.uid());

grant select, insert, update, delete on public.push_subscriptions to authenticated;

notify pgrst, 'reload schema';
