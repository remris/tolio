-- Push Subscriptions for PWA Push Notifications
create table push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  company_id  uuid not null references companies(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz default now()
);

create index on push_subscriptions (user_id);
create index on push_subscriptions (company_id);

alter table push_subscriptions enable row level security;

create policy "company_isolation" on push_subscriptions
  for all using (company_id = auth_company_id());

