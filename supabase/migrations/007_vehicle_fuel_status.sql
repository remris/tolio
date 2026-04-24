-- Add fuel_status text column to vehicles (replacing integer fuel_level approach)
alter table vehicles add column if not exists fuel_status text
  check (fuel_status in ('full', 'three_quarter', 'half', 'quarter', 'empty'));

-- Add fuel_status to asset_logs so we can show it in history
alter table asset_logs add column if not exists fuel_status text;

-- Fix column: the code was writing to assigned_user_id but DB has current_driver_id
-- Keep both working by renaming for clarity (if current_driver_id exists, rename it)
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'vehicles' and column_name = 'current_driver_id'
  ) then
    alter table vehicles rename column current_driver_id to assigned_user_id;
  end if;
end $$;

