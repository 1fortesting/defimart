'use client';

import { createClient } from '@/lib/supabase/client';
import { AuthPrompt } from '@/components/auth-prompt';
import { ProductCard } from '@/components/product-card';
import { FeedCard } from '@/components/feed-card';
import { Tables } from '@/types/supabase';
import { useEffect, useState, Suspense } from 'react';
import type { User } from '@supabase/supabase-js';
import { Loader2, Heart, Newspaper, Bookmark } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from 'next/navigation';

type SavedProductWithDetails = Tables<'saved_products'> & {
  products: Tables<'products'> | null;
};

function SavedContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'feeds' ? 'feeds' : 'products';
  
  const [user, setUser] = useState<User | null>(null);
  const [savedProducts, setSavedProducts] = useState<SavedProductWithDetails[]>([]);
  const [savedFeeds, setSavedFeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const supabase = createClient();
    const fetchAllSaved = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
            // Fetch Products
            const { data: productsData } = await supabase
                .from('saved_products')
                .select('*, products(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            
            if (productsData) setSavedProducts(productsData as SavedProductWithDetails[]);

            // Fetch Feeds
            const { data: feedsData } = await supabase
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

            if (feedsData) {
                setSavedFeeds(feedsData.map((item: any) => item.feed).filter(Boolean));
            }
        }
        setLoading(false);
    };

    fetchAllSaved();
  }, []);
  
  const handleUnsaveProduct = (productId: string) => {
    setSavedProducts(currentItems => currentItems.filter(item => item.product_id !== productId));
  };

  const handleUnsaveFeed = (feedId: string) => {
    setSavedFeeds(currentFeeds => currentFeeds.filter(feed => feed.id !== feedId));
  };
  
  if (loading) {
    return (
        <div className="flex-1 p-8 flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (!user) {
    return (
        <div className="flex-1 p-8 flex items-center justify-center min-h-[400px]">
          <AuthPrompt />
        </div>
    );
  }
  
  const savedProductIds = new Set(savedProducts.map(item => item.product_id));

  return (
      <main className="flex-1 min-h-screen pb-20">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="flex flex-col gap-1 mb-8">
              <h1 className="text-3xl font-black tracking-tight text-foreground">Saved Items</h1>
              <p className="text-muted-foreground text-sm">Everything you've saved for later.</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="products" className="rounded-lg py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Heart className="h-4 w-4 mr-2" />
                Wishlist ({savedProducts.length})
              </TabsTrigger>
              <TabsTrigger value="feeds" className="rounded-lg py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Newspaper className="h-4 w-4 mr-2" />
                Posts ({savedFeeds.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="mt-0">
              {savedProducts.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
                  {savedProducts.map((item) => 
                    item.products ? (
                      <ProductCard 
                        key={item.id} 
                        product={item.products} 
                        user={user} 
                        isSaved={savedProductIds.has(item.product_id)} 
                        onUnsave={handleUnsaveProduct}
                      />
                    ) : null
                  )}
                </div>
              ) : (
                <div className="text-center py-20 bg-background/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-muted flex flex-col items-center justify-center space-y-4">
                  <div className="p-4 bg-muted/50 rounded-full">
                    <Heart className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold">Your wishlist is empty</p>
                    <p className="text-sm text-muted-foreground">Tap the heart icon on products to save them.</p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="feeds" className="mt-0 max-w-xl mx-auto">
              {savedFeeds.length > 0 ? (
                <div className="space-y-6">
                  {savedFeeds.map((feed) => {
                    const isLiked = feed.likes?.some((l: any) => l.user_id === user.id) || false;
                    const isSaved = true;
                    const likeCount = feed.likes?.length || 0;
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
                            onUnsave={handleUnsaveFeed}
                        />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 bg-background/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-muted flex flex-col items-center justify-center space-y-4">
                  <div className="p-4 bg-muted/50 rounded-full">
                    <Bookmark className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold">No saved posts</p>
                    <p className="text-sm text-muted-foreground">Save interesting updates from the feed to see them here.</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
  );
}

export default function SavedPage() {
    return (
        <Suspense fallback={
            <div className="flex-1 p-8 flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <SavedContent />
        </Suspense>
    );
}
