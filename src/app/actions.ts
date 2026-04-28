'use server';

import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/supabase';

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
    
    const shuffled = allProductsWithRatings.sort(() => 0.5 - Math.random());
    
    return { 
        title: user ? "Recommended For You" : "Popular Products", 
        products: shuffled.slice(0, 8) 
    };
}
