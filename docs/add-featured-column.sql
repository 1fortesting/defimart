-- Add the is_featured column to the products table
ALTER TABLE public.products
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;

-- Add RLS policy for the new column
-- Allow everyone to read the is_featured status
CREATE POLICY "Enable read access for all users on is_featured"
ON public.products
FOR SELECT
USING (true);

-- Ensure admins can update the is_featured status
-- Note: You might need to adjust this policy based on your admin role definition
-- This assumes your existing update policy for products allows admins to update.
-- If not, you might need to create a specific policy for this column.
-- Example:
-- CREATE POLICY "Allow admins to update is_featured"
-- ON public.products
-- FOR UPDATE
-- USING (auth.role() = 'service_role') -- or your custom admin role check
-- WITH CHECK (auth.role() = 'service_role');
