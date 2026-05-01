'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateProductTags } from '@/ai/flows/ai-product-tag-generator';
import { sendPush } from '@/lib/sendPush';

const BaseProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  cost_price: z.coerce.number().min(0, 'Cost price must be non-negative').optional(),
  quantity: z.coerce.number().int().min(0, 'Quantity must be a non-negative integer'),
  category: z.string().optional(),
  brand: z.string().optional(),
  discount_percentage: z.coerce.number().min(0).max(100).nullable().optional(),
  discount_end_date: z.string().nullable().optional(),
});

const UpdateProductSchema = BaseProductSchema.extend({
  id: z.string().min(1, 'Product ID is required'),
  image: z.any().optional(),
});

export async function updateProduct(prevState: any, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: 'Unauthorized.', success: false, errors: {} };

    const rawFormData = Object.fromEntries(formData.entries());
    const validatedFields = UpdateProductSchema.safeParse(rawFormData);

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors, message: 'Invalid data', success: false };
    }

    const { id, name, price } = validatedFields.data;

    // Check current price for drop detection
    const { data: oldProduct } = await supabase.from('products').select('price').eq('id', id).single();
    
    const { error: updateError } = await supabase.from('products').update({
        ...validatedFields.data,
        is_featured: formData.get('is_featured') === 'on',
        is_outstanding: formData.get('is_outstanding') === 'on',
    }).eq('id', id);

    if (updateError) return { message: updateError.message, success: false, errors: {} };

    // Trigger price drop notification if price decreased
    if (oldProduct && price < oldProduct.price) {
        const { data: wishlistedUsers } = await supabase.from('saved_products').select('user_id').eq('product_id', id);
        if (wishlistedUsers && wishlistedUsers.length > 0) {
            const userIds = wishlistedUsers.map(u => u.user_id);
            await sendPush({
                userIds,
                title: 'Price Drop Alert! 📉',
                body: `Good news! The price of '${name}' in your wishlist has dropped to GHS ${price.toLocaleString()}. Check it out now!`,
                type: 'Wishlist Update',
                role: 'Procurement'
            });
        }
    }

    revalidatePath('/admin/procurement/products');
    revalidatePath(`/products/${id}`);
    revalidatePath('/');
    return { success: true };
}

export async function deleteProduct(formData: FormData) {
    const supabase = await createClient();
    const productId = formData.get('productId') as string;
    await supabase.from('products').delete().eq('id', productId);
    revalidatePath('/admin/procurement/products');
    revalidatePath('/');
}
