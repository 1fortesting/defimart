import { createClient } from '@/lib/supabase/server';
import { FeedCard } from '@/components/feed-card';
import { Bookmark } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function SavedFeedsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        redirect('/login?returnTo=/saved/feeds');
    }

    const { data: savedItems } = await supabase
        .from('feed_saves')
        .select(`
            feed:feeds (
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
                saves:feed_saves(user_id)
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    const feeds = savedItems?.map(item => item.feed).filter(Boolean) || [];

    return (
        <div className="max-w-xl mx-auto pb-20 md:pt-4">
            <div className="py-6 px-4 space-y-2 border-b mb-6">
                <div className="flex items-center gap-2">
                    <Bookmark className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-bold">Saved Posts</h1>
                </div>
                <p className="text-sm text-muted-foreground">Only you can see what you've saved.</p>
            </div>

            <div className="space-y-4 md:space-y-8">
                {feeds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-2">
                        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                           <Bookmark className="h-8 w-8" />
                        </div>
                        <p className="font-medium">No saved posts yet</p>
                        <p className="text-xs">Posts you save will appear here.</p>
                    </div>
                ) : (
                    feeds.map((feed: any) => {
                        const isLiked = feed.likes.some((l: any) => l.user_id === user.id);
                        const isSaved = true; // By definition in this page
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
