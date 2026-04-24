-- Add photo_urls array to assets
alter table assets add column if not exists photo_urls text[] default '{}';

-- Add held_by column to track who has the asset
alter table assets add column if not exists held_by uuid references users(id) on delete set null;

-- Storage bucket for asset photos
insert into storage.buckets (id, name, public)
values ('asset-photos', 'asset-photos', true)
on conflict (id) do nothing;

-- Storage policies
create policy "asset_photos_select" on storage.objects
  for select using (bucket_id = 'asset-photos');

create policy "asset_photos_insert" on storage.objects
  for insert with check (bucket_id = 'asset-photos');

create policy "asset_photos_delete" on storage.objects
  for delete using (bucket_id = 'asset-photos');

-- Add assets.view and maintenance.manage permissions if not exists
insert into permissions (key) values ('assets.view') on conflict (key) do nothing;
insert into permissions (key) values ('maintenance.manage') on conflict (key) do nothing;
insert into permissions (key) values ('users.delete') on conflict (key) do nothing;

