-- Add photo_urls to asset_logs for checkout/checkin/defect photos
alter table asset_logs add column if not exists photo_urls text[] default '{}';

