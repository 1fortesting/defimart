'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ReviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().optional(),
  productId: z.string().uuid(),
  isVendor: z.string().optional(), // Passed as a string "true" from hidden form input
});

export async function submitReview(prevState: any, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'You must be logged in to submit a review.' };
    }

    const validatedFields = ReviewSchema.safeParse({
        rating: formData.get('rating'),
        comment: formData.get('comment'),
        productId: formData.get('productId'),
        isVendor: formData.get('isVendor'),
    });

    if (!validatedFields.success) {
        return {
          errors: validatedFields.error.flatten().fieldErrors,
          message: 'Invalid fields provided.',
          success: false,
        };
    }
    
    const { rating, comment, productId, isVendor } = validatedFields.data;
    const isVendorProduct = isVendor === 'true';

    // Target the appropriate table
    const table = isVendorProduct ? 'vendor_reviews' : 'reviews';
    const foreignKeyField = isVendorProduct ? 'vendor_product_id' : 'product_id';

    // Check if user has already reviewed this specific ID 
    const { data: existingReview } = await supabase
        .from(table)
        .select('id')
        .eq('user_id', user.id)
        .eq(foreignKeyField, productId)
        .maybeSingle();
    
    let error;

    if (existingReview) {
        // Update existing review
        const { error: updateError } = await supabase
            .from(table)
            .update({ 
                rating, 
                comment: comment || null, 
                created_at: new Date().toISOString() 
            })
            .eq('id', existingReview.id);
        error = updateError;
    } else {
        // Insert new review
        const { error: insertError } = await supabase.from(table).insert({
            [foreignKeyField]: productId,
            user_id: user.id,
            rating,
            comment: comment || null,
        });
        error = insertError;
    }

    if (error) {
        console.error('Review DB Error:', error);
        return { success: false, message: 'Could not save review. Please try again.' };
    }

    revalidatePath(`/products/${productId}`);
    revalidatePath('/'); 
    revalidatePath('/shops');
    revalidatePath('/search');
    
    return { success: true, message: 'Feedback posted!' };
}
