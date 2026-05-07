'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateProductTags } from '@/ai/flows/ai-product-tag-generator';
import { generateProductDescription } from '@/ai/flows/ai-product-description-assistant';
import { sendSms } from '@/lib/sendSms';

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

const CreateProductSchema = BaseProductSchema.extend({
  image: z
    .any()
    .refine((file) => file?.size > 0, 'Image is required.')
    .refine((file) => file?.size < 5 * 1024 * 1024, 'Max image size is 5MB.')
    .refine(
      (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file?.type),
      'Only .jpg, .jpeg, .png and .webp formats are supported.'
    ),
});

export async function createProduct(prevState: any, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { message: 'Unauthorized.', success: false, errors: {} };

    const rawFormData = Object.fromEntries(formData.entries());
    
    if (rawFormData.category === 'Other') {
        const customCategory = (rawFormData.custom_category as string)?.trim();
        rawFormData.category = customCategory || null;
    }

    const validatedFields = CreateProductSchema.safeParse({
        ...rawFormData,
        price: parseFloat(rawFormData.price as string),
        cost_price: rawFormData.cost_price ? parseFloat(rawFormData.cost_price as string) : undefined,
        quantity: parseInt(rawFormData.quantity as string, 10),
        discount_percentage: rawFormData.discount_percentage ? parseFloat(rawFormData.discount_percentage as string) : null,
        discount_end_date: rawFormData.discount_end_date || null
    });

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors, message: 'Invalid data', success: false };
    }

    const { name, description, price, cost_price, quantity, category, brand, image, discount_percentage, discount_end_date } = validatedFields.data;

    const imageFile = image as File;
    const fileName = `${Date.now()}-${imageFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from('product_images')
      .upload(fileName, imageFile);
    
    if (uploadError) {
      return { message: `Storage Error: ${uploadError.message}`, success: false, errors: {} };
    }

    const { data: urlData } = supabase.storage
      .from('product_images')
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      await supabase.storage.from('product_images').remove([fileName]);
      return { message: 'Could not get public URL for image.', success: false, errors: {} };
    }
    const publicUrl = urlData.publicUrl;

    let aiTags: string[] = [];
    try {
      const tagResponse = await generateProductTags({
        productName: name,
        description: description || '',
        category: category || '',
      });
      aiTags = tagResponse.tags;
    } catch (e) {
      console.error("AI Tag generation failed:", e);
    }

    const { error } = await supabase.from('products').insert({
        name,
        description,
        price,
        cost_price: cost_price || null,
        quantity,
        category: category || null,
        brand: brand || null,
        image_urls: [publicUrl],
        seller_id: user.id,
        is_featured: formData.get('is_featured') === 'on',
        is_outstanding: formData.get('is_outstanding') === 'on',
        discount_percentage: (discount_percentage && discount_end_date) ? discount_percentage : null,
        discount_end_date: (discount_percentage && discount_end_date) ? new Date(discount_end_date).toISOString() : null,
        tags: aiTags,
    });

    if (error) {
        await supabase.storage.from('product_images').remove([fileName]);
        return { message: error.message, success: false, errors: {} };
    }

    revalidatePath('/admin/procurement/products');
    revalidatePath('/');
    return { success: true };
}

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

    // --- Trigger SMS Price Drop Notification ---
    if (oldProduct && price < oldProduct.price) {
        const { data: wishlistedUsers } = await supabase
            .from('saved_products')
            .select('user_id, profiles(phone_number)')
            .eq('product_id', id);

        if (wishlistedUsers && wishlistedUsers.length > 0) {
            const usersWithPhones = wishlistedUsers.filter(u => (u.profiles as any)?.phone_number);
            const message = `DEFIMART PRICE DROP! 📉 Good news! The price of '${name}' in your wishlist has dropped to GHS ${price.toLocaleString()}. Grab it now before stock runs out!`;
            
            // Send SMS to each user
            await Promise.allSettled(
                usersWithPhones.map(u => sendSms({ phoneNumber: (u.profiles as any).phone_number, message }))
            );
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

/**
 * Fetches all admin products that need AI description enhancement.
 */
export async function getProductsNeedingEnhancement() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data, error } = await supabase
        .from('products')
        .select('id, name, description, category')
        .not('description', 'like', '%(AI Enhanced)%');
    
    if (error) return { success: false, error: error.message };

    // Find items that have no description or a very short/weak one
    const filtered = (data || []).filter(p => 
        !p.description || p.description.trim().length < 50
    );

    return { success: true, products: filtered };
}

/**
 * Enhances a single product description using Groq.
 */
export async function enhanceSingleProduct(product: { id: string, name: string, description: string | null, category: string | null }) {
    const supabase = await createClient();
    try {
        const aiResult = await generateProductDescription({
            productName: product.name,
            category: product.category || 'General',
            shortDescription: product.description || ''
        });

        if (aiResult.description) {
            const { error } = await supabase
                .from('products')
                .update({ description: aiResult.description })
                .eq('id', product.id);
            
            if (error) throw error;
            return { success: true };
        }
        return { success: false, error: 'No description returned from AI' };
    } catch (e: any) {
        console.error(`AI Enhancement failed for product ${product.id}:`, e);
        return { success: false, error: e.message || 'AI processing error' };
    }
}
