-- Add plan and price tracking to subscriptions
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan text DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise'));
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_price_id text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS asset_count int DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS user_count int DEFAULT 0;

-- Store plan name in companies for quick access
ALTER TABLE companies ADD COLUMN IF NOT EXISTS plan text DEFAULT 'starter';

