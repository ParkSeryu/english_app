-- Store PWA push subscriptions and topic-level notification delivery state.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  expiration_time timestamptz,
  user_agent text,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_active_idx
  on public.push_subscriptions (user_id, is_active, updated_at desc);

create table if not exists public.topic_notification_sends (
  id uuid primary key default gen_random_uuid(),
  expression_day_id uuid not null references public.expression_days(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  target_url text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists topic_notification_sends_topic_idx
  on public.topic_notification_sends (expression_day_id, created_at desc);

create table if not exists public.topic_notification_deliveries (
  send_id uuid not null references public.topic_notification_sends(id) on delete cascade,
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (send_id, subscription_id)
);

create index if not exists topic_notification_deliveries_pending_idx
  on public.topic_notification_deliveries (status, created_at asc);
create index if not exists topic_notification_deliveries_user_idx
  on public.topic_notification_deliveries (user_id, created_at desc);

alter table public.push_subscriptions enable row level security;
alter table public.topic_notification_sends enable row level security;
alter table public.topic_notification_deliveries enable row level security;

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;

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
