import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/supabase';
import { Sparkles } from 'lucide-react';
import { recommendProducts } from '@/ai/flows/ai-product-recommender';
import { FlashSaleProductCard } from './flash-sale-product-card';
import type { User } from '@supabase/supabase-js';

type ProductWithRating = Tables<'products'> & { average_rating: number; review_count: number };

async function getRecommendationData(
    user: User | null,
    allProductsWithRatings: ProductWithRating[]
): Promise<{ title: string; products: ProductWithRating[] }> {

    const allProductsForPrompt = allProductsWithRatings.map(p => ({ id: p.id, name: p.name, category: p.category }));

    if (!user) {
        // Not logged in: show random products
        const shuffled = allProductsWithRatings.sort(() => 0.5 - Math.random());
        return {
            title: "Popular Products",
            products: shuffled.slice(0, 8),
        };
    }

    const supabase = createClient();

    // Fetch user's interaction history
    const [
        { data: saved },
        { data: orders },
        { data: reviews }
    ] = await Promise.all([
        supabase.from('saved_products').select('product_id').eq('user_id', user.id),
        supabase.from('orders').select('product_id').eq('buyer_id', user.id),
        supabase.from('reviews').select('product_id').eq('user_id', user.id),
    ]);

    const interactedProductIds = new Set([
        ...(saved?.map(p => p.product_id) || []),
        ...(orders?.map(p => p.product_id) || []),
        ...(reviews?.map(p => p.product_id) || []),
    ]);

    if (interactedProductIds.size === 0) {
        // No history: show random products
        const shuffled = allProductsWithRatings.sort(() => 0.5 - Math.random());
        return {
            title: "Explore These Items",
            products: shuffled.slice(0, 8),
        };
    }
    
    const userHistoryProducts = allProductsForPrompt.filter(p => interactedProductIds.has(p.id));

    try {
        const result = await recommendProducts({
            userHistory: userHistoryProducts,
            allProducts: allProductsForPrompt.filter(p => !interactedProductIds.has(p.id)) // Don't recommend what they already have
        });

        const recommendedIds = result.recommendations;
        
        if (!recommendedIds || recommendedIds.length === 0) {
            throw new Error("AI returned no recommendations.");
        }

        const recommendedProducts = allProductsWithRatings
            .filter(p => recommendedIds.includes(p.id))
            .sort((a, b) => recommendedIds.indexOf(a.id) - recommendedIds.indexOf(b.id)); // Preserve order from AI

        return {
            title: "Recommended For You",
            products: recommendedProducts.slice(0, 5), // Ensure we only show 5
        };

    } catch (e) {
        console.error("AI Recommendation failed, falling back to random:", e);
        const shuffled = allProductsWithRatings.filter(p => !interactedProductIds.has(p.id)).sort(() => 0.5 - Math.random());
        return {
            title: "Discover Something New",
            products: shuffled.slice(0, 5),
        };
    }
}


export async function RecommendedForYouSection({ user, allProductsWithRatings }: { user: User | null, allProductsWithRatings: ProductWithRating[] }) {
    
    const { title, products } = await getRecommendationData(user, allProductsWithRatings);

    if (products.length === 0) return null;

    return (
        <div className="bg-card rounded-lg my-8">
             <div className="bg-accent text-accent-foreground p-3 flex justify-center items-center rounded-t-lg">
                 <div className="flex items-center gap-2">
                    <Sparkles className="h-6 w-6" />
                    <h2 className="text-xl font-bold text-center">{title}</h2>
                </div>
            </div>
            <div className="p-4 pt-0">
                <div className="flex gap-4 overflow-x-auto pb-2 -mb-2">
                    {products.map(product => (
                         <FlashSaleProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </div>
    )
}
