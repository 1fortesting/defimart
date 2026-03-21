'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ReviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().optional(),
  productId: z.string().uuid(),
});

export async function submitReview(prevState: any, formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'You must be logged in to submit a review.' };
    }

    const validatedFields = ReviewSchema.safeParse({
        rating: formData.get('rating'),
        comment: formData.get('comment'),
        productId: formData.get('productId'),
    });

    if (!validatedFields.success) {
        return {
          errors: validatedFields.error.flatten().fieldErrors,
          message: 'Invalid fields provided.',
          success: false,
        };
    }
    
    const { rating, comment, productId } = validatedFields.data;

    // Check if user has already reviewed
    const { data: existingReview, error: fetchError } = await supabase
        .from('reviews')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single();
    
    let error;

    if (existingReview) {
        // Update existing review
        const { error: updateError } = await supabase
            .from('reviews')
            .update({ rating, comment: comment || null, created_at: new Date().toISOString() })
            .eq('id', existingReview.id);
        error = updateError;
    } else {
        // Insert new review
        const { error: insertError } = await supabase.from('reviews').insert({
            product_id: productId,
            user_id: user.id,
            rating,
            comment: comment || null,
        });
        error = insertError;
    }


    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath(`/products/${productId}`);
    return { success: true, message: 'Review submitted successfully!' };
}
