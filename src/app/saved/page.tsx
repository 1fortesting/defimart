'use client';

import { createClient } from '@/lib/supabase/client';
import { AuthPrompt } from '@/components/auth-prompt';
import { ProductCard } from '@/components/product-card';
import { FeedCard } from '@/components/feed-card';
import { Tables } from '@/types/supabase';
import { useEffect, useState, Suspense } from 'react';
import type { User } from '@supabase/supabase-js';
import { Loader2, Heart, Newspaper, Bookmark, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type SavedProductWithDetails = Tables<'saved_products'> & {
  products: (Tables<'products'> & { average_rating?: number, review_count?: number }) | null;
  vendor_products?: (Tables<'vendor_products'> & { average_rating?: number, review_count?: number }) | null;
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
            // Fetch Products with details from both possible linked tables
            const { data: productsData } = await supabase
                .from('saved_products')
                .select('*, products(*), vendor_products(*)').eq('user_id', user.id)
                .order('created_at', { ascending: false });
            
            if (productsData && productsData.length > 0) {
                // 1. Collect all product IDs to fetch reviews in bulk
                const platformIds = (productsData as any[]).map(p => p.product_id).filter(Boolean);
                const vendorIds = (productsData as any[]).map(p => p.vendor_product_id).filter(Boolean);

                // 2. Fetch platform reviews
                const { data: platformReviews } = platformIds.length > 0 
                    ? await supabase.from('reviews').select('product_id, rating').in('product_id', platformIds)
                    : { data: [] };
                
                // 3. Fetch vendor reviews
                const { data: vendorReviews } = vendorIds.length > 0 
                    ? await supabase.from('vendor_reviews' as any).select('vendor_product_id, rating').in('vendor_product_id', vendorIds)
                    : { data: [] };

                // 4. Map reviews to dictionaries for easy lookup
                const reviewsByProduct = (platformReviews || []).reduce((acc: Record<string, number[]>, review: any) => {
                    if (!acc[review.product_id]) acc[review.product_id] = [];
                    acc[review.product_id].push(review.rating);
                    return acc;
                }, {} as Record<string, number[]>);

                const vendorReviewsByProduct = (vendorReviews || []).reduce((acc: Record<string, number[]>, review: any) => {
                    if (!acc[review.vendor_product_id]) acc[review.vendor_product_id] = [];
                    acc[review.vendor_product_id].push(review.rating);
                    return acc;
                }, {} as Record<string, number[]>);

                // 5. Enrich the saved products with calculated ratings
                const enrichedProducts = (productsData as any[]).map(item => {
                    if (item.products) {
                        const ratings = reviewsByProduct[item.product_id] || [];
                        const review_count = ratings.length;
                        const average_rating = review_count > 0 ? ratings.reduce((sum, r) => sum + r, 0) / review_count : 0;
                        return { ...item, products: { ...item.products, average_rating, review_count } };
                    }
                    if (item.vendor_products) {
                        const vId = item.vendor_product_id;
                        const ratings = vendorReviewsByProduct[vId] || [];
                        const review_count = ratings.length;
                        const average_rating = review_count > 0 ? ratings.reduce((sum, r) => sum + r, 0) / review_count : 0;
                        return { ...item, vendor_products: { ...item.vendor_products, average_rating, review_count } };
                    }
                    return item;
                });
                setSavedProducts(enrichedProducts);
            }

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
    setSavedProducts(currentItems => currentItems.filter(item => item.product_id !== productId && item.vendor_product_id !== productId));
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
  
  const savedIdsSet = new Set([
      ...savedProducts.map(item => item.product_id),
      ...savedProducts.map(item => item.vendor_product_id)
  ].filter(Boolean));

  return (
      <main className="flex-1 min-h-screen pb-20">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="mb-6">
              <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:opacity-70 transition-all">
                  <ArrowLeft className="h-4 w-4" />
                  Back to My Account
              </Link>
          </div>
          <div className="flex flex-col gap-1 mb-8">
              <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Saved Items</h1>
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
                  {savedProducts.map((item) => {
                    const productData = item.products || item.vendor_products;
                    const pId = item.product_id || item.vendor_product_id;
                    return productData ? (
                      <ProductCard 
                        key={item.id} 
                        product={productData} 
                        user={user} 
                        isVendor={!!item.vendor_products}
                        isSaved={savedIdsSet.has(pId)} 
                        onUnsave={handleUnsaveProduct}
                      />
                    ) : null;
                  })}
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
