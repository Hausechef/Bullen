-- WARN: "Public read access for premarket contracts" granted SELECT on
-- storage.objects to role `public` (anon + authenticated), letting anyone
-- enumerate every file in the premarket_contracts bucket via list()/REST,
-- leaking signed-contract filenames/paths across all users. The bucket
-- itself is a public bucket, so direct object URL access (getPublicUrl)
-- already bypasses RLS entirely and needs no SELECT policy -- confirmed
-- by grep: the client only reads contract_url (an admin-managed template
-- URL) and never lists the bucket. The admin health-check .list() call in
-- AdminPreMarket.tsx runs as an authenticated admin/trade_admin, which
-- the replacement policy still allows.
DROP POLICY IF EXISTS "Public read access for premarket contracts" ON storage.objects;
CREATE POLICY "Admin read access for premarket contracts" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'premarket_contracts'
  AND get_my_role() = ANY (ARRAY['admin','superadmin','trade_admin'])
);
