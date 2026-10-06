-- Migration 28: Create bucket for premarket contracts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'premarket_contracts',
    'premarket_contracts',
    true,
    5242880, -- 5MB limit
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['application/pdf'];

-- Policies for premarket_contracts bucket
CREATE POLICY "Public read access for premarket contracts"
ON storage.objects FOR SELECT
USING (bucket_id = 'premarket_contracts');

CREATE POLICY "Admin upload access for premarket contracts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'premarket_contracts' 
    AND public.get_my_role() IN ('admin', 'superadmin', 'trade_admin')
);

CREATE POLICY "Admin update access for premarket contracts"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'premarket_contracts' 
    AND public.get_my_role() IN ('admin', 'superadmin', 'trade_admin')
);

CREATE POLICY "Admin delete access for premarket contracts"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'premarket_contracts' 
    AND public.get_my_role() IN ('admin', 'superadmin', 'trade_admin')
);
