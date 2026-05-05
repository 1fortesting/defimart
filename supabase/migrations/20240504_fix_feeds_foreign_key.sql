-- Fix the author_id to reference public.profiles(id) instead of auth.users(id)
-- This allows the UI to easily join with the profiles table for display names/avatars.

-- First, drop the existing constraint
ALTER TABLE public.feeds 
DROP CONSTRAINT IF EXISTS feeds_author_id_fkey;

-- Add the correct constraint
ALTER TABLE public.feeds 
ADD CONSTRAINT feeds_author_id_fkey 
FOREIGN KEY (author_id) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;
