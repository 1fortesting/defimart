-- Admin Access Control Policies
-- This script grants full database and storage access to users designated as admins.

-- Step 1: Add a 'role' column to the 'profiles' table to distinguish admins.
-- By default, all users will have the 'user' role.
-- To make a user an admin, you will need to manually change their 'role' to 'admin' in the Supabase table editor for that user.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';


-- Step 2: Create a helper function to check if the current user is an admin.
-- This function checks the 'role' column in the 'profiles' table for the currently logged-in user.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;


-- Step 3: Apply policies to grant admins full access.
-- We add PERMISSIVE policies. If any permissive policy for a given command (SELECT, INSERT, etc.)
-- passes, then the operation is allowed. These policies work alongside your existing user policies.

-- Grant full access to 'products' table for admins.
CREATE POLICY "Admins have full access to products" ON public.products FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Grant full access to 'categories' table for admins.
CREATE POLICY "Admins have full access to categories" ON public.categories FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Grant full access to 'orders' table for admins.
CREATE POLICY "Admins have full access to orders" ON public.orders FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Grant full access to 'cart_items' table for admins.
CREATE POLICY "Admins have full access to cart_items" ON public.cart_items FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Grant full access to 'profiles' table for admins.
CREATE POLICY "Admins have full access to profiles" ON public.profiles FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Grant full access to 'saved_products' table for admins.
CREATE POLICY "Admins have full access to saved_products" ON public.saved_products FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Grant full access to 'conversations' table for admins.
CREATE POLICY "Admins have full access to conversations" ON public.conversations FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Grant full access to 'messages' table for admins.
CREATE POLICY "Admins have full access to messages" ON public.messages FOR ALL USING (is_admin()) WITH CHECK (is_admin());


-- Step 4: Grant admins full access to storage buckets.

-- Grant full access to 'product_images' bucket for admins.
CREATE POLICY "Admins can manage all product_images" ON storage.objects FOR ALL USING (bucket_id = 'product_images' AND is_admin()) WITH CHECK (bucket_id = 'product_images' AND is_admin());
