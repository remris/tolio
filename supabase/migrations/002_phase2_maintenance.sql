-- ============================================================
-- PHASE 2: Wartungsmanagement + Fahrzeug-Tracking
-- ============================================================

-- Extend asset_logs with optional mileage (for vehicle checkout/checkin)
alter table asset_logs add column if not exists mileage integer;
alter table asset_logs add column if not exists note text;

-- Maintenance records table
create table if not exists maintenance_records (
  id          uuid primary key default uuid_generate_v4(),
  asset_id    uuid not null references assets(id) on delete cascade,
  user_id     uuid references users(id) on delete set null,
  performed_at date not null,
  description text,
  cost        numeric(10, 2),
  next_due_at date,
  created_at  timestamptz not null default now()
);

create index if not exists idx_maintenance_asset on maintenance_records(asset_id);
create index if not exists idx_maintenance_date  on maintenance_records(performed_at desc);

alter table maintenance_records enable row level security;

create policy "maintenance_select" on maintenance_records
  for select using (
    asset_id in (select id from assets where company_id = auth_company_id())
  );

create policy "maintenance_insert" on maintenance_records
  for insert with check (
    asset_id in (select id from assets where company_id = auth_company_id())
  );

create policy "maintenance_update" on maintenance_records
  for update using (
    asset_id in (select id from assets where company_id = auth_company_id())
  );

create policy "maintenance_delete" on maintenance_records
  for delete using (
    asset_id in (select id from assets where company_id = auth_company_id())
  );

