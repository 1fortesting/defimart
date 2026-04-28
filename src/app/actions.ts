'use server';

import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/supabase';
import { recommendProducts } from '@/ai/flows/ai-product-recommender';

type ProductWithRating = Tables<'products'> & { average_rating: number; review_count: number };

export async function getRecommendations(): Promise<{ title: string; products: ProductWithRating[] }> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: productsData } = await supabase.from('products').select('*');
    const { data: reviewsData } = await supabase.from('reviews').select('product_id, rating');

    if (!productsData) {
        return { title: "Explore These Items", products: [] };
    }

    const reviewsByProduct = (reviewsData || []).reduce((acc, review) => {
        if (!acc[review.product_id]) acc[review.product_id] = [];
        acc[review.product_id].push(review.rating);
        return acc;
    }, {} as Record<string, number[]>);

    const allProductsWithRatings: ProductWithRating[] = productsData.map(p => {
        const ratings = reviewsByProduct[p.id] || [];
        return { ...p, review_count: ratings.length, average_rating: ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0 };
    });
    
    const allProductsForPrompt = allProductsWithRatings.map(p => ({ id: p.id, name: p.name, category: p.category }));

    if (!user) {
        const shuffled = allProductsWithRatings.sort(() => 0.5 - Math.random());
        return { title: "Popular Products", products: shuffled.slice(0, 8) };
    }

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

    const userHistoryProducts = allProductsForPrompt.filter(p => interactedProductIds.has(p.id));
    const availableProducts = allProductsForPrompt.filter(p => !interactedProductIds.has(p.id));

    if (userHistoryProducts.length === 0 || availableProducts.length < 5) {
        const shuffled = availableProducts.length > 0 ? availableProducts.sort(() => 0.5 - Math.random()) : allProductsForPrompt.sort(() => 0.5 - Math.random());
        const productsToShow = allProductsWithRatings.filter(p => shuffled.map(s => s.id).includes(p.id)).slice(0, 5);
        return { title: "Explore These Items", products: productsToShow };
    }

    try {
        const result = await recommendProducts({
            userHistory: userHistoryProducts,
            allProducts: availableProducts
        });
        const recommendedIds = result.recommendations;

        if (!recommendedIds || recommendedIds.length === 0) throw new Error("AI returned no recommendations.");
        
        const recommendedProducts = allProductsWithRatings
            .filter(p => recommendedIds.includes(p.id))
            .sort((a, b) => recommendedIds.indexOf(a.id) - recommendedIds.indexOf(b.id)); // Preserve order from AI

        return { title: "Recommended For You", products: recommendedProducts.slice(0, 5) };

    } catch (e) {
        console.error("AI Recommendation failed, falling back to random:", e);
        const shuffled = availableProducts.sort(() => 0.5 - Math.random());
        const productsToShow = allProductsWithRatings.filter(p => shuffled.map(s => s.id).includes(p.id)).slice(0, 5);
        return { title: "Discover Something New", products: productsToShow };
    }
}
