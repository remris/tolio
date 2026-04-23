# Tolio – Datenbankschema

## 📊 Beziehungsübersicht

```
companies
  ├── users (company_id)
  ├── roles (company_id)
  ├── assets (company_id)
  └── subscriptions (company_id)

roles
  └── role_permissions (role_id)
        └── permissions (permission_id)

users
  └── role_id → roles

assets
  ├── tools (asset_id)
  ├── machines (asset_id)
  ├── vehicles (asset_id)
  └── asset_logs (asset_id)

asset_logs
  └── user_id → users
```

---

## 🗄️ SQL Schema

```sql
-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- COMPANIES
-- ============================================================
create table companies (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  code        text not null unique,               -- Firmencode für Mitarbeiter-Login
  created_at  timestamptz not null default now()
);

-- ============================================================
-- PERMISSIONS (statische Rechte-Keys)
-- ============================================================
create table permissions (
  id   uuid primary key default uuid_generate_v4(),
  key  text not null unique   -- z. B. "assets.create", "scan.use"
);

insert into permissions (key) values
  ('assets.create'),
  ('assets.update'),
  ('assets.delete'),
  ('assets.view'),
  ('users.create'),
  ('users.update'),
  ('users.delete'),
  ('roles.manage'),
  ('scan.use'),
  ('vehicles.manage'),
  ('maintenance.manage');

-- ============================================================
-- ROLES
-- ============================================================
create table roles (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid not null references companies(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  unique(company_id, name)
);

-- ============================================================
-- ROLE_PERMISSIONS
-- ============================================================
create table role_permissions (
  role_id        uuid not null references roles(id) on delete cascade,
  permission_id  uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- ============================================================
-- USERS
-- ============================================================
create table users (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid not null references companies(id) on delete cascade,
  auth_id     uuid unique,                        -- Supabase auth.users.id (nur für Admins)
  username    text not null,
  email       text,
  role_id     uuid references roles(id) on delete set null,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  unique(company_id, username)
);

-- ============================================================
-- ASSETS
-- ============================================================
create type asset_type   as enum ('tool', 'machine', 'vehicle');
create type asset_status as enum ('available', 'in_use', 'broken', 'maintenance');

create table assets (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid not null references companies(id) on delete cascade,
  name        text not null,
  type        asset_type   not null,
  status      asset_status not null default 'available',
  description text,
  qr_code     text unique,                        -- generierter QR-Payload
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- TOOLS (Werkzeuge)
-- ============================================================
create table tools (
  id        uuid primary key default uuid_generate_v4(),
  asset_id  uuid not null unique references assets(id) on delete cascade,
  category  text,                                 -- z. B. "Elektrowerkzeug"
  serial_no text
);

-- ============================================================
-- MACHINES (Maschinen)
-- ============================================================
create table machines (
  id               uuid primary key default uuid_generate_v4(),
  asset_id         uuid not null unique references assets(id) on delete cascade,
  model            text,
  manufacturer     text,
  serial_no        text,
  purchase_date    date,
  next_maintenance date
);

-- ============================================================
-- VEHICLES (Fahrzeuge)
-- ============================================================
create table vehicles (
  id                   uuid primary key default uuid_generate_v4(),
  asset_id             uuid not null unique references assets(id) on delete cascade,
  license_plate        text,
  mileage              integer default 0,
  tuv_date             date,
  last_maintenance_at  date,
  next_maintenance_at  date,
  fuel_status          text,                      -- z. B. "full", "half", "low"
  assigned_user_id     uuid references users(id) on delete set null,
  notes                text
);

-- ============================================================
-- ASSET_LOGS (Check-in / Check-out)
-- ============================================================
create type log_action as enum ('check_out', 'check_in');

create table asset_logs (
  id         uuid primary key default uuid_generate_v4(),
  asset_id   uuid not null references assets(id) on delete cascade,
  user_id    uuid references users(id) on delete set null,
  action     log_action not null,
  note       text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create type subscription_status as enum ('active', 'trialing', 'past_due', 'canceled', 'unpaid');

create table subscriptions (
  id                     uuid primary key default uuid_generate_v4(),
  company_id             uuid not null unique references companies(id) on delete cascade,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  status                 subscription_status not null default 'trialing',
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_assets_updated_at
  before update on assets
  for each row execute procedure set_updated_at();

create trigger trg_subscriptions_updated_at
  before update on subscriptions
  for each row execute procedure set_updated_at();
```

