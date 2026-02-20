-- Create settings table
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Turn on RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access to authenticated users" ON settings
  FOR SELECT TO authenticated USING (true);

-- Allow all access to authenticated users (for now, simpler for single-tenant/simple app)
CREATE POLICY "Allow all access to authenticated users" ON settings
  FOR ALL TO authenticated USING (true);
