-- 1. Create the new table for product requests
CREATE TABLE public.product_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sourced', 'rejected'
  admin_notes TEXT
);

-- 2. Create the storage bucket for request images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('requested_product_images', 'requested_product_images', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- 3. RLS Policies for product_requests table
-- Allow users to view their own requests
CREATE POLICY "Users can view their own requests"
ON public.product_requests FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own requests
CREATE POLICY "Users can create requests"
ON public.product_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow admin users full access (assuming you use service_role key for admin actions)
CREATE POLICY "Admin users have full access"
ON public.product_requests FOR ALL
USING (TRUE)
WITH CHECK (TRUE);

-- 4. RLS Policies for storage bucket
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'requested_product_images');

-- Allow anyone to view images (since it's a public bucket)
CREATE POLICY "Anyone can view request images"
ON storage.objects FOR SELECT
USING (bucket_id = 'requested_product_images');
