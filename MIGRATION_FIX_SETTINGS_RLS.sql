-- Drop the restrictive policy
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON settings;
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON settings;

-- Create a permissive policy that allows the server (anon) to write
-- Note: In a production app with multi-tenancy, you would use a service_role client or forward auth.
-- For this setup where the server client is anon, we allow public access.
CREATE POLICY "Allow all access" ON settings
  FOR ALL TO public USING (true);
