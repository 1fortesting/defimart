import { createClient } from '@/lib/supabase/server';
import { FeedCard } from '@/components/feed-card';
import { MessageCircle, Heart, Bookmark } from 'lucide-react';

export default async function FeedsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: feeds } = await supabase
        .from('feeds')
        .select(`
            *,
            profiles:author_id (
                display_name,
                avatar_url
            ),
            likes:feed_likes(user_id),
            comments:feed_comments(
                *,
                profiles:user_id(display_name, avatar_url)
            ),
            saves:feed_saves(user_id),
            products:product_id (*)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    return (
        <div className="max-w-xl mx-auto pb-20 md:pt-4">
            {/* Feeds Header & Saved Posts Link */}
            <div className="px-4 py-4 flex items-center justify-between border-b md:border-none mb-2">
                <h1 className="text-xl font-black tracking-tight italic">FEED</h1>
                <a 
                    href="/saved?tab=feeds" 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold transition-all border border-primary/10"
                >
                    <Bookmark className="h-3.5 w-3.5 fill-current" />
                    Saved Posts
                </a>
            </div>

            <div className="space-y-4 md:space-y-8">
                {!feeds || feeds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-2">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                           <MessageCircle className="h-8 w-8" />
                        </div>
                        <p className="font-medium">No posts yet</p>
                    </div>
                ) : (
                    feeds.map((feed: any) => {
                        const isLiked = user ? feed.likes.some((l: any) => l.user_id === user.id) : false;
                        const isSaved = user ? feed.saves.some((s: any) => s.user_id === user.id) : false;
                        const likeCount = feed.likes.length;
                        const comments = feed.comments || [];

                        return (
                            <FeedCard 
                                key={feed.id}
                                feed={feed}
                                currentUser={user}
                                initialLikes={likeCount}
                                isLikedInitial={isLiked}
                                isSavedInitial={isSaved}
                                commentsInitial={comments}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}