---

## 🔑 Indizes

```sql
-- Performance-kritische Abfragen
create index idx_users_company       on users(company_id);
create index idx_users_auth_id       on users(auth_id);
create index idx_roles_company       on roles(company_id);
create index idx_assets_company      on assets(company_id);
create index idx_assets_type         on assets(type);
create index idx_assets_status       on assets(status);
create index idx_asset_logs_asset    on asset_logs(asset_id);
create index idx_asset_logs_user     on asset_logs(user_id);
create index idx_asset_logs_created  on asset_logs(created_at desc);
create index idx_vehicles_asset      on vehicles(asset_id);
create index idx_subscriptions_co    on subscriptions(company_id);
```

---

## 🔐 Row Level Security (RLS)

```sql
-- RLS aktivieren
alter table companies       enable row level security;
alter table users           enable row level security;
alter table roles           enable row level security;
alter table role_permissions enable row level security;
alter table assets          enable row level security;
alter table tools           enable row level security;
alter table machines        enable row level security;
alter table vehicles        enable row level security;
alter table asset_logs      enable row level security;
alter table subscriptions   enable row level security;

-- -------------------------------------------------------
-- Helper: company_id des eingeloggten Users
-- -------------------------------------------------------
create or replace function auth_company_id()
returns uuid language sql stable security definer as $$
  select company_id from users where auth_id = auth.uid() limit 1;
$$;

-- -------------------------------------------------------
-- COMPANIES: nur eigene Firma lesen
-- -------------------------------------------------------
create policy "company_select" on companies
  for select using (id = auth_company_id());

-- -------------------------------------------------------
-- USERS: nur eigene Firma
-- -------------------------------------------------------
create policy "users_select" on users
  for select using (company_id = auth_company_id());

create policy "users_insert" on users
  for insert with check (company_id = auth_company_id());

create policy "users_update" on users
  for update using (company_id = auth_company_id());

create policy "users_delete" on users
  for delete using (company_id = auth_company_id());

-- -------------------------------------------------------
-- ROLES
-- -------------------------------------------------------
create policy "roles_select" on roles
  for select using (company_id = auth_company_id());

create policy "roles_insert" on roles
  for insert with check (company_id = auth_company_id());

create policy "roles_update" on roles
  for update using (company_id = auth_company_id());

create policy "roles_delete" on roles
  for delete using (company_id = auth_company_id());

-- -------------------------------------------------------
-- ASSETS
-- -------------------------------------------------------
create policy "assets_select" on assets
  for select using (company_id = auth_company_id());

create policy "assets_insert" on assets
  for insert with check (company_id = auth_company_id());

create policy "assets_update" on assets
  for update using (company_id = auth_company_id());

create policy "assets_delete" on assets
  for delete using (company_id = auth_company_id());

-- -------------------------------------------------------
-- ASSET_LOGS: lesen + schreiben nur eigene Firma
-- -------------------------------------------------------
create policy "logs_select" on asset_logs
  for select using (
    asset_id in (select id from assets where company_id = auth_company_id())
  );

create policy "logs_insert" on asset_logs
  for insert with check (
    asset_id in (select id from assets where company_id = auth_company_id())
  );

-- -------------------------------------------------------
-- SUBSCRIPTIONS
-- -------------------------------------------------------
create policy "subscriptions_select" on subscriptions
  for select using (company_id = auth_company_id());
```

---

## 🔗 Beziehungen auf einen Blick

| Tabelle | Fremdschlüssel | Referenz |
|---|---|---|
| users | company_id | companies.id |
| users | role_id | roles.id |
| users | auth_id | auth.users.id |
| roles | company_id | companies.id |
| role_permissions | role_id | roles.id |
| role_permissions | permission_id | permissions.id |
| assets | company_id | companies.id |
| tools | asset_id | assets.id |
| machines | asset_id | assets.id |
| vehicles | asset_id | assets.id |
| vehicles | assigned_user_id | users.id |
| asset_logs | asset_id | assets.id |
| asset_logs | user_id | users.id |
| subscriptions | company_id | companies.id |
| maintenance_records | asset_id | assets.id |
| maintenance_records | user_id | users.id |

