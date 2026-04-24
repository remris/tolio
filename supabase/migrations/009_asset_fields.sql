-- Add maintenance_interval_months to machines
ALTER TABLE machines ADD COLUMN IF NOT EXISTS maintenance_interval_months integer;

-- Add serial_no and condition to tools
ALTER TABLE tools ADD COLUMN IF NOT EXISTS serial_no text;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS condition text DEFAULT 'good' CHECK (condition IN ('good', 'worn', 'damaged'));

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company members can view locations"
  ON locations FOR SELECT
  USING (company_id = (SELECT company_id FROM users WHERE auth_id = auth.uid())
    OR company_id = (SELECT company_id FROM companies WHERE id = company_id));

CREATE POLICY "admins can manage locations"
  ON locations FOR ALL
  USING (company_id = (SELECT company_id FROM users WHERE auth_id = auth.uid() AND role_id IS NOT NULL));

-- Add location_id to assets
ALTER TABLE assets ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES locations(id) ON DELETE SET NULL;

-- Index
CREATE INDEX IF NOT EXISTS idx_locations_company ON locations(company_id);
CREATE INDEX IF NOT EXISTS idx_assets_location ON assets(location_id);

