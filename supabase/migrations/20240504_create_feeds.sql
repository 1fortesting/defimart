-- 1. Create the feeds table
CREATE TABLE IF NOT EXISTS public.feeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT true
);

-- 2. Enable RLS
ALTER TABLE public.feeds ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Everyone can read published feeds
CREATE POLICY "Feeds are viewable by everyone" 
ON public.feeds FOR SELECT 
USING (is_published = true);

-- Only admins/CEO can insert/update/delete
-- Assuming 'role' in user_metadata or a separate 'profiles' table with 'role'
-- For this project, we'll check the 'profiles' table if it exists, otherwise metadata.
-- Let's check if 'profiles' table exists and has a role field.
CREATE POLICY "Only admins can manage feeds" 
ON public.feeds FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'CEO')
  )
);

-- 4. Storage Bucket for feed images
-- Note: This usually needs to be done via Supabase dashboard or API, 
-- but here is the SQL for the storage schema if you have access to it.
-- INSERT INTO storage.buckets (id, name, public) VALUES ('feeds', 'feeds', true);

-- Storage Policies for 'feeds' bucket
-- Allow public access to read images
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'feeds');
-- Allow admins to upload
-- CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'feeds' AND (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'CEO'))));
