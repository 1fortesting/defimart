-- Add role column to profiles table to support admin/CEO privileges
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Set existing admin email to have admin role
-- Replace 'admin@example.com' with the actual admin email from your environment
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'admin@example.com' -- Update this with your actual admin email
);

-- Note: You can manually update your CEO account in the Supabase dashboard
-- to have the 'CEO' role in the profiles table.
