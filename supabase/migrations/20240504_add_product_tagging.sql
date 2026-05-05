-- Add product_id column to feeds table to allow tagging a product in a post
ALTER TABLE public.feeds 
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;

-- Update RLS policies if necessary (usually they cover all columns by default)
-- But let's ensure the select policy includes the product join
COMMENT ON COLUMN public.feeds.product_id IS 'Reference to a product tagged in this feed post';
