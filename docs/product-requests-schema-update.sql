-- Add the product_name column, allowing NULL values initially
ALTER TABLE public.product_requests
ADD COLUMN product_name TEXT;

-- Backfill existing rows with a placeholder value from the description
-- This ensures the NOT NULL constraint can be added safely
UPDATE public.product_requests
SET product_name = 'Request: ' || left(description, 40) || '...'
WHERE product_name IS NULL;

-- Now, add the NOT NULL constraint as all new entries will require a product name
ALTER TABLE public.product_requests
ALTER COLUMN product_name SET NOT NULL;
