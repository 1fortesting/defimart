
-- 1. Create the fcm_tokens table to store device tokens
CREATE TABLE IF NOT EXISTS public.fcm_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- 3. Create policies so users can only manage their own tokens
CREATE POLICY "Users can insert their own tokens" 
ON public.fcm_tokens FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own tokens" 
ON public.fcm_tokens FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens" 
ON public.fcm_tokens FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens" 
ON public.fcm_tokens FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Create an index for faster lookups when sending notifications
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON public.fcm_tokens(user_id);

-- 5. Add a comment for clarity
COMMENT ON TABLE public.fcm_tokens IS 'Stores Firebase Cloud Messaging tokens for push notifications linked to user profiles.';
