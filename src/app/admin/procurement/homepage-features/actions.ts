'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateFeatureStatus(productId: string, isFeatured: boolean, isOutstanding: boolean) {
    const supabase = createClient();
    const { error } = await supabase
        .from('products')
        .update({ is_featured: isFeatured, is_outstanding: isOutstanding })
        .eq('id', productId);

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath('/admin/procurement/homepage-features');
    revalidatePath('/'); // Revalidate homepage to show changes
    return { success: true };
}
