-- Final setup to grant CEO privileges to the admin account
-- Email: ericboatenglucky@gmail.com
-- Display Name: Defimart

-- 1. Ensure the role column exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. Grant CEO role to the specific admin user
UPDATE public.profiles
SET role = 'CEO',
    display_name = 'Defimart'
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'ericboatenglucky@gmail.com'
);

-- 3. Update Storage Policies to be strictly tied to this role
DROP POLICY IF EXISTS "Admin Upload Access for Feeds" ON storage.objects;
CREATE POLICY "Admin Upload Access for Feeds"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'feeds' AND 
  (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'CEO'
  ))
);

-- 4. Update Feed Table Policies
DROP POLICY IF EXISTS "Only admins can manage feeds" ON public.feeds;
CREATE POLICY "Only admins can manage feeds" 
ON public.feeds FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'CEO'
  )
);
