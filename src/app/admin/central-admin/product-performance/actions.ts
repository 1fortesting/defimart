'use server';

import { createServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';
import { generateReviewSummary } from '@/ai/flows/ai-review-summarizer';

export async function getReviewSummaryForProduct(productId: string) {
    if (!productId) {
        return { error: 'Product ID is required.' };
    }

    const supabaseAdmin = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: product, error: productError } = await supabaseAdmin.from('products').select('name').eq('id', productId).single();

    if (productError || !product) {
        return { error: 'Product not found.' };
    }

    const { data: reviews, error: reviewsError } = await supabaseAdmin
        .from('reviews')
        .select('rating, comment')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(20);

    if (reviewsError) {
        return { error: `Failed to fetch reviews: ${reviewsError.message}` };
    }
    
    if (!reviews || reviews.length === 0) {
        return { summary: 'No reviews available to summarize for this product.', sentiment: 'Neutral' };
    }
    
    try {
        const result = await generateReviewSummary({
            productName: product.name,
            reviews: reviews.map(r => ({ rating: r.rating, comment: r.comment || '' }))
        });
        return result;
    } catch(e: any) {
        console.error("AI Summary generation failed:", e);
        return { error: 'Failed to generate AI summary.' };
    }
}
