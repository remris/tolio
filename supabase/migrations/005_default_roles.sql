-- Add default Mitarbeiter and Fahrer roles for companies that only have Admin
-- Safe to run multiple times (uses DO $$ block with existence check)

do $$
declare
  comp record;
  perm_scan uuid;
  perm_assets_update uuid;
  perm_vehicles uuid;
  mit_role uuid;
  fahr_role uuid;
begin
  -- Guard: abort if required tables don't exist yet
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'permissions') then
    raise notice 'Table permissions does not exist yet, skipping migration.';
    return;
  end if;

  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'roles') then
    raise notice 'Table roles does not exist yet, skipping migration.';
    return;
  end if;

  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'companies') then
    raise notice 'Table companies does not exist yet, skipping migration.';
    return;
  end if;

  select id into perm_scan          from permissions where key = 'scan.use'        limit 1;
  select id into perm_assets_update from permissions where key = 'assets.update'   limit 1;
  select id into perm_vehicles      from permissions where key = 'vehicles.manage' limit 1;

  for comp in select id from companies loop
    -- Mitarbeiter
    if not exists (select 1 from roles where company_id = comp.id and name = 'Mitarbeiter') then
      insert into roles (company_id, name) values (comp.id, 'Mitarbeiter') returning id into mit_role;
      if perm_scan          is not null then insert into role_permissions (role_id, permission_id) values (mit_role, perm_scan); end if;
      if perm_assets_update is not null then insert into role_permissions (role_id, permission_id) values (mit_role, perm_assets_update); end if;
    end if;

    -- Fahrer
    if not exists (select 1 from roles where company_id = comp.id and name = 'Fahrer') then
      insert into roles (company_id, name) values (comp.id, 'Fahrer') returning id into fahr_role;
      if perm_scan     is not null then insert into role_permissions (role_id, permission_id) values (fahr_role, perm_scan); end if;
      if perm_vehicles is not null then insert into role_permissions (role_id, permission_id) values (fahr_role, perm_vehicles); end if;
    end if;
  end loop;
end $$;
