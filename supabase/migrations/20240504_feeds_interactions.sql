-- 1. Table for Feed Likes
CREATE TABLE IF NOT EXISTS public.feed_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    feed_id UUID REFERENCES public.feeds(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, feed_id)
);

-- 2. Table for Feed Comments
CREATE TABLE IF NOT EXISTS public.feed_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    feed_id UUID REFERENCES public.feeds(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table for Feed Saves
CREATE TABLE IF NOT EXISTS public.feed_saves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    feed_id UUID REFERENCES public.feeds(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, feed_id)
);

-- Enable RLS
ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_saves ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Likes
CREATE POLICY "Likes are viewable by everyone" ON public.feed_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own likes" ON public.feed_likes FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for Comments
CREATE POLICY "Comments are viewable by everyone" ON public.feed_comments FOR SELECT USING (true);
CREATE POLICY "Users can manage their own comments" ON public.feed_comments FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for Saves
CREATE POLICY "Saves are viewable only by owner" ON public.feed_saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own saves" ON public.feed_saves FOR ALL USING (auth.uid() = user_id);
