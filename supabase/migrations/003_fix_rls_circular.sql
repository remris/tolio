-- Fix circular RLS: auth_company_id() queries users table, which triggers the users RLS policy,
-- which calls auth_company_id() again → infinite recursion → login fails.
-- SECURITY DEFINER runs as the function owner (postgres), bypassing RLS for this lookup.

create or replace function auth_company_id()
returns uuid language sql stable security definer
set search_path = public
as $$
  select company_id from users where auth_id = auth.uid() limit 1;
$$;

