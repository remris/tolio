-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Companies
create table companies (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  code       text not null unique,
  created_at timestamptz default now()
);

-- Roles
create table roles (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name       text not null,
  created_at timestamptz default now(),
  unique(company_id, name)
);

-- Permissions
create table permissions (
  id  uuid primary key default gen_random_uuid(),
  key text not null unique
);

insert into permissions (key) values
  ('assets.create'),
  ('assets.update'),
  ('assets.delete'),
  ('users.create'),
  ('users.update'),
  ('scan.use'),
  ('vehicles.manage'),
  ('roles.manage');

-- Role Permissions
create table role_permissions (
  role_id       uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- Users
create table users (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references companies(id) on delete cascade,
  auth_id       uuid unique,
  username      text not null,
  email         text,
  role_id       uuid references roles(id),
  password_hash text,
  active        boolean default true,
  created_at    timestamptz default now(),
  unique(company_id, username)
);

-- Asset enums
create type asset_type as enum ('tool', 'machine', 'vehicle');
create type asset_status as enum ('available', 'in_use', 'broken', 'maintenance');

-- Assets
create table assets (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name       text not null,
  type       asset_type not null,
  status     asset_status default 'available',
  qr_code    text unique,
  notes      text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tools
create table tools (
  id       uuid primary key default gen_random_uuid(),
  asset_id uuid not null unique references assets(id) on delete cascade
);

-- Machines
create table machines (
  id           uuid primary key default gen_random_uuid(),
  asset_id     uuid not null unique references assets(id) on delete cascade,
  serial_no    text,
  manufacturer text
);

-- Vehicles
create table vehicles (
  id                  uuid primary key default gen_random_uuid(),
  asset_id            uuid not null unique references assets(id) on delete cascade,
  license_plate       text not null,
  mileage             integer default 0,
  tuv_date            date,
  last_maintenance_at date,
  next_maintenance_at date,
  fuel_level          integer check (fuel_level between 0 and 100),
  current_driver_id   uuid references users(id)
);

-- Asset Logs
create table asset_logs (
  id         uuid primary key default gen_random_uuid(),
  asset_id   uuid not null references assets(id) on delete cascade,
  user_id    uuid references users(id),
  action     text not null check (action in ('check_out', 'check_in')),
  note       text,
  created_at timestamptz default now()
);

-- Subscriptions
create table subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  company_id             uuid not null unique references companies(id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text,
  status                 text default 'trialing',
  current_period_end     timestamptz,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

-- Indexes
create index on assets (company_id);
create index on assets (type);
create index on assets (status);
create index on asset_logs (asset_id);
create index on asset_logs (user_id);
create index on users (company_id);
create index on users (auth_id);
create index on vehicles (asset_id);

-- RLS
alter table companies      enable row level security;
alter table roles          enable row level security;
alter table permissions    enable row level security;
alter table role_permissions enable row level security;
alter table users          enable row level security;
alter table assets         enable row level security;
alter table tools          enable row level security;
alter table machines       enable row level security;
alter table vehicles       enable row level security;
alter table asset_logs     enable row level security;
alter table subscriptions  enable row level security;

-- Helper function: get company_id of authenticated admin user
create or replace function auth_company_id()
returns uuid language sql stable as $$
  select company_id from users where auth_id = auth.uid() limit 1;
$$;

-- Policies: company isolation
create policy "company_isolation" on assets
  for all using (company_id = auth_company_id());

create policy "company_isolation" on roles
  for all using (company_id = auth_company_id());

create policy "company_isolation" on users
  for all using (company_id = auth_company_id());

create policy "company_isolation" on asset_logs
  for all using (
    asset_id in (select id from assets where company_id = auth_company_id())
  );

create policy "company_isolation" on subscriptions
  for all using (company_id = auth_company_id());

create policy "read_all" on permissions for select using (true);
create policy "read_all" on role_permissions for select using (true);

create policy "company_isolation" on tools
  for all using (asset_id in (select id from assets where company_id = auth_company_id()));

create policy "company_isolation" on machines
  for all using (asset_id in (select id from assets where company_id = auth_company_id()));

create policy "company_isolation" on vehicles
  for all using (asset_id in (select id from assets where company_id = auth_company_id()));

