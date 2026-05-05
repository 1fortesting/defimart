-- Convert image_url to image_urls array and migrate data
ALTER TABLE public.feeds 
ADD COLUMN image_urls TEXT[] DEFAULT '{}';

-- Migration logic: Move existing image_url to the new image_urls array
UPDATE public.feeds 
SET image_urls = ARRAY[image_url] 
WHERE image_url IS NOT NULL;

-- Remove old column (optional but cleaner)
-- ALTER TABLE public.feeds DROP COLUMN image_url;
