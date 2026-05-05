-- 1. Create the 'feeds' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('feeds', 'feeds', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable policies for the 'feeds' bucket
-- We use unique names and drop existing ones to avoid conflicts

DROP POLICY IF EXISTS "Public Read Access for Feeds" ON storage.objects;
CREATE POLICY "Public Read Access for Feeds"
ON storage.objects FOR SELECT
USING (bucket_id = 'feeds');

DROP POLICY IF EXISTS "Admin Upload Access for Feeds" ON storage.objects;
CREATE POLICY "Admin Upload Access for Feeds"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'feeds' AND 
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'CEO')
  ))
);

DROP POLICY IF EXISTS "Admin Delete Access for Feeds" ON storage.objects;
CREATE POLICY "Admin Delete Access for Feeds"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'feeds' AND 
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'CEO')
  ))
);

DROP POLICY IF EXISTS "Admin Update Access for Feeds" ON storage.objects;
CREATE POLICY "Admin Update Access for Feeds"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'feeds' AND 
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'CEO')
  ))
);
